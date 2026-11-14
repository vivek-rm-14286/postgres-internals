# F — Part IV Client Interfaces (ch.32 libpq, ch.33 Large Objects, ch.34 ECPG, ch.35 Information Schema)

Source: PostgreSQL 18.7 docs, _order.tsv idx 301-433 (133 pages, all read in full).

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 301 | client-interfaces.txt | Part IV intro: client interfaces shipped with PG; TOC of ch.32-35 |
| 302 | libpq.txt | libpq overview: C API, engine for other drivers; include libpq-fe.h, link -lpq |
| 303 | libpq-connect.txt | Connection functions, conninfo/URI syntax, multi-host rules, all ~55 parameter keywords with defaults |
| 304 | libpq-status.txt | Status accessors, PQstatus/PQtransactionStatus, ParameterStatus list, version numbering, SSL attributes |
| 305 | libpq-exec.txt | PQexec/PQexecParams/PQprepare etc., ExecStatusType, error fields, result accessors, escaping |
| 306 | libpq-async.txt | Async API: PQsend*, PQgetResult, PQconsumeInput/PQisBusy, nonblocking + PQflush loop |
| 307 | libpq-pipeline-mode.txt | Pipeline mode: rules, sync points, PIPELINE_ABORTED, transaction semantics, when to use (30 s vs 0.3 s) |
| 308 | libpq-single-row-mode.txt | Single-row and chunked result modes; partial rows before an error |
| 309 | libpq-cancel.txt | PQcancelCreate/Blocking/Start/Poll; deprecated unencrypted PQcancel/PQrequestCancel |
| 310 | libpq-fastpath.txt | PQfn fast-path: unsafe/obsolete, use prepared statements with binary I/O |
| 311 | libpq-notify.txt | LISTEN/NOTIFY via PQnotifies; PGnotify struct; select+PQconsumeInput pattern |
| 312 | libpq-copy.txt | COPY: PQputCopyData/PQputCopyEnd/PQgetCopyData return codes; obsolete line-based API |
| 313 | libpq-control.txt | Client encoding, error verbosity/context visibility, PQtrace format and flags |
| 314 | libpq-misc.txt | PQfreemem, PQencryptPasswordConn/PQchangePassword, PGresult builders, PQlibVersion |
| 315 | libpq-notice-processing.txt | Notice receiver vs notice processor; default prints to stderr |
| 316 | libpq-events.txt | Event system: PGEVT_* events, instance data, PQregisterEventProc |
| 317 | libpq-envars.txt | All PG* environment variables mapped to keywords; PGDATESTYLE/PGTZ/PGGEQO, PGSYSCONFDIR |
| 318 | libpq-pgpass.txt | .pgpass format, wildcard/first-match, localhost matching, 0600 requirement |
| 319 | libpq-pgservice.txt | pg_service.conf: user vs system file, INI format, precedence |
| 320 | libpq-ldap.txt | LDAP lookup of connection parameters from service file |
| 321 | libpq-ssl.txt | SSL: certificate verification, SAN/CN rules, client certs, sslmode protection table, client files |
| 322 | libpq-oauth.txt | OAuth device flow (RFC 8628), auth data hooks, PGOAUTHDEBUG |
| 323 | libpq-threading.txt | Thread safety (always since 17); one PGconn per thread |
| 324 | libpq-build.txt | Building libpq programs: -I/-L/-lpq, pg_config, pkg-config, common errors |
| 325 | libpq-example.txt | Example programs: cursor fetch, LISTEN loop, PQexecParams with binary I/O |
| 326 | largeobjects.txt | Large objects chapter intro: stream-style access |
| 327 | lo-intro.txt | LO intro: pg_largeobject + metadata; 4 TB vs TOAST 1 GB; partial updates |
| 328 | lo-implementation.txt | LO implementation: chunks + B-tree, sparse storage, privileges since 9.0 |
| 329 | lo-interfaces.txt | LO libpq API: lo_create/import/export/open/read/write/lseek64/tell64/truncate/close/unlink; snapshot semantics |
| 330 | lo-funcs.txt | Server-side LO SQL functions: lo_from_bytea, lo_put, lo_get, loread/lowrite; server lo_import security |
| 331 | lo-examplesect.txt | testlo.c example: import, pick out, overwrite, export inside a transaction |
| 332 | ecpg.txt | ECPG chapter intro and TOC |
| 333 | ecpg-concept.txt | ECPG concept: .pgc -> ecpg -> .c; EXEC SQL syntax rules |
| 334 | ecpg-connect.txt | ECPG connections: CONNECT targets/user forms, AT, SET CONNECTION, DECLARE STATEMENT, DISCONNECT |
| 335 | ecpg-commands.txt | ECPG commands: statements, cursors, transactions (no autocommit by default), prepared statements with ? |
| 336 | ecpg-variables.txt | Host variables: declare sections, INTO, type mapping table, VARCHAR/bytea structs, arrays/structs, indicators |
| 337 | ecpg-dynamic.txt | Dynamic SQL: EXECUTE IMMEDIATE, PREPARE/EXECUTE USING/INTO, cursors on prepared statements |
| 338 | ecpg-pgtypes.txt | pgtypes library: numeric/date/timestamp/interval/decimal functions, errno values, PGTYPESInvalidTimestamp |
| 339 | ecpg-descriptors.txt | Descriptor areas: named SQL descriptors (GET/SET DESCRIPTOR items) and SQLDA structs |
| 340 | ecpg-errors.txt | Error handling: WHENEVER conditions/actions, sqlca struct, SQLSTATE vs SQLCODE table |
| 341 | ecpg-preproc.txt | Preprocessor directives: INCLUDE search order, DEFINE/UNDEF, ifdef nesting (127) |
| 342 | ecpg-process.txt | Processing ECPG programs: ecpg, cc, -lecpg, make rule |
| 343 | ecpg-library.txt | Library functions: ECPGdebug, ECPGget_PGconn, ECPGtransactionStatus, ECPGstatus |
| 344 | ecpg-lo.txt | Large objects from ECPG via ECPGget_PGconn + libpq lo_* (example) |
| 345 | ecpg-cpp.txt | C++ applications: scope limits, wrap SQL in a C module |
| 346 | ecpg-sql-commands.txt | Embedded SQL command list |
| 347 | ecpg-sql-allocate-descriptor.txt | ALLOCATE DESCRIPTOR synopsis |
| 348 | ecpg-sql-connect.txt | CONNECT synopsis, target forms, many examples |
| 349 | ecpg-sql-deallocate-descriptor.txt | DEALLOCATE DESCRIPTOR synopsis |
| 350 | ecpg-sql-declare.txt | DECLARE cursor (executes at OPEN) |
| 351 | ecpg-sql-declare-statement.txt | DECLARE STATEMENT: bind statement id to a connection per precompile unit |
| 352 | ecpg-sql-describe.txt | DESCRIBE: metadata into SQL descriptor or SQLDA |
| 353 | ecpg-sql-disconnect.txt | DISCONNECT name/CURRENT/ALL |
| 354 | ecpg-sql-execute-immediate.txt | EXECUTE IMMEDIATE; octal \042 for quotes in literals |
| 355 | ecpg-sql-get-descriptor.txt | GET DESCRIPTOR header COUNT and item fields; example |
| 356 | ecpg-sql-open.txt | OPEN cursor with USING values or descriptor |
| 357 | ecpg-sql-prepare.txt | PREPARE FROM string with ? placeholders |
| 358 | ecpg-sql-set-autocommit.txt | SET AUTOCOMMIT (ECPG extension, default off) |
| 359 | ecpg-sql-set-connection.txt | SET CONNECTION |
| 360 | ecpg-sql-set-descriptor.txt | SET DESCRIPTOR header/items |
| 361 | ecpg-sql-type.txt | TYPE type_name IS ctype (needs -c) |
| 362 | ecpg-sql-var.txt | VAR varname IS ctype |
| 363 | ecpg-sql-whenever.txt | WHENEVER examples incl. DO BREAK loop |
| 364 | ecpg-informix-compat.txt | Informix mode: $ syntax, string type, compat SQLDA, dec*/r*/dt* functions, -12xx constants |
| 365 | ecpg-oracle-compat.txt | Oracle mode: Pro*C-like padding and indicators |
| 366 | ecpg-develop.txt | ECPG internals: ECPGdo argument layout, 10 args per variable |
| 367 | information-schema.txt | Information schema intro: portable views; duplicate constraint name caveat |
| 368 | infoschema-schema.txt | information_schema schema: owner, not on search_path |
| 369 | infoschema-datatypes.txt | Five domain types: cardinal_number, character_data, sql_identifier, time_stamp, yes_or_no |
| 370 | infoschema-information-schema-catalog-name.txt | information_schema_catalog_name: one-row table with current DB |
| 371 | infoschema-administrable-role-authorizations.txt | administrable_role_authorizations: roles with ADMIN option |
| 372 | infoschema-applicable-roles.txt | applicable_roles: roles usable via grant chains |
| 373 | infoschema-attributes.txt | attributes: composite type attributes |
| 374 | infoschema-character-sets.txt | character_sets: the single DB encoding; repertoire/encoding form terminology |
| 375 | infoschema-check-constraint-routine-usage.txt | check_constraint_routine_usage: routines used by check constraints |
| 376 | infoschema-check-constraints.txt | check_constraints: table/domain checks including NOT NULL |
| 377 | infoschema-collations.txt | collations: pad_attribute always NO PAD |
| 378 | infoschema-collation-character-set-applicab.txt | collation_character_set_applicability: one charset per DB |
| 379 | infoschema-column-column-usage.txt | column_column_usage: generated column dependencies |
| 380 | infoschema-column-domain-usage.txt | column_domain_usage: columns using domains |
| 381 | infoschema-column-options.txt | column_options: foreign table column options |
| 382 | infoschema-column-privileges.txt | column_privileges: per-column grants (SELECT/INSERT/UPDATE/REFERENCES) |
| 383 | infoschema-column-udt-usage.txt | column_udt_usage: columns by owned data types (built-ins included) |
| 384 | infoschema-columns.txt | columns: full column metadata incl. identity/generated; data_type vs udt vs domain |
| 385 | infoschema-constraint-column-usage.txt | constraint_column_usage: columns used by constraints |
| 386 | infoschema-constraint-table-usage.txt | constraint_table_usage: tables used by constraints |
| 387 | infoschema-data-type-privileges.txt | data_type_privileges: data type descriptors |
| 388 | infoschema-domain-constraints.txt | domain_constraints: domain constraints and deferrability |
| 389 | infoschema-domain-udt-usage.txt | domain_udt_usage: domains by owned base types |
| 390 | infoschema-domains.txt | domains: domain metadata and defaults |
| 391 | infoschema-element-types.txt | element_types: array element descriptors + documented join |
| 392 | infoschema-enabled-roles.txt | enabled_roles: automatically inherited role set |
| 393 | infoschema-foreign-data-wrapper-options.txt | foreign_data_wrapper_options |
| 394 | infoschema-foreign-data-wrappers.txt | foreign_data_wrappers |
| 395 | infoschema-foreign-server-options.txt | foreign_server_options |
| 396 | infoschema-foreign-servers.txt | foreign_servers |
| 397 | infoschema-foreign-table-options.txt | foreign_table_options |
| 398 | infoschema-foreign-tables.txt | foreign_tables |
| 399 | infoschema-key-column-usage.txt | key_column_usage: PK/unique/FK columns and positions |
| 400 | infoschema-parameters.txt | parameters: function parameters, modes, defaults |
| 401 | infoschema-referential-constraints.txt | referential_constraints: match option and update/delete rules |
| 402 | infoschema-role-column-grants.txt | role_column_grants: column grants excluding PUBLIC |
| 403 | infoschema-role-routine-grants.txt | role_routine_grants: EXECUTE grants excluding PUBLIC |
| 404 | infoschema-role-table-grants.txt | role_table_grants: table grants excluding PUBLIC |
| 405 | infoschema-role-udt-grants.txt | role_udt_grants: always empty in PostgreSQL |
| 406 | infoschema-role-usage-grants.txt | role_usage_grants: USAGE grants excluding PUBLIC |
| 407 | infoschema-routine-column-usage.txt | routine_column_usage: columns used by unquoted SQL bodies |
| 408 | infoschema-routine-privileges.txt | routine_privileges: EXECUTE grants |
| 409 | infoschema-routine-routine-usage.txt | routine_routine_usage: routine-to-routine dependencies (specific names) |
| 410 | infoschema-routine-sequence-usage.txt | routine_sequence_usage: sequences used by routines |
| 411 | infoschema-routine-table-usage.txt | routine_table_usage: not tracked by PostgreSQL |
| 412 | infoschema-routines.txt | routines: functions/procedures metadata, many n/a columns |
| 413 | infoschema-schemata.txt | schemata: schemas and owners |
| 414 | infoschema-sequences.txt | sequences: values returned as strings |
| 415 | infoschema-sql-features.txt | sql_features: SQL standard feature support (Appendix D) |
| 416 | infoschema-sql-implementation-info.txt | sql_implementation_info: ODBC implementation items |
| 417 | infoschema-sql-parts.txt | sql_parts: support for SQL standard parts |
| 418 | infoschema-sql-sizing.txt | sql_sizing: ODBC size limits |
| 419 | infoschema-table-constraints.txt | table_constraints: constraint types, enforced, nulls_distinct |
| 420 | infoschema-table-privileges.txt | table_privileges: table grants, with_hierarchy |
| 421 | infoschema-tables.txt | tables: table_type values, insertable, typed |
| 422 | infoschema-transforms.txt | transforms: from/to SQL functions, group_name = language |
| 423 | infoschema-triggered-update-columns.txt | triggered_update_columns: UPDATE OF column lists |
| 424 | infoschema-triggers.txt | triggers: trigger metadata, two incompatibilities with standard, 9.1 renames |
| 425 | infoschema-udt-privileges.txt | udt_privileges: TYPE USAGE on composite types |
| 426 | infoschema-usage-privileges.txt | usage_privileges: USAGE on collations/domains/FDW/servers/sequences |
| 427 | infoschema-user-defined-types.txt | user_defined_types: composite types only (STRUCTURED) |
| 428 | infoschema-user-mapping-options.txt | user_mapping_options: option_value hidden to protect passwords |
| 429 | infoschema-user-mappings.txt | user_mappings |
| 430 | infoschema-view-column-usage.txt | view_column_usage: columns used by views (no system tables) |
| 431 | infoschema-view-routine-usage.txt | view_routine_usage: routines used by views |
| 432 | infoschema-view-table-usage.txt | view_table_usage: tables used by views (no system tables) |
| 433 | infoschema-views.txt | views: definition, check_option, updatability flags |

## Notes by topic

### Part IV overview & libpq basics  [M6]  (source: client-interfaces.txt, libpq.txt)
- Part IV = client programming interfaces shipped with PostgreSQL: ch.32 libpq (C library), ch.33 Large Objects, ch.34 ECPG (embedded SQL in C), ch.35 Information Schema. Other interfaces are distributed separately (Appendix H).
- libpq is "the C application programmer's interface to PostgreSQL" and the underlying engine for other interfaces (C++, Perl, Python, Tcl, ECPG). Therefore libpq behaviours visible to users of ANY libpq-based client: environment variables (32.15), password file (32.16), SSL support (32.19).
- Clients must `#include <libpq-fe.h>` and link with the libpq library. Complete examples in `src/test/examples`.

### libpq connection functions  [M6, M1]  (source: libpq-connect.txt)
- Each connection is a `PGconn` object, obtained from `PQconnectdb`, `PQconnectdbParams`, or `PQsetdbLogin`. These always return non-NULL unless out of memory even for the PGconn; you MUST call `PQstatus` to check success. An app may hold several connections at once (e.g. to several databases).
- Warning (search_path security): if untrusted users have access to a DB that hasn't adopted a secure schema usage pattern, begin each session by removing publicly-writable schemas from search_path: set connection parameter `options` to `-csearch_path=`, or run `PQexec(conn, "SELECT pg_catalog.set_config('search_path', '', false)")`. Applies to every interface executing arbitrary SQL.
- Warning (fork): on Unix, forking a process with open libpq connections gives unpredictable results (parent and child share sockets/OS resources); not recommended. `exec` from the child to load a new executable is safe.
- `PGconn *PQconnectdbParams(const char * const *keywords, const char * const *values, int expand_dbname)` — two NULL-terminated parallel arrays. Preferred for new code (parameter set extensible without signature change). Processing stops at first NULL keyword; a NULL or empty-string value causes that entry to be ignored. If `expand_dbname` != 0, the FIRST `dbname` value is checked: it is a connection string if it contains `=` or begins with a URI scheme designator, and is expanded; later `dbname` entries are plain names. Arrays processed start to end; for repeated keywords the last non-NULL/non-empty value wins. So array entries before the expanded dbname can be overridden by the connection string, and entries after dbname override the string.
- Defaults resolution order for unset parameters: (1) explicit parameter, (2) corresponding environment variable (32.15), (3) built-in default.
- `PGconn *PQconnectdb(const char *conninfo)` — conninfo may be empty (all defaults), whitespace-separated keyword=value settings, or a URI.
- `PGconn *PQsetdbLogin(pghost, pgport, pgoptions, pgtty, dbName, login, pwd)` — predecessor with fixed parameter set; NULL/"" = default. If dbName contains `=` or a valid URI prefix it is treated as conninfo. `pgtty` is no longer used (ignored). `PQsetdb(pghost, pgport, pgoptions, pgtty, dbName)` is a macro calling PQsetdbLogin with NULL login/pwd (backward compat for very old programs).
- Nonblocking connect: `PQconnectStartParams(keywords, values, expand_dbname)`, `PQconnectStart(conninfo)`, `PostgresPollingStatusType PQconnectPoll(PGconn *conn)`. None block provided: (a) `hostaddr` is used so no DNS lookup happens, (b) if `PQtrace` is used the trace stream must not block, (c) the socket is in the right state before each `PQconnectPoll`.
  1. Call PQconnectStart[Params]. NULL => could not allocate PGconn. Otherwise call `PQstatus(conn)`; `CONNECTION_BAD` => already failed (typically invalid parameters).
  2. Get socket via `PQsocket(conn)` (do NOT assume it stays the same across PQconnectPoll calls).
  3. Loop: if last PQconnectPoll returned `PGRES_POLLING_READING`, wait for socket readable (select/poll/`PQsocketPoll`), call PQconnectPoll again; if `PGRES_POLLING_WRITING`, wait writable then call again. On the first iteration behave as if it last returned `PGRES_POLLING_WRITING`.
  4. Stop at `PGRES_POLLING_FAILED` (failed) or `PGRES_POLLING_OK` (connected).
- Connection statuses that may be seen ONLY during an async connect (via PQstatus): `CONNECTION_STARTED` (waiting for connection to be made), `CONNECTION_MADE` (connection OK; waiting to send), `CONNECTION_AWAITING_RESPONSE` (waiting for server response), `CONNECTION_AUTH_OK` (received authentication; waiting for backend start-up to finish), `CONNECTION_SSL_STARTUP` (negotiating SSL encryption), `CONNECTION_GSS_STARTUP` (negotiating GSS encryption), `CONNECTION_CHECK_WRITABLE` (checking if connection can handle write transactions), `CONNECTION_CHECK_STANDBY` (checking if server is in standby mode), `CONNECTION_CONSUME` (consuming remaining response messages). Apps must never rely on these occurring in a given order, or at all. Final states: `CONNECTION_OK`, `CONNECTION_BAD`.
- `connect_timeout` is IGNORED when using PQconnectPoll; the app must implement its own timeout. Otherwise PQconnectStart + PQconnectPoll loop == PQconnectdb.
- If PQconnectStart[Params] returns non-NULL you must call `PQfinish` even if the attempt fails/abandoned.
- `int PQsocketPoll(int sock, int forRead, int forWrite, pg_usec_time_t end_time)` (`typedef int64_t pg_usec_time_t`): `end_time` = absolute time in microseconds since Unix epoch; -1 = infinite; 0 (or any past time) = no blocking. Compute with `PQgetCurrentTimeUSec()` + delta. Returns >0 condition met, 0 timeout, -1 error (see errno). If both forRead and forWrite are 0 it returns timeout immediately. Implemented with poll(2) or select(2).
- `PQconninfoOption *PQconndefaults(void)` — array ending with NULL keyword. Struct `PQconninfoOption { char *keyword; char *envvar; char *compiled; char *val; char *label; char *dispchar; int dispsize; }`; dispchar: "" display as-is, "*" password (hide), "D" debug option (don't show by default). val depends on env vars; missing/invalid service file silently ignored. Free with `PQconninfoFree` (else leak).
- `PQconninfoOption *PQconninfo(PGconn *conn)` — options used by a live connection.
- `PQconninfoOption *PQconninfoParse(const char *conninfo, char **errmsg)` — parse a string; options not present have val NULL (defaults NOT inserted). On error returns NULL and `*errmsg` is malloc'd (free with `PQfreemem`); NULL return with `*errmsg` NULL = out of memory.
- `void PQfinish(PGconn *conn)` — closes and frees; must be called even after failed connect; pointer unusable after.
- `void PQreset(PGconn *conn)` — close and reconnect with same parameters (error recovery). Nonblocking: `int PQresetStart(conn)` (0 = failed, 1 = ok then poll) and `PostgresPollingStatusType PQresetPoll(conn)` (same loop as PQconnectPoll).
- `PGPing PQpingParams(keywords, values, expand_dbname)` / `PGPing PQping(const char *conninfo)` — server status; correct user/password/dbname NOT needed (but wrong values make the server log a failed connection attempt). Returns: `PQPING_OK` (running, accepting connections), `PQPING_REJECT` (running but disallows connections: startup, shutdown, or crash recovery), `PQPING_NO_RESPONSE` (could not be contacted: not running / wrong params e.g. port / network problem e.g. firewall), `PQPING_NO_ATTEMPT` (no attempt: obviously incorrect params or client-side problem like OOM).
- `void PQsetSSLKeyPassHook_OpenSSL(PQsslKeyPassHook_OpenSSL_type hook)` — override handling of encrypted client key files; callback `int callback_fn(char *buf, int size, PGconn *conn)` copies the null-terminated password into buf, returns its length excluding terminator; on failure set `buf[0]='\0'` and return 0. Default handler `PQdefaultSSLKeyPassHook_OpenSSL`. Explicit key path is in `conn->sslkey` (empty if default path). Callback must not longjmp/throw. `PQgetSSLKeyPassHook_OpenSSL(void)` returns current hook or NULL.

### Connection strings & URIs  [M6, M1, M7]  (source: libpq-connect.txt §32.1.1)
- Two formats: keyword/value strings and URIs (RFC 3986 except multi-host allowed).
- Keyword/value: `keyword = value` settings separated by space(s); spaces around `=` optional. Empty value or value with spaces: single-quote it (`keyword = 'a value'`). Inside a value, escape single quote and backslash with backslash: `\'` and `\\`. Example: `host=localhost port=5432 dbname=mydb connect_timeout=10`.
- URI general form: `postgresql://[userspec@][hostspec][/dbname][?paramspec]` where userspec = `user[:password]`, hostspec = `[host][:port][,...]`, paramspec = `name=value[&...]`. Scheme designator is `postgresql://` or `postgres://`. Every other part is optional.
- Valid examples: `postgresql://`, `postgresql://localhost`, `postgresql://localhost:5433`, `postgresql://localhost/mydb`, `postgresql://user@localhost`, `postgresql://user:secret@localhost`, `postgresql://other@localhost/otherdb?connect_timeout=10&application_name=myapp`, `postgresql://host1:123,host2:456/somedb?target_session_attrs=any&application_name=myapp`.
- Hierarchical parts may instead be named parameters: `postgresql:///mydb?host=localhost&port=5433`.
- All named parameters must be keywords of §32.1.2, EXCEPT JDBC compatibility: `ssl=true` is translated to `sslmode=require`.
- Percent-encoding required for special symbols: `postgresql://user@localhost:5433/mydb?options=-c%20synchronous_commit%3Doff` (`=` -> `%3D`, space -> `%20`).
- IPv6 host in brackets: `postgresql://[2001:db8::1234]/database`.
- Unix-domain socket chosen if host part is empty or looks like an absolute path. Since `/` is reserved in the hierarchical part: `postgresql:///dbname?host=/var/lib/postgresql` or percent-encode `postgresql://%2Fvar%2Flib%2Fpostgresql/dbname`.
- Multi-host URI `postgresql://host1:port1,host2:port2,host3:port3/` == `host=host1,host2,host3 port=port1,port2,port3`.
- Multiple hosts (§32.1.1.3): in keyword/value format `host`, `hostaddr`, `port` accept comma-separated lists; same number of elements in each specified option; exception: a single port applies to all hosts. A single host name may map to multiple addresses (IPv4+IPv6). All hosts and addresses are tried in order until one succeeds; if none reachable the connection fails. IMPORTANT: if a connection is established but AUTHENTICATION FAILS, remaining hosts are NOT tried. Password file can give different passwords per host; all other options are identical for every host (cannot give different usernames per host).

### libpq connection parameter key words  [M6, M1, M7]  (source: libpq-connect.txt §32.1.2)
(Full list repeated in "Complete inventories"; behaviour details here.)
- `host`: host name; if it looks like an absolute path => Unix-domain socket directory (Unix: starts with `/`; Windows: drive-letter paths also). Starts with `@` => abstract-namespace Unix socket (Linux and Windows). Default when unset/empty: Unix socket in `/tmp` (or build-time socket dir); on Windows default is `localhost`. Comma-separated list accepted; an empty item selects the default behaviour.
- `hostaddr`: numeric IP (IPv4 e.g. `172.28.40.9`, or IPv6). Nonempty => always TCP/IP; avoids DNS lookup. But a host NAME is required for GSSAPI/SSPI auth and for `verify-full`. Rules: host without hostaddr => name lookup (in PQconnectPoll the lookup happens when that host is first considered and may block significantly); hostaddr without host => hostaddr is the address, fails if auth method needs a host name; both => hostaddr is the address, host ignored unless auth needs it. When both given, `host` identifies the connection in the password file. Comma list accepted; empty item => corresponding host name (or default host).
- `port`: port number, or socket file name extension for Unix-domain sockets. Comma list of same length as hosts or one port for all; empty => build-time default port.
- `dbname`: defaults to the user name. `user`: defaults to OS user name. `password`: used if server demands password auth.
- `passfile`: password file; default `~/.pgpass`, or `%APPDATA%\postgresql\pgpass.conf` on Windows; no error if missing.
- `require_auth`: auth method(s) the client REQUIRES of the server; connection fails if server uses another method or doesn't complete the handshake. Comma list: server must use exactly one of them. Default: any method accepted and server may skip authentication altogether. Negation with `!` prefix (server must NOT attempt listed method; any other is OK incl. no auth); negated and non-negated forms cannot be mixed. Methods: `password` (plaintext), `md5` (MD5 hashed; MD5 support is deprecated and will be removed in a future release), `gss` (Kerberos handshake via GSSAPI or GSS-encrypted channel), `sspi` (Windows SSPI), `scram-sha-256` (must successfully COMPLETE a SCRAM-SHA-256 exchange), `oauth` (server must request an OAuth bearer token), `none` (server must not prompt for an authentication exchange — does not prohibit TLS client cert auth or GSS via encrypted transport; may be negated `!none` to require some auth).
- `channel_binding`: `require` | `prefer` | `disable`. Default `prefer` if compiled with SSL, else `disable`. Channel binding = server authenticates itself to client; only over SSL with PostgreSQL 11+ servers using SCRAM.
- `connect_timeout`: seconds (decimal integer). Zero, negative, or unspecified = wait indefinitely. Applies SEPARATELY per host name / IP address (2 hosts, timeout 5 => up to 10 s total).
- `client_encoding`: sets `client_encoding` GUC; special value `auto` = derive from client locale (`LC_CTYPE` on Unix).
- `options`: command-line options sent to server at start, e.g. `-c geqo=off` or `--geqo=off`. Spaces separate arguments unless backslash-escaped; `\\` = literal backslash.
- `application_name`; `fallback_application_name` (used only if no application_name given via parameter or `PGAPPNAME`; for generic utilities).
- TCP keepalives (ignored on Unix-domain sockets): `keepalives` (default 1 = on; 0 = off); `keepalives_idle` (seconds of inactivity before keepalive; 0 = system default; needs TCP_KEEPIDLE or equivalent, and Windows); `keepalives_interval` (seconds before retransmit of unacknowledged keepalive; 0 = system default; TCP_KEEPINTVL, and Windows); `keepalives_count` (lost keepalives before connection considered dead; 0 = system default; TCP_KEEPCNT); `tcp_user_timeout` (MILLISECONDS transmitted data may stay unacknowledged before forced close; 0 = system default; TCP_USER_TIMEOUT only).
- `replication`: `true|on|yes|1` => physical replication mode; `database` => logical replication mode, connecting to the database in `dbname`; `false|off|no|0` => regular (default). Case-insensitive. In physical or logical replication mode ONLY the simple query protocol can be used. Used by replication connections and pg_basebackup.
- `gssencmode`: `disable` (only non-GSSAPI-encrypted), `prefer` (default when compiled with GSSAPI: if GSSAPI credentials present in a credentials cache try GSSAPI-encrypted first, else/after failure non-GSS), `require` (only GSSAPI-encrypted). Ignored for Unix sockets. Without GSSAPI support: `require` errors; `prefer` accepted but not attempted.
- `sslmode` (6 modes; default `prefer`): `disable` (only non-SSL), `allow` (first non-SSL; if fails try SSL), `prefer` (first SSL; if fails non-SSL), `require` (only SSL; if a root CA file is present verify the cert as if `verify-ca`), `verify-ca` (only SSL + verify cert issued by trusted CA), `verify-full` (only SSL + trusted CA + requested host name matches certificate). Ignored for Unix sockets. Without SSL support: require/verify-ca/verify-full error; allow/prefer accepted but not attempted. If GSSAPI encryption is possible it is used IN PREFERENCE to SSL regardless of sslmode; to force SSL set `gssencmode=disable`.
- `requiressl`: deprecated; 1 == sslmode require, 0 (default) == sslmode prefer.
- `sslnegotiation`: `postgres` (default; client first asks server whether SSL is supported) or `direct` (start TLS handshake immediately after TCP connect; one fewer round trip; allows protocol-agnostic SSL tools; introduced in PostgreSQL 17; only allowed with `sslmode=require` or higher because weaker settings could fall back to plaintext).
- `sslcompression`: 1 = compress, 0 = off; default 0. Considered insecure; OpenSSL 1.1.0 disabled by default; PostgreSQL 14 disabled compression completely in the backend.
- `sslcert`: client cert file, replaces default `~/.postgresql/postgresql.crt`. `sslkey`: secret key file (default `~/.postgresql/postgresql.key`) or OpenSSL engine spec `engine:key-id`. `sslkeylogfile`: where libpq logs TLS keys (NSS format; for Wireshark; ignored with LibreSSL; treat file like sslkey). `sslpassword`: password for the key in sslkey; any non-empty value suppresses OpenSSL's `Enter PEM pass phrase:` prompt; no env var equivalent and not looked up in .pgpass; CAN be used in a service file.
- `sslcertmode`: `disable` (never send a client cert), `allow` (default; send if server requests and client has one), `require` (server must request a cert; fails if client doesn't send one and server authenticates anyway). Note: `require` adds no security (PostgreSQL servers generally request client certs whether they validate them or not); useful for troubleshooting.
- `sslrootcert`: CA certificate file; default `~/.postgresql/root.crt`; if the file exists the server cert is verified against it. Special value `system` = load the SSL implementation's trusted CA roots (OpenSSL: `SSL_CERT_DIR`, `SSL_CERT_FILE` env vars influence). With `sslrootcert=system` the DEFAULT sslmode becomes `verify-full` and any weaker setting is an error. A local file literally named `system` must be given as `./system`.
- `sslcrl`: CRL file; default `~/.postgresql/root.crl` if neither sslcrl nor sslcrldir set. `sslcrldir`: CRL directory (prepare with `openssl rehash` / `c_rehash`); both can be given.
- `sslsni`: 1 (default) sets TLS Server Name Indication; 0 off. SNI lets SSL-aware proxies route without decrypting (needs `sslnegotiation=direct` unless proxy knows PG protocol) but exposes host name in cleartext.
- `requirepeer`: OS user name the server process must run as (e.g. `requirepeer=postgres`), checked on Unix-domain socket connections; protects against a rogue server on a socket in `/tmp`. Only on platforms with peer auth.
- `ssl_min_protocol_version`: `TLSv1`, `TLSv1.1`, `TLSv1.2`, `TLSv1.3`; default `TLSv1.2`. `ssl_max_protocol_version`: same values; unset => ignored (backend's bound applies).
- `min_protocol_version` (PostgreSQL wire protocol): default allows any libpq-supported version, currently 3.0; connection closed if server doesn't support at least this. `max_protocol_version`: version to request; default 3.0 unless the connection string uses a feature needing a higher version, then latest. If server doesn't support it, connection is automatically downgraded to a lower MINOR version. Supported values for both: `3.0`, `3.2`, `latest` (currently = 3.2). Check negotiated version with `PQfullProtocolVersion`.
- `krbsrvname`: Kerberos service name for GSSAPI; default `postgres` (build option `--with-krb-srvnam`); AD needs upper case `POSTGRES`. `gsslib`: only for Windows builds with both GSSAPI and SSPI; `gssapi` to use GSSAPI instead of default SSPI. `gssdelegation`: 0 default (don't forward GSS credentials); 1 = delegate when possible.
- `scram_client_key`, `scram_server_key`: base64 SCRAM keys for pass-through SCRAM auth by FDWs/middleware (see postgres_fdw F.38.1.10); not for direct use.
- `service`: service name in `pg_service.conf` holding additional parameters (32.17).
- `target_session_attrs` (6 modes; default `any`): `any` (any successful connection), `read-write` (session must accept read-write transactions by default: server not in hot standby AND `default_transaction_read_only` off), `read-only` (the converse), `primary` (server must not be in hot standby), `standby` (server must be in hot standby), `prefer-standby` (first try to find a standby; if none of the listed hosts is a standby, try again in `any` mode). Typically used with multiple hosts to select the first acceptable one.
- `load_balance_hosts`: `disable` (default; hosts tried in given order, addresses in DNS/hosts-file order) or `random` (hosts and addresses tried in random order). Combine with target_session_attrs to e.g. balance across standbys only. After connecting, all queries on that connection go to the same server. Algorithm = two levels of randomness: (1) hosts resolved in random order; (2) before resolving the next host, all resolved addresses of the current host are tried in random order. Skew when hosts resolve to different numbers of addresses; can be exploited by listing a bigger server's hostname multiple times. Recommended to also set a reasonable `connect_timeout` so a non-responding node is skipped.
- OAuth: `oauth_issuer` (HTTPS URL of trusted issuer; REQUIRED for all OAuth connections; must exactly match the issuer in the server's HBA config; server-provided discovery URL must be constructed from it and match the issuer identifier in the discovery document — prevents "mix-up attacks"; may be set directly to a `/.well-known/` URI: supported `/.well-known/openid-configuration` and `/.well-known/oauth-authorization-server`; then set `oauth_scope` too). `oauth_client_id` (required if server requests a token and no custom hook). `oauth_client_secret` (if provider requires; "confidential" clients). `oauth_scope` (space-separated list, may be empty; overrides server-requested scope).

### Connection status functions  [M6, M1]  (source: libpq-status.txt)
- Maintain the `PGconn` abstraction: use accessors, never `libpq-int.h` internals.
- Fixed-at-connect accessors (all `char *f(const PGconn *)`): `PQdb`, `PQuser`, `PQpass`, `PQhost`, `PQhostaddr`, `PQport`, `PQtty` (does nothing; always ""), `PQoptions`. With multi-host strings `PQhost`/`PQport`/`PQpass` can change if a new connection is made on the same PGconn, and are unreliable until the connection is established.
  - `PQpass`: password from parameters, or else the one obtained from the password file.
  - `PQhost`: host name, IP address, or directory path for Unix socket (always absolute, begins with `/`). If both host and hostaddr given returns host; if only hostaddr, returns that; multi-host => the host actually connected to. NULL if conn NULL; "" on error.
  - `PQhostaddr`: server IP of the active connection (resolved or from hostaddr). `PQport`: port actually connected to.
- `ConnStatusType PQstatus(conn)`: outside an async connect only `CONNECTION_OK` / `CONNECTION_BAD`. OK normally persists until PQfinish, but a communications failure can flip it to BAD; recover with `PQreset`.
- `PGTransactionStatusType PQtransactionStatus(conn)`: `PQTRANS_IDLE` (currently idle), `PQTRANS_ACTIVE` (a command is in progress — only when a query has been sent and not yet completed), `PQTRANS_INTRANS` (idle, in a valid transaction block), `PQTRANS_INERROR` (idle, in a failed transaction block), `PQTRANS_UNKNOWN` (connection bad).
- `const char *PQparameterStatus(conn, paramName)`: values the server reports automatically at startup and whenever they change (ParameterStatus messages). Reported parameters in v18 (15): `application_name`, `client_encoding`, `DateStyle`, `default_transaction_read_only`, `in_hot_standby`, `integer_datetimes`, `IntervalStyle`, `is_superuser`, `scram_iterations`, `search_path`, `server_encoding`, `server_version`, `session_authorization`, `standard_conforming_strings`, `TimeZone`. (`default_transaction_read_only`, `in_hot_standby` not reported before 14; `scram_iterations` not before 16; `search_path` not before 18.) `server_version`, `server_encoding`, `integer_datetimes` cannot change after startup. If `standard_conforming_strings` is not reported assume off (backslashes are escapes); its presence implies `E'...'` syntax is accepted. Returned pointer points to mutable storage; don't hold across queries. NULL if unknown.
- `int PQfullProtocolVersion(conn)`: major*10000 + minor (3.2 => 30002; 4.0 => 40000); 0 if bad. Protocol 3.0 supported by servers 7.4+. `int PQprotocolVersion(conn)`: major only; currently 3 or 0 (libpq before 14.0 could return 2).
- `int PQserverVersion(conn)`: major*10000 + minor (10.1 => 100001; 11.0 => 110000); pre-10 three-part versions use two digits per part (9.1.5 => 90105; 9.2.0 => 90200). Divide by 100 (not 10000) to get a logical major version. 0 if bad.
- `char *PQerrorMessage(conn)`: most recent error on the connection; may be multi-line, includes trailing newline; don't free; changes across operations.
- `int PQsocket(conn)`: fd >= 0, or -1 if no connection open; may change during setup/reset.
- `int PQbackendPID(conn)`: PID of the server backend process (on the SERVER host); useful for debugging and comparing with NOTIFY messages (which carry the notifying backend's PID).
- `PQconnectionNeedsPassword` (1 if auth required a password but none was available — use after a failed attempt to decide whether to prompt), `PQconnectionUsedPassword` (1 if auth used a password), `PQconnectionUsedGSSAPI`.
- SSL info: `int PQsslInUse(conn)`; `const char *PQsslAttribute(conn, name)` with common attributes `library` (currently only "OpenSSL"), `protocol` ("TLSv1", "TLSv1.1", "TLSv1.2", ...), `key_bits`, `cipher` (e.g. "DHE-RSA-DES-CBC3-SHA"), `compression` ("on"/"off"), `alpn` (only protocol supported is `postgresql`; "" if ALPN not used). `library` may be queried with conn NULL (default SSL library, or NULL if no SSL support; feature macro `LIBPQ_HAS_SSL_LIBRARY_DETECTION`, since v15). `PQsslAttributeNames(conn)` NULL-terminated list. `void *PQsslStruct(conn, "OpenSSL")` returns OpenSSL `SSL *`. `PQgetssl(conn)` == PQsslStruct(conn,"OpenSSL"), discouraged.

### Command execution: PQexec family  [M6, M3, M4]  (source: libpq-exec.txt §32.3.1)
- `PGresult *PQexec(PGconn *conn, const char *command)` — send and wait. Returns PGresult or NULL (OOM / couldn't send); check `PQresultStatus` (treats NULL as `PGRES_FATAL_ERROR`). The string may hold MULTIPLE SQL commands separated by semicolons: they are processed in a SINGLE transaction unless explicit BEGIN/COMMIT divide it; the returned PGresult describes only the LAST command; if one fails processing stops and the PGresult describes the error. (Simple query protocol.)
- `PGresult *PQexecParams(conn, command, int nParams, const Oid *paramTypes, const char * const *paramValues, const int *paramLengths, const int *paramFormats, int resultFormat)` (extended query protocol):
  - parameters referenced as `$1, $2, ...`; `paramTypes` NULL or element 0 => server infers type as for an untyped literal;
  - `paramValues[i]` NULL => SQL NULL; else zero-terminated text or binary data;
  - `paramLengths` only for binary params; `paramFormats` 0 = text, 1 = binary (NULL array => all text);
  - binary values need backend internal representation: integers in NETWORK BYTE ORDER; numeric per `numeric_send()`/`numeric_recv()` in `src/backend/utils/adt/numeric.c`;
  - `resultFormat` 0 text / 1 binary for ALL columns (protocol allows per-column but libpq does not).
  - At most ONE SQL command per string (protocol limitation; extra defence against SQL injection). Main advantage: no quoting/escaping.
  - Tip: force a parameter's type with a cast in SQL: `SELECT * FROM mytable WHERE x = $1::bigint;` — strongly recommended for binary parameters (less redundancy => server less likely to detect type mismatch).
- `PGresult *PQprepare(conn, stmtName, query, nParams, paramTypes)` — creates a prepared statement (parse+plan once; see PREPARE). `stmtName` "" = unnamed statement (auto-replaces previous unnamed one); otherwise error if name already defined in the session. Query must be a single command. Parameter symbols numbered above nParams also get inferred types. SQL `PREPARE` statements can also create statements usable by PQexecPrepared.
- `PGresult *PQexecPrepared(conn, stmtName, nParams, paramValues, paramLengths, paramFormats, resultFormat)` — like PQexecParams but by statement name; no paramTypes.
- `PGresult *PQdescribePrepared(conn, stmtName)` ("" or NULL = unnamed): returns `PGRES_COMMAND_OK` result; use `PQnparams`, `PQparamtype` for parameters and `PQnfields`, `PQfname`, `PQftype`... for result columns.
- `PGresult *PQdescribePortal(conn, portalName)`: describe a portal (e.g. a cursor from `DECLARE CURSOR`; libpq gives no direct portal access).
- `PGresult *PQclosePrepared(conn, stmtName)`, `PGresult *PQclosePortal(conn, portalName)`: release server resources, name can be reused; no-op if it doesn't exist; `PGRES_COMMAND_OK` on success.
- `ExecStatusType PQresultStatus(res)` — see inventory (15 values). SELECT returning zero rows is still `PGRES_TUPLES_OK`; `PGRES_COMMAND_OK` is for commands that can never return rows; `PGRES_EMPTY_QUERY` may indicate a client bug; `PGRES_NONFATAL_ERROR` is never returned by exec functions (goes to the notice processor).
- `char *PQresStatus(status)` string name. `char *PQresultErrorMessage(res)` (kept until PQclear; PQerrorMessage on the conn changes with later operations). `char *PQresultVerboseErrorMessage(res, PGVerbosity verbosity, PGContextVisibility show_context)` — recompute message at other verbosity; freshly malloc'd, free with `PQfreemem`; non-error result gives "PGresult is not an error result".
- `char *PQresultErrorField(res, fieldcode)` — individual error fields (inventory below). Only on PGresult; there is NO `PQerrorField`. libpq-internal errors have severity and primary message but typically no other fields. Newlines in fields are paragraph breaks.
- `void PQclear(PGresult *res)` — must free every result; a PGresult survives new commands and even connection close. NULL arg is a no-op.

### Result accessors  [M6]  (source: libpq-exec.txt §32.3.2–32.3.3)
- Valid for `PGRES_TUPLES_OK`, `PGRES_SINGLE_TUPLE`, `PGRES_TUPLES_CHUNK` and Describe results (column info, zero rows). Row/column numbers start at 0.
- `PQntuples` (PGresult limited to INT_MAX rows), `PQnfields`, `PQfname(res, col)` (NULL if out of range), `PQfnumber(res, name)` (-1 if none; name treated as SQL identifier: downcased unless double-quoted — for `SELECT 1 AS FOO, 2 AS "BAR"`: `PQfname(res,0)`=foo, `PQfname(res,1)`=BAR, `PQfnumber(res,"FOO")`=0, `PQfnumber(res,"BAR")`=-1, `PQfnumber(res,"\"BAR\"")`=1).
- `Oid PQftable(res, col)` (table OID or `InvalidOid` if not a simple column reference), `int PQftablecol(res, col)` (attribute number within the table, nonzero; 0 if not simple), `int PQfformat` (0 text, 1 binary), `Oid PQftype` (type OID; built-in OIDs in `catalog/pg_type_d.h`), `int PQfmod` (type modifier; -1 = no info), `int PQfsize` (server-internal size in bytes; negative = variable-length), `PQbinaryTuples` (deprecated except for COPY; 1 only if all columns binary).
- `char *PQgetvalue(res, row, col)`: text => null-terminated string; binary => per type's `typsend`/`typreceive`. NULL field returns EMPTY STRING — use `PQgetisnull` (1/0) to distinguish. Storage belongs to the PGresult. `int PQgetlength` = actual byte length (== strlen for text).
- `int PQnparams(res)`, `Oid PQparamtype(res, n)` — only for PQdescribePrepared results.
- `void PQprint(FILE *fout, const PGresult *res, const PQprintOpt *po)` — legacy printer (formerly used by psql); `PQprintOpt { pqbool header, align, standard, html3, expanded, pager; char *fieldSep, *tableOpt, *caption; char **fieldName; }`.
- `char *PQcmdStatus(res)`: command status tag (command name, maybe row count). `char *PQcmdTuples(res)`: rows affected as a string; only for SELECT, CREATE TABLE AS, INSERT, UPDATE, DELETE, MERGE, MOVE, FETCH, COPY, or EXECUTE of a prepared INSERT/UPDATE/DELETE/MERGE; otherwise "". `Oid PQoidValue(res)`: OID of inserted row if exactly one row inserted into a table with OIDs, else InvalidOid. `PQoidStatus` deprecated, not thread-safe.

### Escaping  [M6]  (source: libpq-exec.txt §32.3.4)
- `char *PQescapeLiteral(conn, str, size_t length)` — returns malloc'd string INCLUDING the surrounding single quotes; free with `PQfreemem`; NULL on error. `char *PQescapeIdentifier(conn, str, length)` — returns identifier surrounded by double quotes (preserves case/special chars).
- `size_t PQescapeStringConn(conn, char *to, const char *from, size_t length, int *error)` — caller buffer must hold at least `2*length + 1` bytes; does NOT add quotes; only error = invalid multibyte encoding. `PQescapeString(to, from, length)` deprecated: no conn so can't know encoding / `standard_conforming_strings`; a security hazard with multiple connections.
- `unsigned char *PQescapeByteaConn(conn, from, from_length, size_t *to_length)` — hex encoding or backslash escaping; result length includes terminating zero; no surrounding quotes. `PQescapeBytea` deprecated. `unsigned char *PQunescapeBytea(from, size_t *to_length)` — text-format bytea => binary (only needed for text-format results).
- It is "neither necessary nor correct" to escape values passed as separate parameters in PQexecParams & siblings. Escaping matters for untrusted input (SQL injection).

### Asynchronous command processing  [M6]  (source: libpq-async.txt)
- PQexec deficiencies: (1) blocks until done; (2) hard to cancel (only from a signal handler); (3) returns only one PGresult (all but last discarded for multi-command strings); (4) always buffers the whole result set.
- Async senders (return 1 dispatched / 0 failed): `PQsendQuery(conn, command)` (disallowed in pipeline mode), `PQsendQueryParams(...)`, `PQsendPrepare(...)`, `PQsendQueryPrepared(...)`, `PQsendDescribePrepared`, `PQsendDescribePortal`, `PQsendClosePrepared`, `PQsendClosePortal` — same arguments as their sync twins.
- `PGresult *PQgetResult(conn)`: call repeatedly until it returns NULL (command done). A new PQsendQuery cannot be issued until NULL was returned. Must keep calling even after a fatal-error result. Blocks only if a command is active and data hasn't been read by `PQconsumeInput`. With multi-command strings, each command's result is returned individually (overlapped processing).
- `int PQconsumeInput(conn)`: read available input into libpq's buffer (1 ok, 0 trouble); clears select() read-ready condition; then check `PQisBusy` / `PQnotifies`.
- `int PQisBusy(conn)`: 1 if PQgetResult would block. Does not read itself — PQconsumeInput must be called first.
- Typical main loop: select()/poll() on `PQsocket` -> `PQconsumeInput` -> if `!PQisBusy` -> `PQgetResult`; also `PQnotifies`.
- Cancel is possible meanwhile, but regardless of the cancel's return value keep reading results with PQgetResult.
- Fully nonblocking (output side): `int PQsetnonblocking(conn, int arg)` (1 nonblocking, 0 blocking; returns 0 ok, -1 error); `PQisnonblocking(conn)`. In nonblocking state PQsendQuery, PQputline, PQputnbytes, PQputCopyData, PQendcopy won't block (data goes to local output buffer; failed calls must be retried). `PQexec` does NOT honor nonblocking mode.
- `int PQflush(conn)`: 0 = all sent / queue empty, -1 = failure, 1 = couldn't send everything yet (nonblocking only). Algorithm after sending on a nonblocking connection: call PQflush; if 1, wait for socket read- OR write-ready; write-ready -> PQflush again; read-ready -> `PQconsumeInput` then PQflush again (the server may be blocked sending us e.g. NOTICEs and won't read until we do); repeat until 0; then wait read-ready and read the response.

### Pipeline mode  [M6]  (source: libpq-pipeline-mode.txt)
- Pipeline mode = send queries without reading the result of the previous one; multiple queries/results per network round trip. libpq API introduced in PostgreSQL 14 but is CLIENT-SIDE only: works with any server supporting the v3 extended query protocol (see protocol §54.2.4).
- Costs: more complex client (queue of pending queries; must match results to queries), generally more memory on both client and server.
- Enter with `int PQenterPipelineMode(conn)` (1 success; 0 and no effect if connection not idle; sends nothing to the server, only changes libpq state). Exit with `int PQexitPipelineMode(conn)` (1 success, also 1/no-op if not in pipeline mode; 0 if current statement unfinished or results not all collected).
- In pipeline mode ONLY asynchronous operations using the EXTENDED query protocol are allowed. Disallowed: multi-command strings, COPY, all synchronous functions (`PQfn`, `PQexec`, `PQexecParams`, `PQprepare`, `PQexecPrepared`, `PQdescribePrepared`, `PQdescribePortal`, `PQclosePrepared`, `PQclosePortal`), and `PQsendQuery` (uses simple query protocol). Allowed: `PQsendQueryParams`, `PQsendQueryPrepared`, `PQsendPrepare`, `PQsendDescribePrepared`, `PQsendDescribePortal`, `PQsendClosePrepared`, `PQsendClosePortal`.
- Note: best used with non-blocking mode; in blocking mode a client/server DEADLOCK is possible (client blocks sending queries while server blocks sending results; happens when the client fills both its output buffer and the server's receive buffer before reading).
- Requests are queued client-side until flushed: by `PQpipelineSync` or `PQflush`.
- Server executes statements and returns results in the order sent; starts executing immediately (doesn't wait for pipeline end). Results are buffered SERVER-side; server flushes at a sync point (`PQpipelineSync` / `PQsendPipelineSync`) or on `PQsendFlushRequest`.
- Error: server aborts the current transaction and skips every subsequent command until the next synchronization point; each skipped command yields `PGRES_PIPELINE_ABORTED` (even if the commands would roll back the transaction). Processing resumes after the sync point.
- Later operations may depend on earlier ones in the same pipeline (create table then use it; prepare a named statement then execute it).
- Result processing: call `PQgetResult` until NULL for each query in turn; after results of all queries, PQgetResult returns `PGRES_PIPELINE_SYNC` (exactly once per PQpipelineSync/PQsendPipelineSync; no NULL follows it — the next query's result follows immediately). `PQisBusy` in mid-pipeline returns 0 if results of all queries issued so far have been consumed. libpq gives no info about which query a result belongs to: app must track order (state machine or FIFO queue).
- Client-side error handling: after a `PGRES_FATAL_ERROR` the pipeline is flagged aborted (`PQ_PIPELINE_ABORTED`); each remaining queued operation yields `PGRES_PIPELINE_ABORTED`; then `PGRES_PIPELINE_SYNC` ends the aborted pipeline (flag cleared).
- Transaction semantics on error: (a) implicit transaction (delimited by sync points): already-executed operations are rolled back, following ones skipped; (b) one explicit transaction (first BEGIN, last COMMIT): same, but the session remains in an aborted transaction state at the end of the pipeline; (c) multiple explicit transactions: those committed before the error stay committed, in-progress one aborted, all subsequent operations skipped incl. later transactions. If a sync point occurs with an explicit transaction block in aborted state, the next pipeline becomes aborted immediately unless its first command is ROLLBACK.
- Note: do not assume work is committed when COMMIT is SENT — only when the corresponding result is received. App must be able to restart from the last confirmed commit.
- Interleaving: use a non-blocking event loop (select/poll/WaitForMultipleObjectEx); keep a queue of work to dispatch and a queue of dispatched-but-unprocessed work; dispatch when writable, read when readable. Scope pipelines to logical units of work (usually one transaction per pipeline). No need to exit/re-enter pipeline mode between pipelines or wait for one to finish. Example: `src/test/modules/libpq_pipeline/libpq_pipeline.c`.
- `PGpipelineStatus PQpipelineStatus(conn)`: `PQ_PIPELINE_ON`, `PQ_PIPELINE_OFF`, `PQ_PIPELINE_ABORTED` (cleared when PQgetResult returns `PGRES_PIPELINE_SYNC`).
- `int PQpipelineSync(conn)`: sends Sync message AND flushes send buffer; delimiter of an implicit transaction and error recovery point. `int PQsendPipelineSync(conn)`: same without flushing (use PQflush). `int PQsendFlushRequest(conn)`: asks server to flush its output buffer without establishing a sync point (request itself not auto-flushed; use PQflush).
- When to use: no meaningful performance overhead; most useful when server is distant (high latency) and many small operations in rapid succession. Documented number: 100 statements at 300 ms round-trip = 30 s of network latency without pipelining; with pipelining as little as 0.3 s. Good for lots of small INSERT/UPDATE/DELETE not expressible as set operations or COPY. NOT useful when the client needs a result to produce the next operation — instead move logic server-side: replace `BEGIN; SELECT x FROM mytable WHERE id = 42 FOR UPDATE; UPDATE mytable SET x = 3 WHERE id = 42; COMMIT;` with `UPDATE mytable SET x = x + 1 WHERE id = 42;`. Less useful/more complex with multiple transactions per pipeline.

### Single-row and chunked result modes  [M6]  (source: libpq-single-row-mode.txt)
- Default: libpq buffers the entire result into one PGresult. For large results use `PQsendQuery` (or sibling) + `PQgetResult` in single-row or chunked mode.
- `int PQsetSingleRowMode(conn)` / `int PQsetChunkedRowsMode(conn, int chunkSize)`: must be called IMMEDIATELY after a successful PQsendQuery-family call, before any other operation (PQconsumeInput, PQgetResult). Return 1 if activated, 0 otherwise. Mode applies only to the current query and reverts afterwards. In pipeline mode it must be activated for each query before retrieving that query's results.
- Results: each row arrives as a PGresult with status `PGRES_SINGLE_TUPLE` (exactly 1 row) or `PGRES_TUPLES_CHUNK` (1..chunkSize rows); after the last row (or immediately for zero rows) a ZERO-ROW `PGRES_TUPLES_OK` result signals the end; still must call PQgetResult until NULL. All carry the same row description. PQclear each.
- Caution: the server may return some rows then hit an error; normally libpq discards rows and reports only the error, but in these modes the app already saw `PGRES_SINGLE_TUPLE`/`PGRES_TUPLES_CHUNK` objects followed by `PGRES_FATAL_ERROR` — app must discard/undo what it did with those rows.

### Canceling queries  [M6, M1]  (source: libpq-cancel.txt)
- Cancel requests travel over a SEPARATE connection. Modern API (encrypted like the original connection):
  - `PGcancelConn *PQcancelCreate(PGconn *conn)` — creates opaque object; nothing sent yet; thread-safe way to cancel the query running on the original connection. Reuses many connection parameters: if the original required encryption and/or host verification (`sslmode`, `gssencmode`), the cancel connection has the same requirements. Options used only during/after authentication are ignored — cancel requests need NO authentication and the connection is closed right after the request is submitted. Must call `PQcancelFinish` afterwards.
  - `int PQcancelBlocking(PGcancelConn *)` — 1 dispatched, 0 not (see `PQcancelErrorMessage`).
  - `int PQcancelStart(PGcancelConn *)` + `PostgresPollingStatusType PQcancelPoll(PGcancelConn *)` — nonblocking; loop exactly like PQconnectPoll using `PQcancelSocket` (first iteration behave as `PGRES_POLLING_WRITING`; until `PGRES_POLLING_FAILED` / `PGRES_POLLING_OK`). `connect_timeout` ignored with PQcancelPoll.
  - `ConnStatusType PQcancelStatus(const PGcancelConn *)`: outside async procedure only `CONNECTION_ALLOCATED` (initial, after PQcancelCreate or PQcancelReset; no connection initiated), `CONNECTION_OK` (request dispatched), `CONNECTION_BAD`. During async: `CONNECTION_STARTED`, `CONNECTION_MADE`, `CONNECTION_AWAITING_RESPONSE`, `CONNECTION_SSL_STARTUP`, `CONNECTION_GSS_STARTUP`.
  - `int PQcancelSocket`, `char *PQcancelErrorMessage`, `void PQcancelFinish` (close + free), `void PQcancelReset` (reuse the PGcancelConn for a new request; one PGcancelConn can serve the lifetime of a PGconn).
- Semantics: successful dispatch is NO guarantee of effect. If effective, the command terminates early with an ERROR result; if too late (server already finished) there is no visible result at all.
- Obsolete (deprecated because they send the cancel request UNENCRYPTED even when the original connection required encryption): `PGcancel *PQgetCancel(conn)`, `void PQfreeCancel(PGcancel *)`, `int PQcancel(PGcancel *cancel, char *errbuf, int errbufsize)` (only benefit: safe in a signal handler if errbuf is local; recommended errbuf size 256 bytes; usable from another thread), `int PQrequestCancel(PGconn *)` (not thread/signal safe; error stored in PGconn).

### Fast-path interface  [M6]  (source: libpq-fastpath.txt)
- `PGresult *PQfn(PGconn *conn, int fnid, int *result_buf, int *result_len, int result_is_int, const PQArgBlock *args, int nargs)`; `PQArgBlock { int len; int isint; union { int *ptr; int integer; } u; }`. `fnid` = function OID. isint true => `u.integer` sent as integer of `len` (must be 2 or 4 bytes) with byte-swapping; false => `len` bytes at `*u.ptr` sent raw in server binary format. `len = -1` passes NULL. If function returns NULL `*result_len = -1`. Always returns a PGresult: `PGRES_COMMAND_OK` or `PGRES_FATAL_ERROR`.
- Warning: unsafe and should not be used — with `result_is_int = 0` PQfn may write beyond the end of result_buf (no size check); obsolete: a prepared statement with binary parameters/results gives similar performance and more functionality. Cannot handle set-valued results; function must be a plain function (not aggregate, window function, or procedure).

### LISTEN/NOTIFY from libpq  [M6]  (source: libpq-notify.txt)
- `LISTEN channel` registers interest; `UNLISTEN` stops; `NOTIFY channel [, payload]` from any session notifies all listeners asynchronously. Sent as ordinary SQL commands via libpq.
- `PGnotify *PQnotifies(PGconn *conn)` returns next unhandled notification or NULL; returned ones are removed from the list. `typedef struct pgNotify { char *relname; /* channel name */ int be_pid; /* PID of notifying server process */ char *extra; /* payload string */ } PGnotify;` Free with `PQfreemem` (one allocation; relname/extra are not separate). Field names are historical.
- PQnotifies does NOT read from the server; it returns messages absorbed by other libpq calls. Proper idle pattern: select() on `PQsocket` -> `PQconsumeInput` -> `PQnotifies` (no CPU while idle). Constantly submitting empty commands is deprecated. Also check PQnotifies after every PQexec / PQgetResult.

### COPY via libpq  [M6, M3]  (source: libpq-copy.txt)
- Flow: (1) issue SQL `COPY ... FROM STDIN` / `COPY ... TO STDOUT` via PQexec (or equivalent); (2) result status is `PGRES_COPY_IN` or `PGRES_COPY_OUT`; (3) transfer rows with the functions below; (4) a final PGresult reports `PGRES_COMMAND_OK` or `PGRES_FATAL_ERROR`. No other SQL command can run on the same connection while COPY is in progress. If the COPY was in a multi-command PQexec string, keep calling PQgetResult until NULL.
- The COPY-start PGresult carries: `PQnfields` (number of columns to copy), `PQbinaryTuples` (0 = textual overall format: rows separated by newlines, columns by separator; 1 = binary), `PQfformat` per column (currently always matches overall format).
- Sending (COPY_IN state): `int PQputCopyData(conn, const char *buffer, int nbytes)` — 1 queued, 0 not queued because buffers full (nonblocking only; wait write-ready and retry), -1 error. Buffer-load boundaries have no semantic significance. `int PQputCopyEnd(conn, const char *errormsg)` — NULL errormsg = successful end; non-NULL forces the COPY to FAIL with that message. Returns 1 sent (or queued in nonblocking mode -> wait write-ready and `PQflush` until 0), 0 could not queue, -1 hard error. Then `PQgetResult` for final status.
- Receiving (COPY_OUT state): `int PQgetCopyData(conn, char **buffer, int async)` — always exactly one complete data row per call; `*buffer` malloc'd (free with `PQfreemem`), null-terminated. Returns >0 = number of data bytes in the row; 0 = still in progress but no row yet (only when async true: wait read-ready, `PQconsumeInput`, retry); -1 = COPY done (then `PQgetResult`); -2 = error.
- Obsolete (poor error handling, awkward end-of-data detection, no binary/nonblocking support): `PQgetline(conn, buffer, length)` (EOF / 0 whole line / 1 buffer full; app must detect terminator line `\.`), `PQgetlineAsync(conn, buffer, bufsize)` (-1 end marker, 0 no data, >0 bytes; not null-terminated), `PQputline(conn, string)`, `PQputnbytes(conn, buffer, nbytes)`, `PQendcopy(conn)` (0 ok; must be called or server gets "out of sync"). Before protocol 3.0 the app had to send `\.` as a final line; still works but deprecated, special meaning of `\.` expected to be removed in a future release (already misbehaves in CSV mode).

### Control functions (encoding, verbosity, tracing)  [M6]  (source: libpq-control.txt)
- `int PQclientEncoding(conn)` returns the encoding ID (not a name; -1 on failure); convert with `char *pg_encoding_to_char(int encoding_id)`. `int PQsetClientEncoding(conn, const char *encoding)` returns 0 ok / -1.
- `PGVerbosity PQsetErrorVerbosity(conn, PGVerbosity)`; enum `PQERRORS_TERSE` (severity, primary text, position only — one line), `PQERRORS_DEFAULT` (plus detail, hint, context), `PQERRORS_VERBOSE` (all fields), `PQERRORS_SQLSTATE` (only severity and SQLSTATE; if none, like TERSE). Returns previous setting. Affects only subsequently created PGresults.
- `PGContextVisibility PQsetErrorContextVisibility(conn, PGContextVisibility)`; `PQSHOW_CONTEXT_NEVER`, `PQSHOW_CONTEXT_ERRORS` (default: CONTEXT only in errors, not notices/warnings), `PQSHOW_CONTEXT_ALWAYS`. With TERSE or SQLSTATE verbosity CONTEXT is omitted regardless.
- `void PQtrace(conn, FILE *stream)` — protocol trace. Each line: optional timestamp, direction (`F` = client->server, `B` = server->client), message length, message type, message contents. Non-content fields separated by tab; content separated by space; protocol strings in double quotes, data-value strings in single quotes; non-printables as hex escapes. `void PQsetTraceFlags(conn, int flags)`: `PQTRACE_SUPPRESS_TIMESTAMPS`, `PQTRACE_REGRESS_MODE` (redacts fields like object OIDs); must be called after PQtrace. `void PQuntrace(conn)`. Windows: crashes if libpq and app compiled with different flags (FILE representation differs).

### Miscellaneous functions  [M6]  (source: libpq-misc.txt)
- `void PQfreemem(void *ptr)` — free libpq-allocated memory (from PQescapeByteaConn, PQescapeBytea, PQunescapeBytea, PQnotifies, ...). Essential on Windows (DLL vs app allocator); elsewhere == free(). `void PQconninfoFree(PQconninfoOption *)` (PQfreemem is not enough: subsidiary strings).
- `char *PQencryptPasswordConn(conn, passwd, user, algorithm)` — client-side password hashing so `ALTER USER joe PASSWORD '...'` never carries cleartext (would be exposed in command logs, activity displays). algorithm: `md5`, `scram-sha-256` (`on`/`off` accepted as aliases for md5); scram-sha-256 introduced in PostgreSQL 10. NULL algorithm => queries server `password_encryption` (can block; fails if transaction aborted or connection busy). Result malloc'd, no chars needing escaping; free with PQfreemem.
- `PGresult *PQchangePassword(conn, user, passwd)` — builds and runs `ALTER USER ... PASSWORD '...'` using PQencryptPasswordConn with NULL algorithm (server's `password_encryption`).
- `PQencryptPassword(passwd, user)` deprecated: always md5, no connection.
- PGresult construction: `PQmakeEmptyPGresult(conn, status)`, `PQfireResultCreateEvents(conn, res)`, `PQcopyResult(src, flags)` (always `PGRES_TUPLES_OK`; flags `PG_COPYRES_ATTRS`, `PG_COPYRES_TUPLES` (implies attrs), `PG_COPYRES_NOTICEHOOKS`, `PG_COPYRES_EVENTS`), `PQsetResultAttrs(res, numAttributes, PGresAttDesc *attDescs)`, `PQsetvalue(res, tup_num, field_num, value, len)` (tup_num <= PQntuples: grows one tuple at a time; len -1 or NULL value => SQL NULL), `void *PQresultAlloc(res, nBytes)`, `size_t PQresultMemorySize(res)` (sum of all malloc requests for the result).
- `int PQlibVersion(void)` — same numbering as PQserverVersion (10.1 => 100001; 9.1.5 => 90105); divide by 100 for logical major. Appeared in 9.1.
- `pg_usec_time_t PQgetCurrentTimeUSec(void)` — microseconds since Unix epoch; for PQsocketPoll timeouts.

### Notice processing  [M6]  (source: libpq-notice-processing.txt)
- Server NOTICE/WARNING messages are not returned by exec functions; they go to a notice handler and execution continues. Default prints to stderr.
- Two levels: notice receiver `typedef void (*PQnoticeReceiver)(void *arg, const PGresult *res)` set by `PQsetNoticeReceiver(conn, proc, arg)`; notice processor `typedef void (*PQnoticeProcessor)(void *arg, const char *message)` set by `PQsetNoticeProcessor(conn, proc, arg)`. Both return the previous pointer; NULL proc = just query current.
- Receiver gets a `PGRES_NONFATAL_ERROR` PGresult (use PQresultErrorField etc.). Default receiver extracts the message and passes it to the processor; default processor is `fprintf(stderr, "%s", message)`.
- The handler may be called as long as the PGconn or any PGresult made from it exists (pointers are copied into each PGresult at creation).

### Event system  [M6]  (source: libpq-events.txt)
- Purpose: notify registered handlers about PGconn/PGresult creation/destruction so apps can attach private data and free it at the right time. Header `libpq-events.h` (includes libpq-fe.h).
- Two opaque pointers per handler: pass-through pointer (given at registration; constant for the PGconn and all its PGresults) and instance data pointer (starts NULL in every PGconn and PGresult; conn instance data is NOT inherited by PGresults). libpq never frees them.
- Event types (enum `PGEventId`) and info structs: `PGEVT_REGISTER` (`PGEventRegister { PGconn *conn; }`; fired by PQregisterEventProc, once per handler per connection; failure cancels registration and no CONNDESTROY will follow), `PGEVT_CONNRESET` (`PGEventConnReset { PGconn *conn; }`; after successful PQreset/PQresetPoll; return value ignored in v15+, earlier versions abort the connection on failure), `PGEVT_CONNDESTROY` (`PGEventConnDestroy { PGconn *conn; }`; on PQfinish, before other cleanup; return value ignored), `PGEVT_RESULTCREATE` (`PGEventResultCreate { PGconn *conn; PGresult *result; }`; any function generating a result incl. PQgetResult; on failure the proc is ignored for that result's lifetime), `PGEVT_RESULTCOPY` (`PGEventResultCopy { const PGresult *src; PGresult *dest; }`; on PQcopyResult; use to deep-copy instance data), `PGEVT_RESULTDESTROY` (`PGEventResultDestroy { PGresult *result; }`; on PQclear).
- Callback: `int eventproc(PGEventId evtId, void *evtInfo, void *passThrough)` — nonzero success, zero failure. A given proc can be registered only once per PGconn (its address is the lookup key). Windows caution: declare event procs `static` (DLL-internal vs external address).
- Functions: `int PQregisterEventProc(conn, PGEventProc proc, const char *name, void *passThrough)` (name non-NULL, non-empty; copied), `PQsetInstanceData(conn, proc, data)`, `PQinstanceData(conn, proc)`, `PQresultSetInstanceData(res, proc, data)` (not counted by PQresultMemorySize unless allocated with PQresultAlloc), `PQresultInstanceData(res, proc)`.

### libpq environment variables  [M6, M1]  (source: libpq-envars.txt)
- Used by `PQconnectdb`, `PQsetdbLogin`, `PQsetdb` when no value is directly specified. Full mapping in inventory. Notable: `PGPASSWORD` not recommended (some OSes let non-root users see process environment via `ps`; use a password file). `PGREQUIRESSL` deprecated; if both it and `PGSSLMODE` set, PGSSLMODE wins. `PGSERVICEFILE` default `~/.pg_service.conf` (Windows `%APPDATA%\postgresql\.pg_service.conf`). There is no env var for `sslpassword`.
- Session-default env vars: `PGDATESTYLE` (== `SET datestyle TO ...`), `PGTZ` (== `SET timezone TO ...`), `PGGEQO` (== `SET geqo TO ...`).
- libpq-internal: `PGSYSCONFDIR` (directory of `pg_service.conf`), `PGLOCALEDIR` (locale files for message localization).

### Password file (.pgpass)  [M6, M1, M7]  (source: libpq-pgpass.txt)
- `~/.pgpass` (Unix: `HOME`, else effective user's home dir); Windows `%APPDATA%\postgresql\pgpass.conf`; override with `passfile` parameter or `PGPASSFILE`. Used when the connection requires a password and none was otherwise specified.
- Line format: `hostname:port:database:username:password`. Lines starting with `#` are comments. Each of the first four fields may be a literal or `*` (matches anything). The FIRST matching line wins => put more-specific entries first. Escape `:` or `\` inside a field with `\`.
- Host matching: against `host` parameter if specified, else `hostaddr`; if neither, `localhost` is searched. `localhost` is also searched for a Unix-domain socket connection when `host` matches libpq's default socket directory.
- On a standby, a database field of `replication` matches streaming replication connections to the primary. Database field is otherwise of limited use (users have the same password for all databases in a cluster).
- Unix permissions must disallow any access to group/world: `chmod 0600 ~/.pgpass`; if less strict the file is IGNORED. Windows: no permission check.

### Connection service file (pg_service.conf)  [M6, M1]  (source: libpq-pgservice.txt)
- Associates a set of connection parameters with a service name; select with `service=name` or `PGSERVICE`. Lets parameters change without recompiling.
- Per-user file `~/.pg_service.conf` (Windows `%APPDATA%\postgresql\.pg_service.conf`; override `PGSERVICEFILE`); system-wide `pg_service.conf` in the installation's etc dir (`pg_config --sysconfdir`; directory overridable with `PGSYSCONFDIR`, file name not). If a service is in both, the USER file wins. Sample: `share/pg_service.conf.sample`.
- INI format: `[mydb]` section = service name; lines `host=somehost`, `port=5433`, `user=admin`; `#` comments.
- Precedence: connection string value > service file > environment variable > built-in default. Example: `service=mydb port=5434` => host somehost, port 5434, user admin.

### LDAP lookup of connection parameters  [M6]  (source: libpq-ldap.txt)
- Requires libpq built `--with-ldap`. A line in a `pg_service.conf` stanza starting with `ldap://` is an LDAP URL (RFC 1959): `ldap://[hostname[:port]]/search_base?attribute?search_scope?filter` (hostname default localhost, port default 389). The result must be a list of `keyword = value` pairs.
- Processing of pg_service.conf TERMINATES after a successful LDAP lookup but continues if the LDAP server can't be contacted (fallback to further LDAP URLs / plain pairs / defaults). To get an error instead, put a syntactically incorrect line after the LDAP URL.
- Example URL: `ldap://ldap.mycompany.com/dc=mycompany,dc=com?description?one?(cn=mydatabase)` with LDAP `description:` attributes like `host=dbserver.mycompany.com`, `port=5439`, `dbname=mydb`, `user=mydb_user`, `sslmode=require`. Can mix regular entries with an LDAP line in one stanza.

### SSL support in libpq  [M6, M1, M7]  (source: libpq-ssl.txt)
- libpq reads the system-wide OpenSSL config (`openssl.cnf` in the dir reported by `openssl version -d`; override with `OPENSSL_CONF`).
- BY DEFAULT libpq performs NO verification of the server certificate => server identity can be spoofed (DNS record change, IP takeover). Prevent via a chain of trust: root (self-signed) CA cert on one machine, leaf cert signed by root (optionally via intermediates) on the other. Client verifies server: root cert on client, leaf on server. Server verifies client: root on server, leaf on client.
- `sslmode=verify-ca`: verify the chain up to the root stored on the client. `sslmode=verify-full`: additionally verify server host name matches the certificate. Recommended in most security-sensitive environments: `verify-full`.
- Host-name matching in verify-full: matched against Subject Alternative Name (SAN) attributes, or against Common Name (CN) if NO SAN of type dNSName is present. A leading `*` in the name is a wildcard matching all characters EXCEPT a dot (so it does not match subdomains). If connecting by IP address: matched (no DNS lookups) against SANs of type iPAddress or dNSName; if no iPAddress SAN and no matching dNSName SAN, matched against CN. (Differs from RFC 6125 for backward compatibility.)
- Root certs go in `~/.postgresql/root.crt` (Windows `%APPDATA%\postgresql\root.crt`), including any needed intermediates. CRL checked if `~/.postgresql/root.crl` exists. Override: `sslrootcert`/`PGSSLROOTCERT`, `sslcrl`/`PGSSLCRL`, `sslcrldir`/`PGSSLCRLDIR`.
- Backward-compat quirk: if a root CA file exists, `sslmode=require` behaves like `verify-ca`. Relying on this is discouraged; use verify-ca/verify-full explicitly.
- Client certificates: if the server requests one, libpq sends `~/.postgresql/postgresql.crt` with private key `~/.postgresql/postgresql.key` (Windows `%APPDATA%\postgresql\postgresql.crt` / `.key`); override `sslcert`/`sslkey` or `PGSSLCERT`/`PGSSLKEY`. Key file permissions on Unix: no world/group access (`chmod 0600`), OR owned by root with group read (`0640`). First cert in postgresql.crt must be the client's own; intermediates may be appended (avoids storing them on the server's `ssl_ca_file`). PEM or ASN.1 DER format. Key may be passphrase-encrypted (e.g. AES-128): passphrase via `sslpassword`, else OpenSSL prompts `Enter PEM pass phrase:` if a TTY exists; custom callback via `PQsetSSLKeyPassHook_OpenSSL`.
- Three attack classes: Eavesdropping (prevented by encryption), Man-in-the-middle (prevented by certificate verification = server authenticated to client; vectors: DNS poisoning, address hijacking), Impersonation (prevented by client certificates).
- SSL must be configured on BOTH client and server before connecting for a connection to be known secure; if only on the server, the client may send sensitive info (passwords) before it knows the server requires security. Secure = `sslmode=verify-full` or `verify-ca` + a root cert (analogous to https).
- Table 32.1 (sslmode / eavesdropping protection / MITM protection / statement):
  | sslmode | Eavesdropping | MITM | Statement |
  |---|---|---|---|
  | disable | No | No | I don't care about security, and I don't want to pay the overhead of encryption. |
  | allow | Maybe | No | I don't care about security, but I will pay the overhead of encryption if the server insists on it. |
  | prefer | Maybe | No | I don't care about encryption, but I wish to pay the overhead of encryption if the server supports it. |
  | require | Yes | No | I want my data to be encrypted, and I accept the overhead. I trust that the network will make sure I always connect to the server I want. |
  | verify-ca | Yes | Depends on CA policy | I want my data encrypted, and I accept the overhead. I want to be sure that I connect to a server that I trust. |
  | verify-full | Yes | Yes | I want my data encrypted, and I accept the overhead. I want to be sure that I connect to a server I trust, and that it's the one I specify. |
- verify-ca vs verify-full: with a PUBLIC CA, verify-ca allows connecting to a server somebody else registered with that CA => always use verify-full. With a local CA or self-signed cert, verify-ca is often enough.
- Default `sslmode=prefer` "makes no sense from a security point of view"; kept only for backward compatibility; not recommended in secure deployments.
- Table 32.2 client files: `~/.postgresql/postgresql.crt` (client certificate; sent to server), `~/.postgresql/postgresql.key` (client private key; proves client cert sent by owner, does not indicate owner is trustworthy), `~/.postgresql/root.crt` (trusted CAs; checks server cert signed by trusted CA), `~/.postgresql/root.crl` (revoked certs; server cert must not be on the list).
- `PQinitOpenSSL(int do_ssl, int do_crypto)` and `PQinitSSL(int do_ssl)`: deprecated, DO NOTHING; no longer required since PostgreSQL 18 (only relevant for OpenSSL <= 1.0.2 with older libpq). PQinitSSL since 8.0, PQinitOpenSSL since 8.4.

### OAuth support in libpq (new in 18)  [M6, M1]  (source: libpq-oauth.txt)
- libpq implements the OAuth v2 Device Authorization client flow (RFC 8628) as an OPTIONAL module ("builtin flow"); used by default when the server requests a bearer token. Works without a local web browser (e.g. over SSH). Prints e.g. `Visit https://example.com/device and enter the code: ABCD-EFGH`. Not supported on Windows (custom flows still possible).
- Minimum connection string: `oauth_issuer` and `oauth_client_id`; builtin flow also requires the authorization server to publish a device authorization endpoint.
- Hook API: `void PQsetAuthDataHook(PQauthDataHook_type hook)` (NULL reinstalls default); callback `int hook_fn(PGauthData type, PGconn *conn, void *data)`; return >0 success, <0 error (abandons the connection attempt), 0 reserved for default implementation. Hooks can be chained via `PQgetAuthDataHook()` (initially `PQdefaultAuthDataHook`).
- Hook types: `PQAUTHDATA_PROMPT_OAUTH_DEVICE` — replace user prompt; data = `PGpromptOAuthDevice { const char *verification_uri; const char *user_code; const char *verification_uri_complete; /* optional, or NULL */ int expires_in; /* seconds */ }` (default prints URI and code to stderr; verification_uri_complete can be shown as QR code but still display URL+code). `PQAUTHDATA_OAUTH_BEARER_TOKEN` — custom flow replacing builtin; data = `PGoauthBearerRequest { const char *openid_configuration; const char *scope; PostgresPollingStatusType (*async)(PGconn *, struct PGoauthBearerRequest *, PQ_SOCKTYPE *altsock); void (*cleanup)(PGconn *, struct PGoauthBearerRequest *); char *token; void *user; }`. Hook returns a token immediately or sets `async` (returns PGRES_POLLING_READING/WRITING with `*altsock` set, PGRES_POLLING_OK after setting token, PGRES_POLLING_FAILED). Blocking in the hook breaks PQconnectPoll-style nonblocking connects.
- Debug: `PGOAUTHDEBUG=UNSAFE` ("dangerous debugging mode"): permits unencrypted HTTP to the provider, lets `PGOAUTHCAFILE` replace the trusted CA list, prints HTTP traffic (with secrets) to stderr, permits zero-second retry intervals. Never share that output.

### Threading & building  [M6]  (source: libpq-threading.txt, libpq-build.txt)
- As of version 17 libpq is ALWAYS reentrant and thread-safe; `int PQisthreadsafe()` always returns 1 on 17+. Restriction: no two threads may manipulate the same `PGconn` at the same time (no concurrent commands on one connection — use multiple connections). `PGresult` objects are read-only after creation and may be shared between threads (unless modified with §32.12/§32.14 functions).
- Not thread-safe (deprecated): `PQrequestCancel` (use `PQcancelBlocking`), `PQoidStatus` (use `PQoidValue`). Kerberos calls in the app need locking (`PQregisterThreadLock`); same for libcurl initialization unless Curl advertises the `threadsafe` feature.
- Build: `#include <libpq-fe.h>`; compile `cc -c -I/usr/local/pgsql/include testprog.c` (or `pg_config --includedir`, `pkg-config --cflags libpq`); link `cc -o testprog testprog1.o testprog2.o -L/usr/local/pgsql/lib -lpq` (put `-L` before `-lpq`; `pg_config --libdir`, `pkg-config --libs libpq`). "undefined reference to `PQsetdbLogin'" => forgot `-lpq`; "cannot find -lpq" => wrong/missing `-L`.

### libpq example programs  [M6]  (source: libpq-example.txt)
- Sources in `src/test/examples`. All three: `PQconnectdb(conninfo)` (default `"dbname = postgres"`), check `PQstatus(conn) != CONNECTION_OK`, print `PQerrorMessage`, always `PQfinish`; set a secure search path first with `SELECT pg_catalog.set_config('search_path', '', false)` (result status `PGRES_TUPLES_OK`).
- Example 32.1 `testlibpq.c`: `BEGIN` -> `DECLARE myportal CURSOR FOR select * from pg_database` (both `PGRES_COMMAND_OK`) -> `FETCH ALL in myportal` (`PGRES_TUPLES_OK`) -> print `PQfname` for each of `PQnfields`, then `PQgetvalue(res,i,j)` for `PQntuples` rows -> `CLOSE myportal` -> `END`. Cursors need a transaction block.
- Example 32.2 `testlibpq2.c` (async notification): `LISTEN TBL2`; loop: `select()` on `PQsocket(conn)`; `PQconsumeInput(conn)`; `while ((notify = PQnotifies(conn)) != NULL)` print `notify->relname`, `notify->be_pid`, `PQfreemem(notify)`, `PQconsumeInput` again; exits after four notifies. Test from psql with `NOTIFY TBL2;` or via a rule: `CREATE RULE r1 AS ON INSERT TO TBL1 DO (INSERT INTO TBL2 VALUES (new.i); NOTIFY TBL2);`.
- Example 32.3 `testlibpq3.c` (out-of-line params and binary I/O): table `test1 (i int4, t text, b bytea)`. (1) text param, binary results: `PQexecParams(conn, "SELECT * FROM test1 WHERE t = $1", 1, NULL, paramValues, NULL, NULL, 1)` with `paramValues[0] = "joe's place"` — no quoting needed. (2) binary int param: `binaryIntVal = htonl((uint32_t) 2); paramLengths[0] = sizeof(binaryIntVal); paramFormats[0] = 1;` query `"SELECT * FROM test1 WHERE i = $1::int4"` (cast forces type — safety measure for binary params). Decoding: binary INT4 is network byte order -> `ntohl(*((uint32_t *) iptr))`; binary TEXT is just text (libpq appends a zero byte); binary BYTEA is raw bytes, use `PQgetlength`. Uses `PQfnumber(res, "i")` to avoid assuming column order.

### Large objects: concepts & storage  [M2, M6]  (source: largeobjects.txt, lo-intro.txt, lo-implementation.txt)
- Large object (LO) facility = stream-style access to user data stored in a special structure; for values too large to handle as a whole. File-like read/write API.
- Storage: ALL large objects live in the single system table `pg_largeobject`; each also has an entry in `pg_largeobject_metadata`.
- vs TOAST: TOAST automatically stores values larger than a single page in a per-table secondary area, making LOs "partially obsolete". Remaining LO advantages: values up to 4 TB (TOASTed fields at most 1 GB); efficient reading/updating of PORTIONS (most operations on a TOASTed field read/write the whole value).
- Implementation: an LO is broken into "chunks" stored as rows; a B-tree index gives fast lookup of the chunk number for random access.
- Sparse: chunks need not be contiguous. Open a new LO, seek to offset 1000000, write a few bytes => only chunks covering the written range are allocated; reads return zeroes for unallocated locations preceding the last existing chunk (like sparse Unix files).
- Privileges (since 9.0): LOs have an owner and ACL managed with GRANT/REVOKE. `SELECT` privilege required to read; `UPDATE` to write or truncate. Only the owner (or a superuser) can delete, comment on, or change owner. GUC `lo_compat_privileges` restores pre-9.0 behaviour (disables the checks).

### Large objects: libpq client interface  [M6, M2]  (source: lo-interfaces.txt, lo-examplesect.txt)
- Modeled on Unix file API (open/read/write/lseek). Header `libpq/libpq-fs.h`; link libpq. ALL LO manipulation must happen inside an SQL TRANSACTION BLOCK (descriptors valid only for the duration of a transaction; open descriptors auto-closed at transaction end). Write operations (incl. `lo_open` with `INV_WRITE`) are not allowed in a read-only transaction. Errors return an otherwise-impossible value (0 or -1) and set `PQerrorMessage`. Cannot be used in pipeline mode.
- `Oid lo_create(PGconn *conn, Oid lobjId)` — create; `lobjId` = desired OID (fails if in use) or `InvalidOid` (0) to assign an unused one; returns OID or InvalidOid on failure. Older `Oid lo_creat(PGconn *conn, int mode)` — always assigns unused OID; mode ignored since 8.1 (pre-8.1 servers need `INV_READ`, `INV_WRITE`, or `INV_READ | INV_WRITE`).
- `Oid lo_import(conn, const char *filename)` — file read by the CLIENT library from the client filesystem. `Oid lo_import_with_oid(conn, filename, Oid lobjId)` (8.4+).
- `int lo_export(conn, Oid lobjId, const char *filename)` — written by the client; 1 success, -1 failure.
- `int lo_open(conn, Oid lobjId, int mode)` — returns non-negative descriptor or -1. Modes `INV_READ`, `INV_WRITE`, or both. Server does not distinguish `INV_WRITE` from `INV_READ | INV_WRITE` (reading allowed either way). BUT `INV_READ` alone: cannot write, and reads reflect the LO contents as of the TRANSACTION SNAPSHOT active when lo_open was executed, regardless of later writes by this or other transactions; a descriptor opened with `INV_WRITE` reads data reflecting all writes of other committed transactions plus the current transaction's writes. (Analogous to REPEATABLE READ vs READ COMMITTED.) lo_open fails without SELECT privilege, or without UPDATE privilege when INV_WRITE (checked at open since PostgreSQL 11; previously at first read/write).
- `int lo_write(conn, int fd, const char *buf, size_t len)` — returns bytes written (always len unless error) or -1. `int lo_read(conn, int fd, char *buf, size_t len)` — bytes read (less than len at end) or -1. Both reject len > INT_MAX; best practice: chunks of at most a few megabytes.
- `int lo_lseek(conn, fd, int offset, int whence)` with `SEEK_SET`, `SEEK_CUR`, `SEEK_END`; returns new position or -1; fails if new position > 2GB. `int64_t lo_lseek64(conn, fd, int64_t offset, int whence)` (9.3+).
- `int lo_tell(conn, fd)` (fails if position > 2GB) / `int64_t lo_tell64(conn, fd)` (9.3+).
- `int lo_truncate(conn, fd, size_t len)` (8.3+; rejects > INT_MAX) / `int lo_truncate64(conn, fd, int64_t len)` (9.3+): truncates to len; if len > current length the LO is EXTENDED with null bytes ('\0'); read/write position unchanged; 0 success, -1 error.
- `int lo_close(conn, fd)` — 0 / -1. `int lo_unlink(conn, Oid lobjId)` — remove LO; 1 success, -1 failure.
- Example 33.1 `src/test/examples/testlo.c`: `begin`; `lo_import(conn, in_filename)`; `pickout` = `lo_open(INV_READ)`, `lo_lseek(start, SEEK_SET)`, `lo_read` loop; `overwrite` = `lo_open(INV_WRITE)`, lseek, `lo_write` loop with 'X'; `lo_export`; `end`. Manual import loop reads a Unix file in `BUFSIZE 1024` chunks into `lo_write`.

### Large objects: server-side SQL functions  [M6, M2]  (source: lo-funcs.txt)
- Table 33.1: `lo_from_bytea(loid oid, data bytea) → oid` (create LO with data; loid 0 = system chooses free OID; error if OID exists) e.g. `lo_from_bytea(0, '\xffffff00') → 24528`; `lo_put(loid oid, offset bigint, data bytea) → void` (write at offset; LO enlarged if necessary) e.g. `lo_put(24528, 1, '\xaa')`; `lo_get(loid oid [, offset bigint, length integer]) → bytea` (whole content or substring) e.g. `lo_get(24528, 0, 3) → \xffaaff`.
- Server-side equivalents exist for each client function (client functions are mostly interfaces to them). Convenient from SQL: `lo_creat(-1)` (returns OID of new empty LO), `lo_create(43213)`, `lo_unlink(173454)`, `lo_import('/etc/motd')`, `lo_import('/etc/motd', 68583)`, `lo_export(image.raster, '/tmp/motd')`. Typical schema: `CREATE TABLE image (name text, raster oid);`.
- Server-side `lo_import`/`lo_export` read/write files in the SERVER's file system with the permissions of the database's owning OS user => restricted to superusers by default. Client-side versions use the client's filesystem and need only LO read/write privilege. Caution: GRANTing server-side lo_import/lo_export to non-superusers is equivalent to superuser risk (could rewrite server config files).
- Server-side read/write are named WITHOUT underscore: `loread` and `lowrite`.

### ECPG: concept, connections, commands  [M6]  (source: ecpg.txt, ecpg-concept.txt, ecpg-connect.txt, ecpg-commands.txt)
- ECPG = embedded SQL in C (also C++, not all constructs). Source `*.pgc` -> `ecpg` preprocessor -> `*.c` -> C compiler. Converted programs call libpq through the embedded SQL library (`ecpglib`) and speak the normal frontend/backend protocol. Docs admit: "This documentation is quite incomplete."
- Advantages: automatic passing of values to/from C variables; SQL syntax checked at BUILD time; embedded SQL in C is in the SQL standard (portable).
- Every statement has the form `EXEC SQL ...;` and takes the place of a C statement (global level or inside a function). Embedded SQL follows SQL case-sensitivity, SQL quoting rules, and allows nested C-style comments; ECPG assumes `standard_conforming_strings` is on.
- Connect: `EXEC SQL CONNECT TO target [AS connection-name] [USER user-name];` target forms: `dbname[@hostname][:port]`; `tcp:postgresql://hostname[:port][/dbname][?options]`; `unix:postgresql://localhost[:port][/dbname][?options]` (host must be exactly `localhost`; non-default socket dir via `host` option); an SQL string literal or character host variable holding one of these; `DEFAULT` (default database/user; no user or connection name allowed). User forms: `username`, `username/password`, `username IDENTIFIED BY password`, `username USING password`. Options = libpq keywords as `keyword=value` separated by `&` (no way to write `&` in a value). A directly written target is SQL-parsed (identifiers case-folded) so string literal/variable is less error-prone. Connection target format is not in the SQL standard.
- Same search_path warning: `options=-c search_path=` or `EXEC SQL SELECT pg_catalog.set_config('search_path', '', false);`.
- Choosing a connection (default = most recently opened = "current"): (1) `EXEC SQL AT connection-name SELECT ...;` (2) `EXEC SQL SET CONNECTION connection-name;` (3) `EXEC SQL AT connection-name DECLARE statement-name STATEMENT;` then `EXEC SQL PREPARE statement-name FROM :dyn-string;` (link is preprocessor-like: valid only within the file). Threads cannot share a connection concurrently (mutex or one connection per thread).
- Disconnect: `EXEC SQL DISCONNECT [connection];` with `connection-name` | `CURRENT` | `ALL`; default current.
- Any SQL command can be embedded: `EXEC SQL CREATE TABLE foo (number integer, ascii char(16));`, `EXEC SQL INSERT ...; EXEC SQL COMMIT;`. Single-row select: `EXEC SQL SELECT foo INTO :FooBar FROM table1 WHERE ascii = 'doodad';`; `EXEC SQL SHOW search_path INTO :var;`.
- Cursors for multi-row results: `EXEC SQL DECLARE foo_bar CURSOR FOR SELECT ...; EXEC SQL OPEN foo_bar; EXEC SQL FETCH foo_bar INTO :FooBar, DooDad; EXEC SQL CLOSE foo_bar; EXEC SQL COMMIT;`. Note: ECPG `DECLARE` sends NOTHING to the backend; the backend DECLARE happens when `OPEN` executes.
- Transactions: DEFAULT is NOT autocommit — statements are committed only on `EXEC SQL COMMIT`. Autocommit via `ecpg -t` or `EXEC SQL SET AUTOCOMMIT TO ON` (each command auto-committed unless inside an explicit transaction block); `EXEC SQL SET AUTOCOMMIT TO OFF` (default). Commands: `EXEC SQL COMMIT`, `EXEC SQL ROLLBACK`, `EXEC SQL PREPARE TRANSACTION transaction_id`, `EXEC SQL COMMIT PREPARED transaction_id`, `EXEC SQL ROLLBACK PREPARED transaction_id`.
- Prepared statements use `?` placeholders: `EXEC SQL PREPARE stmt1 FROM "SELECT oid, datname FROM pg_database WHERE oid = ?";` `EXEC SQL EXECUTE stmt1 INTO :dboid, :dbname USING 1;`. Multi-row: `EXEC SQL DECLARE foo_bar CURSOR FOR stmt1; EXEC SQL WHENEVER NOT FOUND DO BREAK; EXEC SQL OPEN foo_bar USING 100; while (1) { EXEC SQL FETCH NEXT FROM foo_bar INTO :dboid, :dbname; }`. Free: `EXEC SQL DEALLOCATE PREPARE name;`.

### ECPG: host variables, type mapping, indicators  [M6, M2]  (source: ecpg-variables.txt)
- Host variables are C variables referenced as `:name` anywhere a value expression is expected: `EXEC SQL INSERT INTO sometable VALUES (:v1, 'foo', :v2);`.
- Must be declared between `EXEC SQL BEGIN DECLARE SECTION;` and `EXEC SQL END DECLARE SECTION;` (normal C declarations, optional initializers; echoed to the output). Shortcut `EXEC SQL int i = 4;` creates an implicit section. Struct/union definitions must also be inside a declare section.
- Results via `INTO`: `EXEC SQL SELECT a, b INTO :v1, :v2 FROM test;` (INTO between select list and FROM; counts must match); `EXEC SQL FETCH NEXT FROM foo INTO :v1, :v2;` (INTO after all normal clauses).
- Table 34.1 type mapping (PostgreSQL type -> host variable type): `smallint` -> `short`; `integer` -> `int`; `bigint` -> `long long int`; `decimal` -> `decimal`[a]; `numeric` -> `numeric`[a]; `real` -> `float`; `double precision` -> `double`; `smallserial` -> `short`; `serial` -> `int`; `bigserial` -> `long long int`; `oid` -> `unsigned int`; `character(n)`, `varchar(n)`, `text` -> `char[n+1]`, `VARCHAR[n+1]`; `name` -> `char[NAMEDATALEN]`; `timestamp` -> `timestamp`[a]; `interval` -> `interval`[a]; `date` -> `date`[a]; `boolean` -> `bool`[b]; `bytea` -> `char *`, `bytea[n]`. [a] accessible only through pgtypes library functions; [b] declared in `ecpglib.h` if not native.
- Strings: `char str[50];` (you manage length: a result of more than 49 characters overflows the buffer) or ECPG's `VARCHAR var[180];` which becomes `struct varchar_var { int len; char arr[180]; } var;` (`arr` includes terminating zero; `len` excludes it; on input the shorter of `strlen(arr)` and `len` is used). `VARCHAR` may be upper or lower case, not mixed. char/VARCHAR variables can hold any SQL type in string form.
- Special types: `#include <pgtypes_timestamp.h>`, `timestamp ts;`, `PGTYPEStimestamp_to_asc(ts)`; date with `pgtypes_date.h`, `PGTYPESdate_to_asc()`. `interval`, `numeric`, `decimal` must be heap-allocated pointers: `interval *in = PGTYPESinterval_new(); ... PGTYPESinterval_free(in);`, `numeric *num = PGTYPESnumeric_new();`, `decimal *dec = PGTYPESdecimal_new();`. No functions specifically for `decimal`: convert with `PGTYPESnumeric_from_decimal(dec, num2)`.
- `bytea var[180];` -> `struct bytea_var { int len; char arr[180]; } var;` (binary data, may contain '\0'; converted from/to hex by ecpglib). Only usable when `bytea_output` is `hex`.
- Arrays as host variables: fetch multiple ROWS at once without a cursor: `int dbid[8]; char dbname[8][16]; EXEC SQL SELECT oid,datname INTO :dbid, :dbname FROM pg_database;` (array must be big enough, else overflow).
- Struct host variable whose members match columns absorbs as many columns as it has fields: `EXEC SQL FETCH FROM cur1 INTO :dbval;` or `INTO :dbval, :size`.
- Typedefs: `typedef long serial_t;` in a declare section or `EXEC SQL TYPE serial_t IS long;`. A word declared as typedef can no longer be used as an SQL keyword in later EXEC SQL commands (`typedef int start;` breaks `EXEC SQL START TRANSACTION;`; behaviour changed in v16).
- Pointers allowed (`int *intp; char **charp;`) but not as query targets without auto-allocation (descriptors).
- SQL-level arrays: multi-dimensional not supported; one-dimensional can map to C arrays, but you cannot fetch an array column directly into an array host variable (`FETCH ... INTO :ii_a` is WRONG); select elements separately (`SELECT ii[1], ii[2] ...`) or use the text representation in `char[]`/`VARCHAR[]`. Composite types: not directly supported — select attributes separately (`(compval).intval`, or `(compval).*` into a matching struct) or use the string form. User-defined base types: use external string representation or converter functions/casts.
- Indicators (NULL handling): append a second host variable: `EXEC SQL SELECT b INTO :val :val_ind FROM test1;`. Indicator 0 = not null; negative = NULL; POSITIVE = not null but value was TRUNCATED when stored. Without an indicator, fetching NULL raises an error. `ecpg -r no_indicator`: NULL signalled as empty string for character types and lowest possible value for integer types (e.g. `INT_MIN`).

### ECPG: dynamic SQL  [M6]  (source: ecpg-dynamic.txt)
- No result set: `EXEC SQL EXECUTE IMMEDIATE :stmt;` (DDL, INSERT, UPDATE, DELETE; cannot be used for statements that retrieve data).
- With input parameters: `const char *stmt = "INSERT INTO test1 VALUES(?, ?);"; EXEC SQL PREPARE mystmt FROM :stmt; EXEC SQL EXECUTE mystmt USING 42, 'foobar'; EXEC SQL DEALLOCATE PREPARE name;`.
- With single-row result: `EXEC SQL EXECUTE mystmt INTO :v1, :v2, :v3 USING 37;` (EXECUTE may have INTO, USING, both, or neither). Multi-row: `EXEC SQL PREPARE stmt1 FROM :stmt; EXEC SQL DECLARE cursor1 CURSOR FOR stmt1; EXEC SQL OPEN cursor1; EXEC SQL WHENEVER NOT FOUND DO BREAK; while (1) { EXEC SQL FETCH cursor1 INTO :dbaname,:datname; } EXEC SQL CLOSE cursor1;`.

### ECPG: pgtypes library  [M6, M2]  (source: ecpg-pgtypes.txt)
- pgtypes maps PostgreSQL types to C equivalents and does basic calculations client-side (no server round trip). Strings returned by `*_to_asc` are malloc'd: free with `PGTYPESchar_free` (matters on Windows).
- numeric (arbitrary precision; HEAP ONLY): `numeric *PGTYPESnumeric_new(void)`, `void PGTYPESnumeric_free(numeric *)`, `numeric *PGTYPESnumeric_from_asc(char *str, char **endptr)` (formats: `-2`, `.794`, `+3.44`, `592.49E07`, `-32.84e-4`; endptr unsupported, pass NULL), `char *PGTYPESnumeric_to_asc(numeric *num, int dscale)` (rounded to dscale decimal digits), `PGTYPESnumeric_add/sub/mul/div(var1, var2, result)` (0 ok, -1 error), `int PGTYPESnumeric_cmp(var1, var2)` (1, -1, 0; `INT_MAX` on error), `PGTYPESnumeric_from_int(signed int, numeric *)`, `PGTYPESnumeric_from_long(signed long int, numeric *)`, `PGTYPESnumeric_copy(src, dst)`, `PGTYPESnumeric_from_double(double, numeric *)`, `PGTYPESnumeric_to_double(numeric *, double *)`, `PGTYPESnumeric_to_int(numeric *, int *)`, `PGTYPESnumeric_to_long(numeric *, long *)` (errno `PGTYPES_NUM_OVERFLOW` / `PGTYPES_NUM_UNDERFLOW`), `PGTYPESnumeric_to_decimal(numeric *, decimal *)` (may overflow), `PGTYPESnumeric_from_decimal(decimal *, numeric *)` (cannot overflow).
- date: `date PGTYPESdate_from_timestamp(timestamp dt)`; `date PGTYPESdate_from_asc(char *str, char **endptr)` — ALWAYS assumes MDY, no setting to change it. Table 34.2 accepted inputs: `January 8, 1999`; `1999-01-08`; `1/8/1999`; `1/18/1999`; `01/02/03` (=> February 1, 2003); `1999-Jan-08`; `Jan-08-1999`; `08-Jan-1999`; `99-Jan-08`; `08-Jan-99`; `08-Jan-06` (=> 2006); `Jan-08-99`; `19990108` (ISO 8601); `990108` (ISO 8601); `1999.008` (year and day of year); `J2451187` (Julian day); `January 8, 99 BC`. `char *PGTYPESdate_to_asc(date)` (YYYY-MM-DD); `void PGTYPESdate_julmdy(date d, int *mdy)` (mdy[0]=month, mdy[1]=day, mdy[2]=year); `void PGTYPESdate_mdyjul(int *mdy, date *jdate)`; `int PGTYPESdate_dayofweek(date)` (0 Sunday .. 6 Saturday); `void PGTYPESdate_today(date *)`; `int PGTYPESdate_fmt_asc(date dDate, char *fmtstring, char *outbuf)` with specifiers `dd`, `mm`, `yy`, `yyyy`, `ddd` (abbrev. day name), `mmm` (abbrev. month name) — for Nov 23, 1959: `mmddyy` -> `112359`, `ddmmyy` -> `231159`, `yymmdd` -> `591123`, `yy/mm/dd` -> `59/11/23`, `yy mm dd` -> `59 11 23`, `yy.mm.dd` -> `59.11.23`, `.mm.yyyy.dd.` -> `.11.1959.23.`, `mmm. dd, yyyy` -> `Nov. 23, 1959`, `mmm dd yyyy` -> `Nov 23 1959`, `yyyy dd mm` -> `1959 23 11`, `ddd, mmm. dd, yyyy` -> `Mon, Nov. 23, 1959`, `(ddd) mmm. dd, yyyy` -> `(Mon) Nov. 23, 1959`; `int PGTYPESdate_defmt_asc(date *d, char *fmt, char *str)` (lenient parse by order of yy/yyyy, mm, dd; e.g. fmt `ddmmyy` str `21-2-54` -> 1954-02-21; fmt `yy/mm/dd` str `In the year 2525, in the month of July, mankind will be alive on the 28th day` -> 2525-07-28; fmt `mmddyy` str `Nov 14th, 1985` -> 1985-11-14).
- timestamp: `timestamp PGTYPEStimestamp_from_asc(char *str, char **endptr)` (error => returns `PGTYPESInvalidTimestamp`, errno `PGTYPES_TS_BAD_TIMESTAMP`; TIME ZONES NOT SUPPORTED: parsed but silently discarded — `1999-Jan-08 04:05:06.789-8` -> `1999-01-08 04:05:06.789`; `J2451187 04:05-08:00` -> `1999-01-08 04:05:00`; `January 8 04:05:06 1999 PST` -> `1999-01-08 04:05:06`); `char *PGTYPEStimestamp_to_asc(timestamp)`; `void PGTYPEStimestamp_current(timestamp *)`; `int PGTYPEStimestamp_fmt_asc(timestamp *ts, char *output, int str_len, char *fmtstr)` (strftime specifiers: %A %a %B %b %C %c %D %d %E* %O* %OB %e %F %G %g %H %h %I %j %k %l %M %m %n %p %R %r %S %s %T %t %U %u %V %v %W %w %X %x %Y %y %Z %z %+ %-* $_* %0* %%); `int PGTYPEStimestamp_sub(timestamp *ts1, timestamp *ts2, interval *iv)`; `int PGTYPEStimestamp_defmt_asc(char *str, char *fmt, timestamp *d)` (fmt NULL => default `%Y-%m-%d %H:%M:%S`); `PGTYPEStimestamp_add_interval(tin, span, tout)`; `PGTYPEStimestamp_sub_interval(tin, span, tout)`.
- interval: `interval *PGTYPESinterval_new(void)`, `void PGTYPESinterval_free(interval *)`, `interval *PGTYPESinterval_from_asc(char *str, char **endptr)`, `char *PGTYPESinterval_to_asc(interval *span)` (output like `@ 1 day 12 hours 59 mins 10 secs`), `int PGTYPESinterval_copy(src, dest)`.
- decimal: like numeric but limited to a maximum precision of 30 significant digits; can live on stack or heap: `decimal *PGTYPESdecimal_new(void)`, `void PGTYPESdecimal_free(decimal *)`.
- errno values: `PGTYPES_NUM_BAD_NUMERIC`, `PGTYPES_NUM_OVERFLOW`, `PGTYPES_NUM_UNDERFLOW`, `PGTYPES_NUM_DIVIDE_ZERO`, `PGTYPES_DATE_BAD_DATE`, `PGTYPES_DATE_ERR_EARGS`, `PGTYPES_DATE_ERR_ENOSHORTDATE`, `PGTYPES_INTVL_BAD_INTERVAL`, `PGTYPES_DATE_ERR_ENOTDMY`, `PGTYPES_DATE_BAD_DAY`, `PGTYPES_DATE_BAD_MONTH`, `PGTYPES_TS_BAD_TIMESTAMP`, `PGTYPES_TS_ERR_EINFTIME` (infinite timestamp in a context that cannot handle it).
- Constant `PGTYPESInvalidTimestamp` = `1899-12-31 23:59:59`, which is ALSO a valid timestamp => always also test `errno != 0` after `PGTYPEStimestamp_from_asc`.

### ECPG: descriptor areas (named SQL descriptors & SQLDA)  [M6]  (source: ecpg-descriptors.txt)
- Descriptor area = one row of data plus metadata; needed for dynamic SQL where result columns are unknown ahead of time. Two kinds: named SQL Descriptor Areas and C-structure SQLDAs.
- Named: `EXEC SQL ALLOCATE DESCRIPTOR identifier;` / `EXEC SQL DEALLOCATE DESCRIPTOR identifier;`; target: `EXEC SQL FETCH NEXT FROM mycursor INTO SQL DESCRIPTOR mydesc;`; metadata of an unexecuted prepared query: `EXEC SQL DESCRIBE stmt1 INTO SQL DESCRIPTOR mydesc;`. Empty result set still yields metadata. The `SQL` keyword is mandatory since 9.0 (omitting it means SQLDA).
- Read header: `EXEC SQL GET DESCRIPTOR name :hostvar = field;` — only header field `COUNT` (number of item descriptors = columns). Read item: `EXEC SQL GET DESCRIPTOR name VALUE num :hostvar = field;` fields: `CARDINALITY` (integer; number of rows in the result set), `DATA`, `DATETIME_INTERVAL_CODE` (when TYPE is 9: 1 DATE, 2 TIME, 3 TIMESTAMP, 4 TIME WITH TIME ZONE, 5 TIMESTAMP WITH TIME ZONE), `DATETIME_INTERVAL_PRECISION` (not implemented), `INDICATOR`, `KEY_MEMBER` (not implemented), `LENGTH` (chars), `NAME`, `NULLABLE` (not implemented), `OCTET_LENGTH` (bytes), `PRECISION`, `RETURNED_LENGTH`, `RETURNED_OCTET_LENGTH`, `SCALE`, `TYPE` (numeric type code).
- Build input descriptor: `EXEC SQL SET DESCRIPTOR name VALUE num field = :hostvar;` and pass with `USING SQL DESCRIPTOR name`. Multi-row: `EXEC SQL FETCH 5 FROM mycursor INTO SQL DESCRIPTOR mydesc; EXEC SQL GET DESCRIPTOR mydesc VALUE 1 :id = DATA;` with `int id[5];`.
- SQLDA: `EXEC SQL include sqlda.h; sqlda_t *mysqlda; EXEC SQL FETCH 3 FROM mycursor INTO DESCRIPTOR mysqlda;` (no SQL keyword); `EXEC SQL DESCRIBE prepared_statement INTO mysqlda;`. Similar to IBM DB2's SQLDA.
  - `struct sqlda_struct { char sqldaid[8]; /* "SQLDA  " */ long sqldabc; /* allocated bytes */ short sqln; /* # input params (USING), else same as sqld */ short sqld; /* # fields in result */ struct sqlda_struct *desc_next; /* next row */ struct sqlvar_struct sqlvar[1]; }; typedef struct sqlda_struct sqlda_t;`
  - `struct sqlvar_struct { short sqltype; /* enum ECPGttype in ecpgtype.h */ short sqllen; /* binary length, e.g. 4 for ECPGt_int */ char *sqldata; short *sqlind; /* 0 not null, -1 null */ struct sqlname sqlname; }; typedef struct sqlvar_struct sqlvar_t;`
  - `#define NAMEDATALEN 64` `struct sqlname { short length; char data[NAMEDATALEN]; };`
  - Output: one sqlda_t per row, linked via `desc_next`; iterate `for (cur = sqlda1; cur != NULL; cur = cur->desc_next)` and `cur->sqlvar[i]` for `i < cur->sqld`; switch on `sqltype` (`ECPGt_char`, `ECPGt_int`, `ECPGt_long_long`, ...).
  - Input: `sqlda2 = malloc(sizeof(sqlda_t) + (nparams - 1) * sizeof(sqlvar_t)); memset; sqlda2->sqln = 2; sqlda2->sqlvar[0].sqltype = ECPGt_char; .sqldata = "postgres"; .sqllen = 8;` then `EXEC SQL OPEN cur1 USING DESCRIPTOR sqlda2;`; input SQLDAs must be `free()`d explicitly (output ones need not).

### ECPG: error handling (WHENEVER, sqlca, SQLSTATE/SQLCODE)  [M6]  (source: ecpg-errors.txt, ecpg-sql-whenever.txt)
- `EXEC SQL WHENEVER condition action;` conditions: `SQLERROR`, `SQLWARNING`, `NOT FOUND` (statement retrieved/affected zero rows; not an error). Actions: `CONTINUE` (default; ignore), `GOTO label` / `GO TO label`, `SQLPRINT` (message to stderr, not configurable), `STOP` (`exit(1)`), `DO BREAK`, `DO CONTINUE`, `CALL name (args)` / `DO name (args)`. SQL standard only defines CONTINUE and GOTO.
- WHENEVER is a PREPROCESSOR directive, not a C statement: it applies to all embedded SQL statements textually BELOW it regardless of C control flow. Putting it inside `if (verbose) {...}` or inside a called function `set_error_handler()` does NOT work as intended.
- `sqlca` global (per-thread copy in multithreaded programs, like errno): `struct { char sqlcaid[8]; long sqlabc; long sqlcode; struct { int sqlerrml; char sqlerrmc[SQLERRMC_LEN]; } sqlerrm; char sqlerrp[8]; long sqlerrd[6]; char sqlwarn[8]; char sqlstate[5]; } sqlca;`. Holds info about the LAST warning/error only. Success: `sqlcode` 0 and `sqlstate` "00000"; error/warning: `sqlcode` negative; positive = harmless (e.g. zero rows). `sqlerrd[1]` = OID of processed row, `sqlerrd[2]` = number of processed/returned rows. `sqlerrm.sqlerrmc` = message (truncated if too long), `sqlerrml` = its length. `sqlwarn[2]='W'` on warning; `sqlwarn[1]='W'` value truncated into a host variable; `sqlwarn[0]='W'` if any other element is set. `sqlcaid`, `sqlabc`, `sqlerrp`, other `sqlerrd`/`sqlwarn` elements: no useful info. Example output for a misspelled table: `sqlcode: -400`, `sqlerrmc: relation "pg_databasep" does not exist on line 38`, `sqlstate: 42P01`.
- SQLSTATE (5 chars, first two = class, last three = subclass, `00000` success; native to the server) is preferred. SQLCODE is deprecated in SQL-92 and dropped later; standard only defines +100. Mapping SQLCODE<->SQLSTATE is many-to-many. Full ECPG SQLCODE table is in the inventories.

### ECPG: preprocessor directives, building, library functions  [M6]  (source: ecpg-preproc.txt, ecpg-process.txt, ecpg-library.txt)
- `EXEC SQL INCLUDE filename;` / `<filename>` / `"filename"`: preprocesses the file (so embedded SQL inside it works; unlike C `#include`). Search order: current directory, `/usr/local/include`, PostgreSQL include dir (e.g. `/usr/local/pgsql/include`), `/usr/include`; with `"filename"` only the current directory. Tries the name as given, then with `.h` appended. File name is case-sensitive.
- `EXEC SQL DEFINE name;`, `EXEC SQL DEFINE MYNUMBER 12;`, `EXEC SQL DEFINE MYSTRING 'abc';`, `EXEC SQL UNDEF MYNUMBER;` — substituted by ecpg (C `#define` constants are invisible to embedded SQL). Defines do not carry across multiple input files (each starts with only `-D` symbols).
- `EXEC SQL ifdef name;`, `ifndef`, `elif`, `else`, `endif` — nestable up to 127 levels.
- Build: `ecpg prog1.pgc` -> `prog1.c` (`-o` to name output); `cc -c prog1.c` (maybe `-I/usr/local/pgsql/include`); link `cc -o myprog prog1.o prog2.o ... -lecpg` (maybe `-L/usr/local/pgsql/lib`); pkg-config package `libecpg`. Make rule `%.c: %.pgc` -> `$(ECPG) $<`. ecpg library is thread-safe by default.
- Library functions (unportable): `ECPGdebug(int on, FILE *stream)` (logs all statements with input variables and results; Windows FILE caveat), `ECPGget_PGconn(const char *connection_name)` (libpq handle; NULL = current; manipulating it directly with libpq is "a bad idea"), `ECPGtransactionStatus(const char *connection_name)` (as PQtransactionStatus), `ECPGstatus(int lineno, const char *connection_name)` (true if connected).
- Large objects: not directly supported; use libpq `lo_*` via `ECPGget_PGconn("con1")`, inside a transaction block (with autocommit off BEGIN must be explicit). Example: `lo_create(conn, 0)`, `lo_open(INV_READ|INV_WRITE)`, `lo_write`, `lo_close`, `lo_open(INV_READ)`, `lo_read`, `memcmp`, `lo_unlink`, `EXEC SQL COMMIT`.

### ECPG: C++, embedded SQL command reference, compatibility modes, internals  [M6]  (source: ecpg-cpp.txt, ecpg-sql-*.txt, ecpg-informix-compat.txt, ecpg-oracle-compat.txt, ecpg-develop.txt)
- C++: generated code's library declarations are wrapped in `extern "C"`, but ecpg only understands C. Class member variables declared in a DECLARE SECTION are out of scope in methods (`ERROR: variable "dbname" is not declared`). Safe pattern: put embedded SQL in a C module (`test_mod.pgc` + `test_mod.h` with `extern "C"`), `ecpg -o test_mod.c test_mod.pgc; cc -c test_mod.c -o test_mod.o; c++ -c test_cpp.cpp -o test_cpp.o; c++ test_cpp.o test_mod.o -lecpg -o test_cpp`.
- Embedded-SQL-only commands (synopses in inventory). Notes: `DECLARE` cursor only names a "loop variable" — execution happens at `OPEN`; `DECLARE STATEMENT` namespace is the precompile unit, valid only if physically placed above the dynamic statement, AT clause required to be meaningful; `EXECUTE IMMEDIATE`/`PREPARE` literal strings must write double quotes as octal `\042` (not `\"`); `PREPARE` string must be SELECT, INSERT, UPDATE or DELETE with `?` placeholders; `TYPE` only recognized with `ecpg -c`; `VAR varname IS ctype` re-types an already declared host variable; `GET/SET DESCRIPTOR` column numbers start at 1, header item only `COUNT`; `SET AUTOCOMMIT` is a PostgreSQL ECPG extension (default off); `DISCONNECT CURRENT` = most recently opened or SET CONNECTION target.
- Informix compatibility mode (modes `INFORMIX`, `INFORMIX_SE`; link `libcompat`): `$` may replace `EXEC SQL` (`$CONNECT TO :dbname;`), no whitespace between `$` and a directive. `string` pseudo-type (right-trimmed char data; `typedef sometype string;` is refused). `CLOSE DATABASE` = `DISCONNECT CURRENT`; no `FREE cursor_name` (no run-time cursor bookkeeping in ecpglib); `FREE statement_name` = `DEALLOCATE PREPARE`. Different SQLDA (`struct sqlda_compat { short sqld; struct sqlvar_compat *sqlvar; char desc_name[19]; short desc_occ; struct sqlda_compat *desc_next; void *reserved; }`; `sqlvar_compat` has sqltype, sqllen (int), sqldata, sqlind, sqlname, sqlformat, sqlitype, sqlilen, sqlidata, sqlxid (= PQftype), sqltypename, sqltypelen, sqlownerlen, sqlsourcetype, sqlownername, sqlsourceid, sqlilongdata (= sqldata if sqllen > 32kB), sqlflags, sqlreserved; one allocation, `free(sqlda)`). Additional functions: decimal `decadd`, `deccmp`, `deccopy`, `deccvasc`, `deccvdbl`, `deccvint`, `deccvlong`, `decdiv`, `decmul`, `decsub`, `dectoasc`, `dectodbl`, `dectoint` (range INT_MIN..INT_MAX, unlike Informix's -32767..32767), `dectolong`; date `rdatestr` (always yyyy-mm-dd, needs 11 bytes), `rstrdate` (mm/dd/yyyy), `rtoday`, `rjulmdy`, `rdefmtdate`, `rfmtdate`, `rmdyjul`, `rdayofweek`; timestamp `dtcurrent`, `dtcvasc`, `dtcvfmtasc`, `dtsub`, `dttoasc`, `dttofmtasc`; `intoasc`; `rfmtlong` (mask chars `* & # < , . - + ( ) $`); strings `rupshift`, `byleng`, `ldchar`; unimplemented `rgetmsg`, `rtypalign`, `rtypmsize`, `rtypwidth`; nulls `rsetnull`/`risnull` with types `CCHARTYPE`, `CSHORTTYPE`, `CINTTYPE`, `CBOOLTYPE`, `CFLOATTYPE`, `CLONGTYPE`, `CDOUBLETYPE`, `CDECIMALTYPE`, `CDATETYPE`, `CDTIMETYPE`. Constants (all negative): `ECPG_INFORMIX_NUM_OVERFLOW` -1200, `_NUM_UNDERFLOW` -1201, `_DIVIDE_ZERO` -1202, `_BAD_YEAR` -1204, `_BAD_MONTH` -1205, `_BAD_DAY` -1206, `_ENOSHORTDATE` -1209, `_DATE_CONVERT` -1210, `_OUT_OF_MEMORY` -1211, `_ENOTDMY` -1212, `_BAD_NUMERIC` -1213, `_BAD_EXPONENT` -1216, `_BAD_DATE` -1218, `_EXTRA_CHARS` -1264.
- Oracle compatibility mode (behave like Pro*C), three changes: pad char arrays receiving strings with trailing spaces to declared length; zero-terminate them and set the indicator if truncation occurs; set null indicator to -1 when char arrays receive EMPTY strings.
- Internals: first four output lines are fixed (two comments, two includes `ecpgtype.h`, `ecpglib.h`). Everything between `EXEC SQL` and `;` is parsed for `:var` substitution. Core function `ECPGdo(lineno, connection, "SQL with ? placeholders", <input vars>, ECPGt_EOIT, <output vars>, ECPGt_EORT)`; each variable expands to TEN arguments: type symbol, pointer to value (or pointer-to-pointer), size (char/varchar), number of array elements, offset to next element, indicator type symbol, pointer to indicator, 0, number of indicator array elements, offset to next indicator element. `EXEC SQL OPEN cursor;` is not emitted; the cursor's DECLARE is emitted at the OPEN position. Example: `EXEC SQL SELECT res INTO :result FROM mytable WHERE index = :index;` -> `ECPGdo(__LINE__, NULL, "SELECT res FROM mytable WHERE index = ?     ", ECPGt_int,&(index),1L,1L,sizeof(int), ECPGt_NO_INDICATOR, NULL , 0L, 0L, 0L, ECPGt_EOIT, ECPGt_int,&(result),1L,1L,sizeof(int), ECPGt_NO_INDICATOR, NULL , 0L, 0L, 0L, ECPGt_EORT);`.

### Information schema: concepts, data types, visibility rules  [M1, M6]  (source: information-schema.txt, infoschema-schema.txt, infoschema-datatypes.txt, all infoschema-*.txt)
- `information_schema` = SQL-standard set of views about objects in the CURRENT database; portable and stable, unlike PostgreSQL-specific system catalogs (`pg_catalog`), which are modelled after implementation concerns. It does NOT show PostgreSQL-specific features (query the catalogs for those).
- The schema exists automatically in every database; owned by the initial database user of the cluster (who can even drop it; space saving minuscule). NOT on the default `search_path` — use qualified names (`information_schema.tables`); be careful adding it to the path because its object names are generic.
- Duplicate-row caveat: SQL requires constraint names unique per schema; PostgreSQL does not enforce that (auto-generated names avoid duplicates, user-specified ones may collide). So a standard query expecting one row may return several from `check_constraint_routine_usage`, `check_constraints`, `domain_constraints`, `referential_constraints`. `constraint_column_usage`, `constraint_table_usage`, `table_constraints` include the table name to disambiguate.
- Every column has one of FIVE domain types (simple domains over built-ins; don't use them outside information_schema): `cardinal_number` (nonnegative integer), `character_data` (character string, no specific max length), `sql_identifier` (character string used for SQL identifiers), `time_stamp` (domain over `timestamp with time zone`), `yes_or_no` (character string domain containing `YES` or `NO` — booleans, because the information schema predates SQL's boolean type).
- Visibility filters used by the views (exact phrasing per view in the inventory):
  - (A) "current user has access ... by being the owner or having some privilege" (e.g. `tables`, `columns`, `views`, `routines`, `sequences`, `schemata`, `domains`, `parameters`, `key_column_usage`, FDW views);
  - (B) "owned by a currently enabled role" (e.g. `check_constraints`, `constraint_column_usage`, `view_table_usage`, `*_udt_usage`, `routine_*_usage`);
  - (C) "owns or has some privilege OTHER THAN SELECT" (`table_constraints`, `triggers`, `triggered_update_columns`, `referential_constraints` = write access to referencing table);
  - (D) privilege views: grantor OR grantee is a currently enabled role (`*_privileges`); `role_*_grants` = same but OMIT objects accessible only via a grant to PUBLIC.
  - Text columns that are hidden (NULL) unless owned by a currently enabled role: `views.view_definition`, `routines.routine_definition`, `parameters.parameter_default`, `triggers.action_condition`.
- Role sets: `enabled_roles` = current user + all roles granted with automatic inheritance (recursively); `applicable_roles` = all roles reachable by any chain of grants (used for permission checks; broader) — prefer `applicable_roles`. `administrable_role_authorizations` = roles current user has ADMIN option for (`is_grantable` always YES).
- Common column families: `*_catalog` always the current database; many columns "Apply to a feature not available in PostgreSQL" (character sets, scope/REF types, interval_precision, modules, etc.) and are null; `maximum_cardinality` always null (arrays have unlimited cardinality); `dtd_identifier` = data type descriptor id used for joins (format undefined).
- Type representation (`columns`, `attributes`, `domains`, `parameters`, `routines`): `data_type` = built-in type name, or `ARRAY` (then join `element_types` on dtd_identifier), or `USER-DEFINED` (then see `udt_name`). For domain-typed columns, `data_type`/`udt_*` give the UNDERLYING type and `domain_*` the domain; use `coalesce(domain_name, udt_name)` to treat domains as separate types. PostgreSQL lists built-in types like user-defined ones in `*_udt_usage` (an extension of the standard). For parameters and routine return types, length/precision/collation columns are always null.
- Documented array join:
  `SELECT c.column_name, c.data_type, e.data_type AS element_type FROM information_schema.columns c LEFT JOIN information_schema.element_types e ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier) = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier)) WHERE c.table_schema = '...' AND c.table_name = '...' ORDER BY c.ordinal_position;`
- Notable view semantics:
  - `check_constraints` INCLUDES not-null constraints (SQL treats them as `CHECK (col IS NOT NULL)`); `table_constraints.constraint_type` is `CHECK` (includes not-null), `FOREIGN KEY`, `PRIMARY KEY`, `UNIQUE`, with `is_deferrable`, `initially_deferred`, `enforced`, `nulls_distinct` (unique constraints only).
  - `constraint_column_usage`: for CHECK -> columns in expression; not-null -> the column; FK -> the REFERENCED columns; unique/PK -> constrained columns. `constraint_table_usage`: FK -> referenced table; unique/PK -> own table; excludes check and not-null. `key_column_usage`: columns restricted by unique/PK/FK with `ordinal_position` and `position_in_unique_constraint` (FK only).
  - `referential_constraints`: `unique_constraint_*` referenced, `match_option` (FULL, PARTIAL, NONE), `update_rule`/`delete_rule` (CASCADE, SET NULL, SET DEFAULT, RESTRICT, NO ACTION).
  - `column_privileges`: table-level grants appear per column only for SELECT, INSERT, UPDATE, REFERENCES. `table_privileges.privilege_type`: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER; `with_hierarchy` = YES iff SELECT. Routine privilege is always EXECUTE. `udt_privileges` only composite types, privilege `TYPE USAGE`; `role_udt_grants` is EMPTY (types only have an implicit PUBLIC grant). `usage_privileges` covers COLLATION, DOMAIN, FOREIGN DATA WRAPPER, FOREIGN SERVER, SEQUENCE (collations shown as implicit non-grantable USAGE to PUBLIC; sequence SELECT/UPDATE are nonstandard and not shown).
  - `columns` excludes system columns (`ctid`, etc.); identity columns: `is_identity`, `identity_generation` (ALWAYS / BY DEFAULT), `identity_start/increment/maximum/minimum` (strings), `identity_cycle`; generated: `is_generated` (ALWAYS / NEVER), `generation_expression`; `is_updatable` (base tables always YES). `column_column_usage` = generated columns -> base columns they depend on.
  - `tables.table_type`: `BASE TABLE`, `VIEW`, `FOREIGN`, `LOCAL TEMPORARY`; `is_insertable_into`, `is_typed`, typed-table `user_defined_type_*`; `commit_action` not yet implemented.
  - `views`: `view_definition`, `check_option` (CASCADED / LOCAL / NONE), `is_updatable` (UPDATE and DELETE), `is_insertable_into`, `is_trigger_updatable/deletable/insertable_into` (INSTEAD OF triggers). `view_column_usage` and `view_table_usage` exclude system tables ("should be fixed sometime").
  - `routines`: `specific_name` uniquely identifies an overloaded function within the schema (format undefined, only for comparison); `routine_type` FUNCTION / PROCEDURE; `routine_body` SQL / EXTERNAL; `external_language`; `parameter_style` always GENERAL; `is_deterministic` YES iff IMMUTABLE (other volatility levels not visible); `sql_data_access` always MODIFIES; `is_null_call` (STRICT); `security_type` INVOKER / DEFINER; `schema_level_routine` always YES; return-type columns null for procedures. `parameters.parameter_mode` IN / OUT / INOUT. `routine_column_usage`, `routine_routine_usage`, `routine_sequence_usage` only work for UNQUOTED SQL bodies (SQL-standard `BEGIN ATOMIC` / `RETURN` style), not quoted bodies or other languages; `routine_routine_usage` uses specific names in both column sets (per standard, "arguably a misdesign"); `routine_table_usage` is NOT TRACKED by PostgreSQL (empty).
  - `sequences`: start/minimum/maximum/increment returned as CHARACTER STRINGS per standard; `cycle_option`.
  - `triggers`: `event_manipulation` (INSERT, UPDATE, DELETE), `action_order` (PostgreSQL fires in NAME order), `action_condition` (WHEN), `action_statement` (always `EXECUTE FUNCTION function(...)`), `action_orientation` (ROW / STATEMENT), `action_timing` (BEFORE, AFTER, INSTEAD OF), `action_reference_old_table`/`new_table` (transition tables). Two incompatibilities: trigger names are per-table (duplicates per schema possible) and multi-event triggers (`ON INSERT OR UPDATE`) appear as one row per event; real key is `(trigger_catalog, trigger_schema, event_object_table, trigger_name, event_manipulation)`. Columns renamed from `condition_*` to `action_*` in 9.1 (SQL:2003 naming).
  - `user_defined_types`: only composite types (`user_defined_type_category` always STRUCTURED); base types and enums are not shown.
  - `character_sets`: exactly one row (the database encoding); `character_repertoire` = `UCS` if UTF8 else encoding name; default collation = the one matching database COLLATE/CTYPE. `collations.pad_attribute` always `NO PAD`.
  - `user_mapping_options.option_value` is NULL unless the current user is the mapped user, or mapping is PUBLIC and current user is server owner, or superuser (protects stored passwords).
  - `sql_features` (same data as Appendix D; `is_verified_by` always null), `sql_parts`, `sql_implementation_info` and `sql_sizing` (ODBC-oriented; `supported_value` 0 = unlimited/undeterminable) are TABLES, as is `information_schema_catalog_name` (one row, one column).
  - `transforms`: one row per from-SQL / to-SQL function; `group_name` holds the LANGUAGE (PostgreSQL has no transform groups); `transform_type` FROM SQL / TO SQL.

## Complete inventories

### libpq connection parameter keywords (PostgreSQL 18)
| keyword | default | env var | purpose |
|---|---|---|---|
| host | Unix socket in /tmp (build socket dir); Windows: localhost | PGHOST | host name, socket dir (abs path), `@abstract` socket; comma list |
| hostaddr | (none; host is resolved) | PGHOSTADDR | numeric IP, skips DNS; comma list |
| port | build-time port (normally 5432) | PGPORT | TCP port / socket file extension; comma list or one for all |
| dbname | same as user | PGDATABASE | database; may be an expandable conninfo/URI |
| user | OS user name | PGUSER | role to connect as |
| password | none | PGPASSWORD (discouraged) | password |
| passfile | ~/.pgpass (Win %APPDATA%\postgresql\pgpass.conf) | PGPASSFILE | password file |
| require_auth | any method, or none | PGREQUIREAUTH | password, md5, gss, sspi, scram-sha-256, oauth, none; `!` negation; list |
| channel_binding | prefer (SSL build) else disable | PGCHANNELBINDING | require / prefer / disable (SCRAM over SSL, server 11+) |
| connect_timeout | 0 = wait indefinitely | PGCONNECT_TIMEOUT | seconds, per host/address |
| client_encoding | server setting | PGCLIENTENCODING | sets client_encoding; `auto` from locale |
| options | none | PGOPTIONS | server command-line options, e.g. `-c geqo=off` |
| application_name | none | PGAPPNAME | sets application_name |
| fallback_application_name | none | — | used if no application_name/PGAPPNAME |
| keepalives | 1 | — | TCP keepalives on/off |
| keepalives_idle | 0 = system default | — | seconds idle before keepalive |
| keepalives_interval | 0 = system default | — | seconds between retransmits |
| keepalives_count | 0 = system default | — | lost keepalives before dead |
| tcp_user_timeout | 0 = system default | — | ms unacknowledged before close |
| replication | false | — | true/on/yes/1 physical; database = logical; simple protocol only |
| gssencmode | prefer (GSSAPI build) | PGGSSENCMODE | disable / prefer / require |
| sslmode | prefer | PGSSLMODE | disable / allow / prefer / require / verify-ca / verify-full |
| requiressl | 0 | PGREQUIRESSL (deprecated) | 1 = require |
| sslnegotiation | postgres | PGSSLNEGOTIATION | postgres / direct (PG17+, needs sslmode>=require) |
| sslcompression | 0 | PGSSLCOMPRESSION | SSL compression (insecure; backend disabled since 14) |
| sslcert | ~/.postgresql/postgresql.crt | PGSSLCERT | client certificate |
| sslkey | ~/.postgresql/postgresql.key | PGSSLKEY | client key or `engine:id` |
| sslkeylogfile | none | — | NSS-format TLS key log |
| sslpassword | none | — (service file OK, not .pgpass) | passphrase for sslkey |
| sslcertmode | allow | PGSSLCERTMODE | disable / allow / require |
| sslrootcert | ~/.postgresql/root.crt | PGSSLROOTCERT | CA file or `system` (forces verify-full default) |
| sslcrl | ~/.postgresql/root.crl | PGSSLCRL | CRL file |
| sslcrldir | none | PGSSLCRLDIR | CRL directory |
| sslsni | 1 | PGSSLSNI | TLS SNI |
| requirepeer | none | PGREQUIREPEER | OS user server must run as (Unix sockets) |
| ssl_min_protocol_version | TLSv1.2 | PGSSLMINPROTOCOLVERSION | TLSv1 / TLSv1.1 / TLSv1.2 / TLSv1.3 |
| ssl_max_protocol_version | unset (backend bound) | PGSSLMAXPROTOCOLVERSION | same values |
| min_protocol_version | 3.0 (any supported) | PGMINPROTOCOLVERSION | 3.0 / 3.2 / latest |
| max_protocol_version | 3.0 unless a feature needs more | PGMAXPROTOCOLVERSION | 3.0 / 3.2 / latest (=3.2) |
| krbsrvname | postgres | PGKRBSRVNAME | Kerberos service name |
| gsslib | sspi (Windows dual builds) | PGGSSLIB | `gssapi` to force GSSAPI |
| gssdelegation | 0 | PGGSSDELEGATION | forward GSS credentials |
| scram_client_key | none | — | base64 SCRAM key for pass-through (FDWs) |
| scram_server_key | none | — | base64 SCRAM key for pass-through (FDWs) |
| service | none | PGSERVICE | pg_service.conf entry |
| target_session_attrs | any | PGTARGETSESSIONATTRS | any / read-write / read-only / primary / standby / prefer-standby |
| load_balance_hosts | disable | PGLOADBALANCEHOSTS | disable / random |
| oauth_issuer | none (required for OAuth) | — | HTTPS issuer URL or /.well-known/ URI |
| oauth_client_id | none | — | OAuth client id |
| oauth_client_secret | none | — | OAuth client secret |
| oauth_scope | server-provided | — | space-separated scopes |
Other libpq env vars: `PGSERVICEFILE` (default ~/.pg_service.conf), `PGDATESTYLE`, `PGTZ`, `PGGEQO` (session defaults), `PGSYSCONFDIR`, `PGLOCALEDIR` (libpq internals), `PGOAUTHDEBUG=UNSAFE`, `PGOAUTHCAFILE` (OAuth debug), `OPENSSL_CONF`, `SSL_CERT_DIR`, `SSL_CERT_FILE` (OpenSSL).

### libpq enumerations
- `ConnStatusType`: CONNECTION_OK, CONNECTION_BAD; async-only: CONNECTION_STARTED, CONNECTION_MADE, CONNECTION_AWAITING_RESPONSE, CONNECTION_AUTH_OK, CONNECTION_SSL_STARTUP, CONNECTION_GSS_STARTUP, CONNECTION_CHECK_WRITABLE, CONNECTION_CHECK_STANDBY, CONNECTION_CONSUME; cancel-only: CONNECTION_ALLOCATED.
- `PostgresPollingStatusType`: PGRES_POLLING_READING, PGRES_POLLING_WRITING, PGRES_POLLING_OK, PGRES_POLLING_FAILED.
- `PGTransactionStatusType`: PQTRANS_IDLE, PQTRANS_ACTIVE, PQTRANS_INTRANS, PQTRANS_INERROR, PQTRANS_UNKNOWN.
- `ExecStatusType` (15): PGRES_EMPTY_QUERY, PGRES_COMMAND_OK, PGRES_TUPLES_OK, PGRES_COPY_OUT, PGRES_COPY_IN, PGRES_BAD_RESPONSE, PGRES_NONFATAL_ERROR, PGRES_FATAL_ERROR, PGRES_COPY_BOTH (streaming replication only), PGRES_SINGLE_TUPLE, PGRES_TUPLES_CHUNK, PGRES_PIPELINE_SYNC, PGRES_PIPELINE_ABORTED.
- `PGpipelineStatus`: PQ_PIPELINE_ON, PQ_PIPELINE_OFF, PQ_PIPELINE_ABORTED.
- `PGPing`: PQPING_OK, PQPING_REJECT, PQPING_NO_RESPONSE, PQPING_NO_ATTEMPT.
- `PGVerbosity`: PQERRORS_TERSE, PQERRORS_DEFAULT, PQERRORS_VERBOSE, PQERRORS_SQLSTATE. `PGContextVisibility`: PQSHOW_CONTEXT_NEVER, PQSHOW_CONTEXT_ERRORS (default), PQSHOW_CONTEXT_ALWAYS.
- `PGEventId`: PGEVT_REGISTER, PGEVT_CONNRESET, PGEVT_CONNDESTROY, PGEVT_RESULTCREATE, PGEVT_RESULTCOPY, PGEVT_RESULTDESTROY.
- `PGauthData`: PQAUTHDATA_PROMPT_OAUTH_DEVICE, PQAUTHDATA_OAUTH_BEARER_TOKEN.
- PQcopyResult flags: PG_COPYRES_ATTRS, PG_COPYRES_TUPLES, PG_COPYRES_NOTICEHOOKS, PG_COPYRES_EVENTS. Trace flags: PQTRACE_SUPPRESS_TIMESTAMPS, PQTRACE_REGRESS_MODE. LO modes: INV_READ, INV_WRITE.
- `PQresultErrorField` codes (17): PG_DIAG_SEVERITY (always), PG_DIAG_SEVERITY_NONLOCALIZED (9.6+), PG_DIAG_SQLSTATE (always), PG_DIAG_MESSAGE_PRIMARY (always), PG_DIAG_MESSAGE_DETAIL, PG_DIAG_MESSAGE_HINT, PG_DIAG_STATEMENT_POSITION (1-based, characters), PG_DIAG_INTERNAL_POSITION, PG_DIAG_INTERNAL_QUERY, PG_DIAG_CONTEXT, PG_DIAG_SCHEMA_NAME, PG_DIAG_TABLE_NAME, PG_DIAG_COLUMN_NAME, PG_DIAG_DATATYPE_NAME, PG_DIAG_CONSTRAINT_NAME (indexes count as constraints), PG_DIAG_SOURCE_FILE, PG_DIAG_SOURCE_LINE, PG_DIAG_SOURCE_FUNCTION.
- Server-reported `PQparameterStatus` parameters (15): application_name, client_encoding, DateStyle, default_transaction_read_only, in_hot_standby, integer_datetimes, IntervalStyle, is_superuser, scram_iterations, search_path (new in 18), server_encoding, server_version, session_authorization, standard_conforming_strings, TimeZone.

### libpq function index by section
- 32.1 connect: PQconnectdbParams, PQconnectdb, PQsetdbLogin, PQsetdb, PQconnectStartParams, PQconnectStart, PQconnectPoll, PQsocketPoll, PQconndefaults, PQconninfo, PQconninfoParse, PQfinish, PQreset, PQresetStart, PQresetPoll, PQpingParams, PQping, PQsetSSLKeyPassHook_OpenSSL, PQgetSSLKeyPassHook_OpenSSL.
- 32.2 status: PQdb, PQuser, PQpass, PQhost, PQhostaddr, PQport, PQtty, PQoptions, PQstatus, PQtransactionStatus, PQparameterStatus, PQfullProtocolVersion, PQprotocolVersion, PQserverVersion, PQerrorMessage, PQsocket, PQbackendPID, PQconnectionNeedsPassword, PQconnectionUsedPassword, PQconnectionUsedGSSAPI, PQsslInUse, PQsslAttribute, PQsslAttributeNames, PQsslStruct, PQgetssl.
- 32.3 exec: PQexec, PQexecParams, PQprepare, PQexecPrepared, PQdescribePrepared, PQdescribePortal, PQclosePrepared, PQclosePortal, PQresultStatus, PQresStatus, PQresultErrorMessage, PQresultVerboseErrorMessage, PQresultErrorField, PQclear, PQntuples, PQnfields, PQfname, PQfnumber, PQftable, PQftablecol, PQfformat, PQftype, PQfmod, PQfsize, PQbinaryTuples, PQgetvalue, PQgetisnull, PQgetlength, PQnparams, PQparamtype, PQprint, PQcmdStatus, PQcmdTuples, PQoidValue, PQoidStatus, PQescapeLiteral, PQescapeIdentifier, PQescapeStringConn, PQescapeString, PQescapeByteaConn, PQescapeBytea, PQunescapeBytea.
- 32.4 async: PQsendQuery, PQsendQueryParams, PQsendPrepare, PQsendQueryPrepared, PQsendDescribePrepared, PQsendDescribePortal, PQsendClosePrepared, PQsendClosePortal, PQgetResult, PQconsumeInput, PQisBusy, PQsetnonblocking, PQisnonblocking, PQflush.
- 32.5 pipeline: PQpipelineStatus, PQenterPipelineMode, PQexitPipelineMode, PQpipelineSync, PQsendPipelineSync, PQsendFlushRequest.
- 32.6 chunks: PQsetSingleRowMode, PQsetChunkedRowsMode.
- 32.7 cancel: PQcancelCreate, PQcancelBlocking, PQcancelStart, PQcancelPoll, PQcancelStatus, PQcancelSocket, PQcancelErrorMessage, PQcancelFinish, PQcancelReset; obsolete PQgetCancel, PQfreeCancel, PQcancel, PQrequestCancel.
- 32.8 PQfn. 32.9 PQnotifies. 32.10 COPY: PQputCopyData, PQputCopyEnd, PQgetCopyData; obsolete PQgetline, PQgetlineAsync, PQputline, PQputnbytes, PQendcopy.
- 32.11 control: PQclientEncoding, pg_encoding_to_char, PQsetClientEncoding, PQsetErrorVerbosity, PQsetErrorContextVisibility, PQtrace, PQsetTraceFlags, PQuntrace.
- 32.12 misc: PQfreemem, PQconninfoFree, PQencryptPasswordConn, PQchangePassword, PQencryptPassword, PQmakeEmptyPGresult, PQfireResultCreateEvents, PQcopyResult, PQsetResultAttrs, PQsetvalue, PQresultAlloc, PQresultMemorySize, PQlibVersion, PQgetCurrentTimeUSec.
- 32.13 notices: PQsetNoticeReceiver, PQsetNoticeProcessor. 32.14 events: PQregisterEventProc, PQsetInstanceData, PQinstanceData, PQresultSetInstanceData, PQresultInstanceData.
- 32.19 SSL init: PQinitOpenSSL, PQinitSSL (no-ops). 32.20 OAuth: PQsetAuthDataHook, PQgetAuthDataHook (PQdefaultAuthDataHook). 32.21: PQisthreadsafe (PQregisterThreadLock).

### Large object functions
- Client (libpq, `libpq/libpq-fs.h`): lo_create(conn, lobjId) -> Oid; lo_creat(conn, mode) -> Oid; lo_import(conn, filename) -> Oid; lo_import_with_oid(conn, filename, lobjId) -> Oid; lo_export(conn, lobjId, filename) -> 1/-1; lo_open(conn, lobjId, mode) -> fd/-1; lo_write(conn, fd, buf, len); lo_read(conn, fd, buf, len); lo_lseek(conn, fd, offset, whence); lo_lseek64; lo_tell(conn, fd); lo_tell64; lo_truncate(conn, fd, len); lo_truncate64; lo_close(conn, fd) -> 0/-1; lo_unlink(conn, lobjId) -> 1/-1.
- Server (SQL): lo_from_bytea(loid oid, data bytea) -> oid; lo_put(loid oid, offset bigint, data bytea) -> void; lo_get(loid oid [, offset bigint, length integer]) -> bytea; lo_creat, lo_create, lo_unlink, lo_import(path [, oid]), lo_export(oid, path) (server filesystem, superuser by default); loread, lowrite (no underscore); plus server equivalents of the other client calls. Catalogs: pg_largeobject (chunks), pg_largeobject_metadata (owner/ACL). GUC: lo_compat_privileges.

### ECPG embedded SQL commands (34.14)
| command | synopsis | purpose |
|---|---|---|
| ALLOCATE DESCRIPTOR | `ALLOCATE DESCRIPTOR name` | allocate named SQL descriptor area |
| CONNECT | `CONNECT TO connection_target [AS connection_name] [USER connection_user]`; `CONNECT TO DEFAULT`; `CONNECT connection_user`; `DATABASE connection_target` | open connection |
| DEALLOCATE DESCRIPTOR | `DEALLOCATE DESCRIPTOR name` | free descriptor |
| DECLARE | `DECLARE cursor_name [BINARY] [ASENSITIVE | INSENSITIVE] [[NO] SCROLL] CURSOR [{WITH | WITHOUT} HOLD] FOR prepared_name | query` | define cursor (executes at OPEN) |
| DECLARE STATEMENT | `EXEC SQL [AT connection_name] DECLARE statement_name STATEMENT` | bind statement id to a connection |
| DESCRIBE | `DESCRIBE [OUTPUT] prepared_name USING|INTO [SQL] DESCRIPTOR descriptor_name`; `... INTO sqlda_name` | result-column metadata |
| DISCONNECT | `DISCONNECT connection_name | [CURRENT] | ALL` | close connection(s) |
| EXECUTE IMMEDIATE | `EXECUTE IMMEDIATE string` | prepare+execute, no result rows |
| GET DESCRIPTOR | `GET DESCRIPTOR d :cvar = COUNT`; `GET DESCRIPTOR d VALUE n :cvar = item [, ...]` | read descriptor |
| OPEN | `OPEN cursor_name [USING value [, ...] | USING SQL DESCRIPTOR d]` | open cursor (query starts) |
| PREPARE | `PREPARE prepared_name FROM string` | prepare dynamic SELECT/INSERT/UPDATE/DELETE with `?` |
| SET AUTOCOMMIT | `SET AUTOCOMMIT { = | TO } { ON | OFF }` | autocommit (default OFF) |
| SET CONNECTION | `SET CONNECTION [TO | =] connection_name` | choose current connection |
| SET DESCRIPTOR | `SET DESCRIPTOR d COUNT = v`; `SET DESCRIPTOR d VALUE n item = v [, ...]` | populate input descriptor |
| TYPE | `TYPE type_name IS ctype` | define C type (needs `ecpg -c`) |
| VAR | `VAR varname IS ctype` | re-type a host variable |
| WHENEVER | `WHENEVER { NOT FOUND | SQLERROR | SQLWARNING } action` | condition handler |

### ECPG SQLCODE values (with SQLSTATE)
0 ECPG_NO_ERROR (00000); 100 ECPG_NOT_FOUND (02000); -12 ECPG_OUT_OF_MEMORY (YE001; = -ENOMEM); -200 ECPG_UNSUPPORTED (YE002); -201 ECPG_TOO_MANY_ARGUMENTS (07001/07002); -202 ECPG_TOO_FEW_ARGUMENTS (07001/07002); -203 ECPG_TOO_MANY_MATCHES (21000); -204 ECPG_INT_FORMAT (42804; strtol); -205 ECPG_UINT_FORMAT (42804; strtoul); -206 ECPG_FLOAT_FORMAT (42804; strtod); -207 ECPG_NUMERIC_FORMAT (42804); -208 ECPG_INTERVAL_FORMAT (42804); -209 ECPG_DATE_FORMAT (42804); -210 ECPG_TIMESTAMP_FORMAT (42804); -211 ECPG_CONVERT_BOOL (42804; neither 't' nor 'f'); -212 ECPG_EMPTY (YE002); -213 ECPG_MISSING_INDICATOR (22002); -214 ECPG_NO_ARRAY (42804); -215 ECPG_DATA_NOT_ARRAY (42804); -216 ECPG_ARRAY_INSERT (42804); -220 ECPG_NO_CONN (08003); -221 ECPG_NOT_CONN (YE002); -230 ECPG_INVALID_STMT (26000); -239 ECPG_INFORMIX_DUPLICATE_KEY (23505); -240 ECPG_UNKNOWN_DESCRIPTOR (33000); -241 ECPG_INVALID_DESCRIPTOR_INDEX (07009); -242 ECPG_UNKNOWN_DESCRIPTOR_ITEM (YE002); -243 ECPG_VAR_NOT_NUMERIC (07006); -244 ECPG_VAR_NOT_CHAR (07006); -284 ECPG_INFORMIX_SUBSELECT_NOT_ONE (21000); -400 ECPG_PGSQL (server error, message from server); -401 ECPG_TRANS (08007); -402 ECPG_CONNECT (08001); -403 ECPG_DUPLICATE_KEY (23505); -404 ECPG_SUBSELECT_NOT_ONE (21000); -602 ECPG_WARNING_UNKNOWN_PORTAL (34000); -603 ECPG_WARNING_IN_TRANSACTION (25001); -604 ECPG_WARNING_NO_TRANSACTION (25P01); -605 ECPG_WARNING_PORTAL_EXISTS (42P03).

### Information schema: every relation (65 = 1 catalog-name table + 64 sections 35.4–35.66), with purpose and visibility
| § | relation | purpose / key columns | shown when |
|---|---|---|---|
| 35.3 | information_schema_catalog_name | table: one row, `catalog_name` = current database | always |
| 35.4 | administrable_role_authorizations | roles current user has ADMIN option for (grantee, role_name, is_grantable always YES) | current user |
| 35.5 | applicable_roles | roles whose privileges current user can use via any grant chain, incl. itself (grantee, role_name, is_grantable = admin option) | current user |
| 35.6 | attributes | attributes of COMPOSITE types (not table columns): udt_*, attribute_name, ordinal_position, attribute_default, is_nullable, data_type, lengths, collation, precision, attribute_udt_*, dtd_identifier | owner or some privilege on the type |
| 35.7 | character_sets | the single database encoding (character_set_name, character_repertoire UCS/encoding, form_of_use, default_collate_*) | always |
| 35.8 | check_constraint_routine_usage | routines used by check constraints (constraint_*, specific_*) | routine owned by enabled role |
| 35.9 | check_constraints | table & domain CHECK constraints incl. NOT NULL (constraint_*, check_clause) | owned by enabled role |
| 35.10 | collations | collations (collation_*, pad_attribute always NO PAD) | always |
| 35.11 | collation_character_set_applicability | collation -> character set (only one per DB; little info) | always |
| 35.12 | column_column_usage | generated column -> base column it depends on (table_*, column_name, dependent_column) | table owned by enabled role |
| 35.13 | column_domain_usage | columns using a domain (domain_*, table_*, column_name) | domain owned by enabled role |
| 35.14 | column_options | options on foreign-table columns (option_name, option_value) | owner/privilege |
| 35.15 | column_privileges | column grants (grantor, grantee, table_*, column_name, privilege_type SELECT/INSERT/UPDATE/REFERENCES, is_grantable) | grantor or grantee enabled role |
| 35.16 | column_udt_usage | columns whose (underlying) type is owned by enabled role; built-ins included | type owned by enabled role |
| 35.17 | columns | all table/view columns (no system columns): position, default, nullability, type info, collation, domain_*, udt_*, identity_*, is_generated, generation_expression, is_updatable | owner/privilege |
| 35.18 | constraint_column_usage | columns used by constraints (check expr, not-null column, FK referenced cols, PK/unique cols) | table owned by enabled role |
| 35.19 | constraint_table_usage | tables used by constraints (FK referenced table; PK/unique own table; no check/not-null) | table owned by enabled role |
| 35.20 | data_type_privileges | data type descriptors (object_*, object_type TABLE/DOMAIN/ROUTINE, dtd_identifier); used to build other views | owner/privilege |
| 35.21 | domain_constraints | constraints of domains (constraint_*, domain_*, is_deferrable, initially_deferred) | owner/privilege on domain |
| 35.22 | domain_udt_usage | domains based on types owned by enabled role (incl. built-ins) | type owned by enabled role |
| 35.23 | domains | all domains: data_type, lengths, collation, precision, domain_default, udt_*, dtd_identifier | owner/privilege |
| 35.24 | element_types | element type descriptors of arrays (object_*, object_type, collection_type_identifier, data_type, udt_*) | owner/privilege |
| 35.25 | enabled_roles | role_name of current user + automatically inherited memberships | current user |
| 35.26 | foreign_data_wrapper_options | FDW options | owner/privilege |
| 35.27 | foreign_data_wrappers | FDWs (authorization_identifier, library_name, foreign_data_wrapper_language) | owner/privilege |
| 35.28 | foreign_server_options | foreign server options | owner/privilege |
| 35.29 | foreign_servers | foreign servers (FDW, foreign_server_type, foreign_server_version, owner) | owner/privilege |
| 35.30 | foreign_table_options | foreign table options | owner/privilege |
| 35.31 | foreign_tables | foreign tables -> server | owner/privilege |
| 35.32 | key_column_usage | columns in unique/PK/FK constraints (ordinal_position, position_in_unique_constraint) | owner/privilege |
| 35.33 | parameters | function parameters (specific_*, ordinal_position, parameter_mode IN/OUT/INOUT, parameter_name, data_type, udt_*, parameter_default) | owner/privilege on function |
| 35.34 | referential_constraints | FKs (unique_constraint_*, match_option, update_rule, delete_rule) | write access (privilege other than SELECT) to referencing table |
| 35.35 | role_column_grants | column_privileges minus PUBLIC-only grants | grantor/grantee enabled role |
| 35.36 | role_routine_grants | routine_privileges minus PUBLIC-only grants | grantor/grantee enabled role |
| 35.37 | role_table_grants | table_privileges minus PUBLIC-only grants | grantor/grantee enabled role |
| 35.38 | role_udt_grants | USAGE on UDTs minus PUBLIC — always EMPTY in PostgreSQL | — |
| 35.39 | role_usage_grants | usage_privileges minus PUBLIC-only grants | grantor/grantee enabled role |
| 35.40 | routine_column_usage | columns used by routine SQL bodies / param defaults (unquoted bodies only) | table owned by enabled role |
| 35.41 | routine_privileges | EXECUTE grants on functions (specific_*, routine_*) | grantor/grantee enabled role |
| 35.42 | routine_routine_usage | routines used by other routines (both by specific name; unquoted bodies) | used routine owned by enabled role |
| 35.43 | routine_sequence_usage | sequences used by routines (unquoted bodies) | sequence owned by enabled role |
| 35.44 | routine_table_usage | tables used by routines — NOT tracked by PostgreSQL | — |
| 35.45 | routines | functions & procedures (specific_name, routine_type, return type, routine_body, routine_definition, external_language, is_deterministic, is_null_call, security_type, ...) | owner/privilege |
| 35.46 | schemata | schemas (catalog_name, schema_name, schema_owner) | owner/privilege |
| 35.47 | sequences | sequences (data_type, precision, start/minimum/maximum/increment as strings, cycle_option) | owner/privilege |
| 35.48 | sql_features | table: SQL standard feature support (feature_id, sub_feature_id, is_supported, comments) = Appendix D | always |
| 35.49 | sql_implementation_info | table: implementation-defined items (ODBC) | always |
| 35.50 | sql_parts | table: support for parts of the SQL standard | always |
| 35.51 | sql_sizing | table: size limits (ODBC; 0 = unlimited) | always |
| 35.52 | table_constraints | constraints of tables (constraint_type CHECK/FOREIGN KEY/PRIMARY KEY/UNIQUE, deferrability, enforced, nulls_distinct) | owner or privilege other than SELECT |
| 35.53 | table_privileges | table/view grants (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER; with_hierarchy) | grantor/grantee enabled role |
| 35.54 | tables | tables & views (table_type BASE TABLE/VIEW/FOREIGN/LOCAL TEMPORARY, is_insertable_into, is_typed) | owner/privilege |
| 35.55 | transforms | transform functions (udt_*, specific_*, group_name = language, transform_type FROM SQL/TO SQL) | always |
| 35.56 | triggered_update_columns | columns in `UPDATE OF col` trigger lists | owner or privilege other than SELECT |
| 35.57 | triggers | triggers (event_manipulation, action_order, action_condition, action_statement, action_orientation, action_timing, transition tables) | owner or privilege other than SELECT |
| 35.58 | udt_privileges | TYPE USAGE grants on composite types | grantor/grantee enabled role |
| 35.59 | usage_privileges | USAGE on collations, domains, FDWs, foreign servers, sequences | grantor/grantee enabled role |
| 35.60 | user_defined_types | composite types only (category always STRUCTURED) | owner/privilege |
| 35.61 | user_mapping_options | user mapping options (option_value hidden except mapped user / PUBLIC+server owner / superuser) | access to foreign server |
| 35.62 | user_mappings | user mappings (authorization_identifier or PUBLIC, server) | access to foreign server |
| 35.63 | view_column_usage | columns used in view queries (no system tables) | table owned by enabled role |
| 35.64 | view_routine_usage | routines used in view queries | routine owned by enabled role |
| 35.65 | view_table_usage | tables used in view queries (no system tables) | table owned by enabled role |
| 35.66 | views | views (view_definition, check_option, is_updatable, is_insertable_into, is_trigger_*) | owner/privilege |
Information-schema domains: cardinal_number, character_data, sql_identifier, time_stamp, yes_or_no.

## Lesson ideas

### Visualizers
- **Connection state machine** [M6, M1]: animate `PQconnectStartParams` -> PQconnectPoll loop, alternating PGRES_POLLING_WRITING/READING with socket readiness, passing CONNECTION_STARTED -> MADE -> (SSL_STARTUP/GSS_STARTUP) -> AWAITING_RESPONSE -> AUTH_OK -> CHECK_WRITABLE/CHECK_STANDBY -> OK/BAD. Include the facts that `connect_timeout` is ignored in poll mode and the socket may change between polls.
- **Multi-host chooser** [M7]: list of hosts (some down, some standby, one with 2 DNS addresses). Toggle `target_session_attrs` (6 modes) and `load_balance_hosts` (disable/random) to show the try-order (two-level shuffle: host order, then that host's addresses), per-host `connect_timeout` accumulation, `prefer-standby` second pass in `any` mode, and "auth failure stops the scan".
- **Defaults resolution ladder**: for one keyword, show connection string > service file > environment variable > compiled default, plus expand_dbname array ordering (entries after dbname override the string).
- **sslmode ladder** [M1]: six rungs coloured by Table 32.1 (eavesdropping / MITM protection), with an attacker toggle (passive sniffer vs DNS-poisoning MITM). Show `require` silently becoming verify-ca when root.crt exists, and `sslrootcert=system` forcing verify-full. Also show GSS encryption pre-empting SSL.
- **Round-trip timeline: sync vs async vs pipeline**: 100 statements at 300 ms RTT -> 30 s vs about 0.3 s. Pipeline queue: client-side queue, Sync markers, server-side result buffering, an error turning later results into PGRES_PIPELINE_ABORTED until PGRES_PIPELINE_SYNC; implicit vs explicit transaction rollback outcomes; deadlock when both buffers fill in blocking mode.
- **PGresult stream**: default buffered PGRES_TUPLES_OK vs single-row (PGRES_SINGLE_TUPLE xN + empty TUPLES_OK) vs chunked (PGRES_TUPLES_CHUNK of <= chunkSize). Inject a mid-stream error to show rows already delivered before PGRES_FATAL_ERROR.
- **COPY state diagram**: PQexec(COPY) -> PGRES_COPY_IN -> PQputCopyData* -> PQputCopyEnd(NULL | errmsg) -> PQgetResult (COMMAND_OK / FATAL_ERROR); the COPY_OUT side with PQgetCopyData returning >0 / 0 / -1 / -2.
- **Cancel side channel**: second short-lived connection (no authentication) carrying a cancel request; outcomes "effective -> ERROR result" vs "too late -> nothing visible"; legacy PQcancel shown unencrypted.
- **Large object anatomy** [M2]: LO as rows of chunks in pg_largeobject with a B-tree on (loid, pageno); a sparse write at offset 1,000,000 allocates only touched chunks, and reads before the last chunk return zeros. Compare with a TOAST value (1 GB cap, whole-value rewrite) against an LO (4 TB, partial update). Snapshot toggle: INV_READ (snapshot at lo_open) vs INV_WRITE (sees committed writes).
- **information_schema visibility filter**: same catalog under different roles, showing which rows appear in `tables` (any privilege), `table_constraints` (privilege other than SELECT), `check_constraints` (owner only), `role_table_grants` vs `table_privileges` (PUBLIC grants).
- **ECPG preprocessing**: `.pgc` line -> `ECPGdo(...)` with ten-argument variable blocks; WHENEVER applying by text position, not control flow.

### Playground SQL (PGlite, PG 18)
```sql
-- information_schema basics
SELECT catalog_name FROM information_schema.information_schema_catalog_name;
SELECT * FROM information_schema.enabled_roles;
CREATE TABLE acct (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                   email text NOT NULL UNIQUE, tags text[],
                   total numeric(10,2) CHECK (total >= 0),
                   total_x2 numeric GENERATED ALWAYS AS (total*2) STORED);
SELECT column_name, data_type, udt_name, is_nullable, is_identity, identity_generation,
       is_generated, generation_expression, numeric_precision, numeric_scale
FROM information_schema.columns WHERE table_name = 'acct' ORDER BY ordinal_position;
-- array element types
SELECT c.column_name, c.data_type, e.data_type AS element_type
FROM information_schema.columns c LEFT JOIN information_schema.element_types e
  ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier)
    = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
WHERE c.table_name = 'acct' ORDER BY c.ordinal_position;
-- constraints: not-null appears as CHECK
SELECT constraint_name, constraint_type, nulls_distinct FROM information_schema.table_constraints WHERE table_name='acct';
SELECT * FROM information_schema.check_constraints WHERE constraint_schema='public';
SELECT * FROM information_schema.column_column_usage WHERE table_name='acct';
-- FK rules
CREATE TABLE orders (id int PRIMARY KEY, acct_id int REFERENCES acct ON DELETE CASCADE);
SELECT constraint_name, unique_constraint_name, match_option, update_rule, delete_rule
FROM information_schema.referential_constraints;
SELECT * FROM information_schema.key_column_usage WHERE table_name IN ('acct','orders');
-- sequences return strings
SELECT sequence_name, data_type, start_value, maximum_value, increment FROM information_schema.sequences;
-- compare with the catalog
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'acct'::regclass;
-- multi-event trigger shows as several rows
CREATE FUNCTION trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RETURN NEW; END$$;
CREATE TRIGGER t1 BEFORE INSERT OR UPDATE ON acct FOR EACH ROW EXECUTE FUNCTION trg();
SELECT trigger_name, event_manipulation, action_timing, action_orientation, action_statement
FROM information_schema.triggers;
-- routines: is_deterministic only reflects IMMUTABLE
SELECT routine_name, routine_type, external_language, is_deterministic, security_type FROM information_schema.routines WHERE routine_schema='public';
-- SQL standard conformance
SELECT feature_id, feature_name, is_supported FROM information_schema.sql_features WHERE feature_id LIKE 'T3%' LIMIT 20;

-- Large objects (server-side API)
BEGIN;
SELECT lo_from_bytea(0, '\xffffff00') AS loid \gset   -- or note the returned OID
SELECT lo_put(:loid, 1, '\xaa');
SELECT lo_get(:loid, 0, 3);            -- \xffaaff
SELECT lo_put(:loid, 1000000, '\x01'); -- sparse write
SELECT loid, pageno, length(data) FROM pg_largeobject WHERE loid = :loid ORDER BY pageno;
SELECT oid, lomowner FROM pg_largeobject_metadata;
SELECT lo_unlink(:loid);
COMMIT;

-- Prepared statements (SQL equivalent of PQprepare/PQexecPrepared)
PREPARE q(bigint) AS SELECT $1 * 2;
EXECUTE q(21);
SELECT name, parameter_types, generic_plans, custom_plans FROM pg_prepared_statements;
DEALLOCATE q;

-- LISTEN/NOTIFY within one session
LISTEN chan;
NOTIFY chan, 'hello';
SELECT pg_notify('chan', 'payload 2');

-- Parameters a libpq client would see via ParameterStatus
SHOW search_path; SHOW standard_conforming_strings; SHOW in_hot_standby;
SELECT current_setting('server_version_num');
```
(`\gset` is a psql feature; in the playground, capture the OID in app state instead.)

### Pitfalls the docs explicitly warn about (with fix)
- Untrusted users with an unsecured schema pattern -> start every session with `options=-csearch_path=` or `SELECT pg_catalog.set_config('search_path', '', false)`.
- Forking with open libpq connections -> unpredictable; only `exec` from the child is safe.
- Default `sslmode=prefer` gives no MITM protection -> use `verify-full` (or `verify-ca` with a private CA) and a root cert. A public CA plus `verify-ca` is unsafe.
- Relying on `require` behaving like `verify-ca` when root.crt exists -> use verify-ca/verify-full explicitly.
- GSS encryption silently preferred over SSL -> set `gssencmode=disable` to force SSL.
- `PGPASSWORD` visible via `ps` on some OSes -> use `.pgpass` (mode 0600, or it is ignored).
- `.pgpass` first match wins -> put specific lines before wildcard lines.
- Multi-host: auth failure does not try the next host; connect_timeout adds up per host -> set a reasonable connect_timeout, especially with `load_balance_hosts=random`.
- PQconnectPoll ignores connect_timeout and can block on DNS -> use hostaddr and implement your own timer.
- `PQgetvalue` returns "" for NULL -> check `PQgetisnull`.
- Binary parameters with inferred types -> cast in SQL (`$1::bigint`) or pass type OIDs.
- Do not escape values passed as parameters; `PQescapeString`/`PQescapeBytea` are unsafe with multiple connections -> use the `...Conn` variants or parameters.
- Must call PQgetResult until NULL (even after errors); must PQclear every result; PQfinish even after a failed connect.
- PQexec ignores nonblocking mode; nonblocking writes need the PQflush + PQconsumeInput loop to avoid deadlock.
- Pipeline mode in blocking mode can deadlock -> use nonblocking + event loop. COMMIT is not durable until its result arrives.
- Single-row/chunked mode can deliver rows before an error -> the application must undo work done with them.
- Legacy cancel functions are unencrypted and PQrequestCancel is not thread-safe -> use PQcancelCreate/PQcancelBlocking/PQcancelStart.
- PQfn can overflow result_buf -> use a prepared statement with binary I/O.
- Plaintext passwords in `ALTER USER ... PASSWORD` end up in logs -> PQencryptPasswordConn / PQchangePassword.
- `PQfreemem`, not `free()`, on Windows; `PQtrace`/`ECPGdebug` crash on Windows if compiler flags differ.
- Same PGconn used concurrently from two threads is not allowed -> one connection per thread.
- Large objects outside a transaction block fail (descriptors are transaction-scoped); lo_read/lo_write reject len > INT_MAX -> use chunks of a few MB; lo_lseek/lo_tell fail beyond 2 GB -> use the 64-bit variants.
- Granting server-side lo_import/lo_export is equivalent to superuser.
- `\.` end-of-copy line is deprecated (misbehaves in CSV) -> just call PQputCopyEnd/PQendcopy.
- ECPG: WHENEVER placement is textual; `char[]` targets overflow; NULL without an indicator raises -213; PGTYPESInvalidTimestamp is also a valid value (check errno); pgtypes date parsing is always MDY; ECPG ignores time zones; typedef names cannot be used as SQL keywords; bytea host variables need `bytea_output = hex`.
- information_schema: duplicate constraint names can produce several rows; not-null constraints are listed under check_constraints; multi-event triggers appear as several rows; definitions are NULL unless you own the object; `routine_table_usage` is empty; dependency views skip system tables.
