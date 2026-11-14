# L — Part VII: ch.51 Overview of PostgreSQL Internals, ch.52 System Catalogs, ch.53 System Views, ch.54 Frontend/Backend Protocol

Source: PostgreSQL 18.7 docs, _order.tsv idx 825-948 (124 pages). All pages read in full.

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 825 | internals.txt | Part VII TOC: chapters 51-70 (overview, catalogs, views, protocol, coding conventions, NLS, PL handlers, FDW, tablesample, custom scan, GEQO, table AM, index AM, WAL for extensions, built-in index AMs, physical storage, transaction processing, BKI, planner stats, backup manifest). |
| 826 | overview.txt | Ch.51 intro: originated from Stefan Simkovics' master's thesis (Vienna UT); goal = sequence of operations from query receipt to result return. |
| 827 | query-path.txt | 5 stages: connection -> parser stage -> rewrite system -> planner/optimizer -> executor. |
| 828 | connect-estab.txt | "Process per user" model; postmaster supervisor spawns one backend per connection; semaphores + shared memory; query sent as plain text. |
| 829 | parser-stage.txt | Parser (gram.y/scan.l via bison/flex) builds raw parse tree w/o catalog lookups; transformation process builds query tree inside a transaction. |
| 830 | rule-system.txt | Rule system = query rewriting between parser and planner; input and output both query trees ("macro expansion"); row-level rule impl removed 1995. |
| 831 | planner-optimizer.txt | Paths vs plans; scan path generation; nested loop/merge/hash join; near-exhaustive join search below geqo_threshold, GEQO above. |
| 832 | executor.txt | Demand-pull pipeline; MergeJoin/Sort/SeqScan example; ModifyTable for INSERT/UPDATE/DELETE/MERGE; Result node for INSERT...VALUES. |
| 833 | catalogs.txt | Ch.52 intro: catalogs are regular tables; do not edit by hand; use SQL commands. |
| 834 | catalogs-overview.txt | Table 52.1: all 64 catalogs with purpose; most are per-database (copied from template), a few shared cluster-wide. |
| 835 | catalog-pg-aggregate.txt | pg_aggregate: extension of pg_proc for aggregates: kind, trans/final/combine/serial/deserial fns, moving-aggregate fns, transtype, initval. |
| 836 | catalog-pg-am.txt | pg_am: access methods: amname, amhandler, amtype (t table / i index). |
| 837 | catalog-pg-amop.txt | pg_amop: operators in operator families: strategy number, purpose s(earch)/o(rdering), amopsortfamily. |
| 838 | catalog-pg-amproc.txt | pg_amproc: support functions of operator families: amprocnum, left/right types. |
| 839 | catalog-pg-attrdef.txt | pg_attrdef: column default / generation expressions (adbin pg_node_tree; pg_get_expr). |
| 840 | catalog-pg-attribute.txt | pg_attribute: one row per column of every relation; 25 columns incl. attstorage, attcompression, attgenerated (s/v), atthasmissing, attisdropped. |
| 841 | catalog-pg-authid.txt | pg_authid (shared): roles + password hashes (md5 deprecated, SCRAM-SHA-256 format). |
| 842 | catalog-pg-auth-members.txt | pg_auth_members (shared): role membership with admin_option, inherit_option, set_option, grantor. |
| 843 | catalog-pg-cast.txt | pg_cast: cast paths; castcontext e/a/i; castmethod f/i/b; length-coercion casts. |
| 844 | catalog-pg-class.txt | pg_class: every relation; relkind (r,i,S,t,v,m,c,f,p,I), relpersistence (p,u,t), relpages/reltuples/relallvisible/relallfrozen, relfrozenxid/relminmxid, relreplident; lazily maintained flags. |
| 845 | catalog-pg-collation.txt | pg_collation: collprovider d/b/c/i, deterministic flag, encoding, collcollate/collctype vs colllocale, collversion; unique key (collname, collencoding, collnamespace). |
| 846 | catalog-pg-constraint.txt | pg_constraint: contype c/f/n/p/u/t/x, conenforced, convalidated, FK action codes, conperiod (WITHOUT OVERLAPS/PERIOD), key arrays, conbin. |
| 847 | catalog-pg-conversion.txt | pg_conversion: encoding conversion functions (for/to encoding ids, conproc, condefault). |
| 848 | catalog-pg-database.txt | pg_database (shared): encoding, locale provider, datistemplate, datallowconn, datconnlimit (-1 none, -2 invalid), datfrozenxid, datminmxid, dattablespace. |
| 849 | catalog-pg-db-role-setting.txt | pg_db_role_setting (shared): per-role/per-database GUC defaults (setdatabase, setrole, setconfig). |
| 850 | catalog-pg-default-acl.txt | pg_default_acl: default privileges for new objects; global vs per-schema entries; objtype r/S/f/T/n/L. |
| 851 | catalog-pg-depend.txt | pg_depend: dependency graph; deptype n/a/i/P/S/e/x semantics; pinned objects have no entries. |
| 852 | catalog-pg-description.txt | pg_description: COMMENT text keyed by (objoid, classoid, objsubid). |
| 853 | catalog-pg-enum.txt | pg_enum: enum labels; value's internal representation = OID of pg_enum row; even-OID ordering rule; enumsortorder float4. |
| 854 | catalog-pg-event-trigger.txt | pg_event_trigger: evtevent, evtfoid, evtenabled O/D/R/A, evttags. |
| 855 | catalog-pg-extension.txt | pg_extension: installed extensions; extnamespace, extrelocatable, extversion, extconfig, extcondition. |
| 856 | catalog-pg-foreign-data-wrapper.txt | pg_foreign_data_wrapper: fdwhandler, fdwvalidator, options. |
| 857 | catalog-pg-foreign-server.txt | pg_foreign_server: srvfdw, srvtype, srvversion, srvoptions. |
| 858 | catalog-pg-foreign-table.txt | pg_foreign_table: ftrelid, ftserver, ftoptions. |
| 859 | catalog-pg-index.txt | pg_index: indnatts/indnkeyatts, unique/primary/exclusion flags, indisvalid/indisready/indislive/indcheckxmin, indkey, indclass, indoption, indexprs, indpred. |
| 860 | catalog-pg-inherits.txt | pg_inherits: direct parent-child (tables and indexes), inhseqno, inhdetachpending. |
| 861 | catalog-pg-init-privs.txt | pg_init_privs: initial privileges set by initdb (privtype i) or CREATE EXTENSION (e). |
| 862 | catalog-pg-language.txt | pg_language: lanispl, lanpltrusted, call handler, inline handler, validator. |
| 863 | catalog-pg-largeobject.txt | pg_largeobject: LO data pages of LOBLKSIZE (BLCKSZ/4, typically 2 kB); sparse storage. |
| 864 | catalog-pg-largeobject-metadata.txt | pg_largeobject_metadata: LO owner and ACL. |
| 865 | catalog-pg-namespace.txt | pg_namespace: schemas (nspname, nspowner, nspacl). |
| 866 | catalog-pg-opclass.txt | pg_opclass: operator classes (opcmethod, opcfamily, opcintype, opcdefault, opckeytype). |
| 867 | catalog-pg-operator.txt | pg_operator: oprkind b/l, oprcanmerge, oprcanhash, commutator/negator, oprcode, oprrest, oprjoin. |
| 868 | catalog-pg-opfamily.txt | pg_opfamily: operator families (opfmethod, opfname); real content in pg_amop/pg_amproc/pg_opclass. |
| 869 | catalog-pg-parameter-acl.txt | pg_parameter_acl (shared): GUCs with granted privileges (parname, paracl). |
| 870 | catalog-pg-partitioned-table.txt | pg_partitioned_table: partstrat h/l/r, partnatts, partdefid, partattrs, partclass, partcollation, partexprs. |
| 871 | catalog-pg-policy.txt | pg_policy: RLS policies: polcmd r/a/w/d/*, polpermissive, polroles, polqual, polwithcheck. |
| 872 | catalog-pg-proc.txt | pg_proc: routines; prokind f/p/a/w, procost, prorows, prosupport, provolatile i/s/v, proparallel s/r/u, proleakproof, arg arrays, prosrc/probin/prosqlbody. |
| 873 | catalog-pg-publication.txt | pg_publication: puballtables, pubinsert/update/delete/truncate, pubviaroot, pubgencols n/s. |
| 874 | catalog-pg-publication-namespace.txt | pg_publication_namespace: schema <-> publication many-to-many. |
| 875 | catalog-pg-publication-rel.txt | pg_publication_rel: relation <-> publication, row filter prqual, column list prattrs. |
| 876 | catalog-pg-range.txt | pg_range: rngsubtype, rngmultitypid, rngcollation, rngsubopc, rngcanonical, rngsubdiff. |
| 877 | catalog-pg-replication-origin.txt | pg_replication_origin (shared): roident, roname. |
| 878 | catalog-pg-rewrite.txt | pg_rewrite: rules; ev_type 1 SELECT/2 UPDATE/3 INSERT/4 DELETE, ev_enabled, is_instead, ev_qual, ev_action. |
| 879 | catalog-pg-seclabel.txt | pg_seclabel: security labels (objoid, classoid, objsubid, provider, label). |
| 880 | catalog-pg-sequence.txt | pg_sequence: seqtypid, seqstart, seqincrement, seqmax, seqmin, seqcache, seqcycle. |
| 881 | catalog-pg-shdepend.txt | pg_shdepend (shared): dependencies on shared objects; deptype o/a/i/r/t. |
| 882 | catalog-pg-shdescription.txt | pg_shdescription (shared): comments on shared objects. |
| 883 | catalog-pg-shseclabel.txt | pg_shseclabel (shared): security labels on shared objects. |
| 884 | catalog-pg-statistic.txt | pg_statistic: per-column planner stats; stainherit, stanullfrac, stawidth, stadistinct sign convention, slot columns stakindN/staopN/stacollN/stanumbersN/stavaluesN. |
| 885 | catalog-pg-statistic-ext.txt | pg_statistic_ext: CREATE STATISTICS definitions; stxkeys, stxstattarget, stxkind d/f/m/e, stxexprs. |
| 886 | catalog-pg-statistic-ext-data.txt | pg_statistic_ext_data: built extended stats: stxdndistinct, stxddependencies, stxdmcv, stxdexpr; stxdinherit. |
| 887 | catalog-pg-subscription.txt | pg_subscription (shared): substream f/t/p, subtwophasestate d/p/e, subfailover, subconninfo (restricted), suborigin none/any, subskiplsn. |
| 888 | catalog-pg-subscription-rel.txt | pg_subscription_rel: per-table sync state i/d/f/s/r and srsublsn. |
| 889 | catalog-pg-tablespace.txt | pg_tablespace (shared): spcname, spcowner, spcacl, spcoptions. |
| 890 | catalog-pg-transform.txt | pg_transform: type<->PL transforms (trffromsql, trftosql). |
| 891 | catalog-pg-trigger.txt | pg_trigger: tgtype bitmask, tgenabled O/D/R/A, tgisinternal, constraint links, tgattr, tgqual, transition table names, tgparentid. |
| 892 | catalog-pg-ts-config.txt | pg_ts_config: text search configuration (cfgparser). |
| 893 | catalog-pg-ts-config-map.txt | pg_ts_config_map: token type -> ordered dictionaries. |
| 894 | catalog-pg-ts-dict.txt | pg_ts_dict: dictionaries (dicttemplate, dictinitoption). |
| 895 | catalog-pg-ts-parser.txt | pg_ts_parser: parser functions (start, token, end, headline, lextype); superuser-only creation. |
| 896 | catalog-pg-ts-template.txt | pg_ts_template: tmplinit, tmpllexize; superuser-only. |
| 897 | catalog-pg-type.txt | pg_type: typlen (-1 varlena, -2 cstring), typbyval, typtype b/c/d/e/p/r/m, typcategory codes, typalign c/s/i/d, typstorage p/e/m/x, I/O functions, domain fields. |
| 898 | catalog-pg-user-mapping.txt | pg_user_mapping: umuser (0 = public), umserver, umoptions; restricted, use pg_user_mappings. |
| 899 | views.txt | Ch.53 intro: views over catalogs + internal-state views; information_schema preferred when sufficient; stats views are in Table 27.2. |
| 900 | views-overview.txt | Table 53.1: all 37 system views with purpose; read-only except where noted. |
| 901 | view-pg-aios.txt | pg_aios (PG18): in-use async I/O handles: state machine HANDED_OUT..COMPLETED_LOCAL, operation readv/writev, result codes, flags. |
| 902 | view-pg-available-extensions.txt | pg_available_extensions: name, default_version, installed_version, comment. |
| 903 | view-pg-available-extension-versions.txt | pg_available_extension_versions: version, installed, superuser, trusted, relocatable, schema, requires. |
| 904 | view-pg-backend-memory-contexts.txt | pg_backend_memory_contexts: memory context tree of current backend (level, path, total/free/used bytes); CTE usage example. |
| 905 | view-pg-config.txt | pg_config: compile-time parameters (name, setting); superuser-only. |
| 906 | view-pg-cursors.txt | pg_cursors: open cursors (DECLARE, Bind message portals, SPI); holdable/binary/scrollable, creation_time. |
| 907 | view-pg-file-settings.txt | pg_file_settings: config file entries with applied/error; reports current file contents, not what was applied. |
| 908 | view-pg-group.txt | pg_group: backward-compat view of non-login roles and members. |
| 909 | view-pg-hba-file-rules.txt | pg_hba_file_rules: parsed pg_hba.conf lines with rule_number and error. |
| 910 | view-pg-ident-file-mappings.txt | pg_ident_file_mappings: parsed pg_ident.conf lines. |
| 911 | view-pg-indexes.txt | pg_indexes: schemaname, tablename, indexname, tablespace, indexdef. |
| 912 | view-pg-locks.txt | pg_locks: 16 columns; 12 locktypes; vxid/xid lock protocol; row locks not shown; advisory key encoding; fast-path; consistency caveats; pg_blocking_pids(). |
| 913 | view-pg-matviews.txt | pg_matviews: owner, tablespace, hasindexes, ispopulated, definition. |
| 914 | view-pg-policies.txt | pg_policies: readable RLS policy view. |
| 915 | view-pg-prepared-statements.txt | pg_prepared_statements: session prepared statements; from_sql, parameter/result types, generic_plans/custom_plans counters. |
| 916 | view-pg-prepared-xacts.txt | pg_prepared_xacts: 2PC transactions (transaction, gid, prepared, owner, database). |
| 917 | view-pg-publication-tables.txt | pg_publication_tables: expands FOR ALL TABLES / TABLES IN SCHEMA; attnames, rowfilter. |
| 918 | view-pg-replication-origin-status.txt | pg_replication_origin_status: local_id, external_id, remote_lsn, local_lsn. |
| 919 | view-pg-replication-slots.txt | pg_replication_slots: 21 columns incl. xmin, catalog_xmin, restart_lsn, confirmed_flush_lsn, wal_status (reserved/extended/unreserved/lost), safe_wal_size, two_phase(_at), inactive_since, conflicting, invalidation_reason, failover, synced. |
| 920 | view-pg-roles.txt | pg_roles: public view of pg_authid with password as ********, plus rolconfig. |
| 921 | view-pg-rules.txt | pg_rules: rewrite rules with reconstructed definition; excludes ON SELECT rules of views/matviews. |
| 922 | view-pg-seclabels.txt | pg_seclabels: easier view of security labels (objtype, objnamespace, objname). |
| 923 | view-pg-sequences.txt | pg_sequences: sequence params + last_value (null in 3 cases). |
| 924 | view-pg-settings.txt | pg_settings: 17 columns; context values internal/postmaster/sighup/superuser-backend/backend/superuser/user; updatable (= SET); pending_restart. |
| 925 | view-pg-shadow.txt | pg_shadow: backward-compat view of login roles incl. password; not public. |
| 926 | view-pg-shmem-allocations.txt | pg_shmem_allocations: main shared memory segment allocations (name, off, size, allocated_size); excludes DSM. |
| 927 | view-pg-shmem-allocations-numa.txt | pg_shmem_allocations_numa (PG18): per-NUMA-node distribution; very slow, touches all pages; not for monitoring. |
| 928 | view-pg-stats.txt | pg_stats: readable pg_statistic: null_frac, avg_width, n_distinct, MCV, histogram_bounds, correlation, element stats, range stats. |
| 929 | view-pg-stats-ext.txt | pg_stats_ext: extended stats view: kinds, n_distinct, dependencies, multi-column MCV lists with base freqs. |
| 930 | view-pg-stats-ext-exprs.txt | pg_stats_ext_exprs: per-expression stats of extended statistics objects (same shape as pg_stats). |
| 931 | view-pg-tables.txt | pg_tables: owner, tablespace, hasindexes, hasrules, hastriggers, rowsecurity. |
| 932 | view-pg-timezone-abbrevs.txt | pg_timezone_abbrevs: abbrev, utc_offset, is_dst; changes with TimeZone / timezone_abbreviations. |
| 933 | view-pg-timezone-names.txt | pg_timezone_names: names recognized by SET TIMEZONE; computed at CURRENT_TIMESTAMP. |
| 934 | view-pg-user.txt | pg_user: public view of pg_shadow with passwd ********. |
| 935 | view-pg-user-mappings.txt | pg_user_mappings: public view of pg_user_mapping; umoptions nulled unless privileged. |
| 936 | view-pg-views.txt | pg_views: schemaname, viewname, viewowner, definition. |
| 937 | view-pg-wait-events.txt | pg_wait_events: type, name, description of wait events. |
| 938 | protocol.txt | Ch.54 intro: message-based protocol over TCP/IP and Unix sockets; port 5432 (IANA); documents v3.2 (PG18); backward compatible with 3.0 (7.4+). |
| 939 | protocol-overview.txt | Phases (startup, normal, termination); message framing (type byte + int32 length incl. itself); prepared statements vs portals; format codes 0 text/1 binary; protocol versions table and negotiation. |
| 940 | protocol-flow.txt | Message flow: start-up & every Authentication* message, simple query & implicit transaction blocks, extended query (Parse/Bind/Execute/Sync/Describe/Close/Flush), pipelining, function call, COPY in/out/both, async messages & ParameterStatus list, cancel, termination, SSL/GSSAPI negotiation & CVEs. |
| 941 | sasl-authentication.txt | SASL flow; SCRAM-SHA-256 / -PLUS (tls-server-end-point channel binding, SASLprep rules); OAUTHBEARER (RFC 7628) two-connection discovery flow. |
| 942 | protocol-replication.txt | Walsender modes (replication=true / database); every replication command (IDENTIFY_SYSTEM, SHOW, TIMELINE_HISTORY, CREATE/ALTER/READ/DROP_REPLICATION_SLOT, START_REPLICATION physical/logical, UPLOAD_MANIFEST, BASE_BACKUP + all options); XLogData/keepalive/status update/hot standby feedback; base backup archive stream and exclusions. |
| 943 | protocol-logical-replication.txt | pgoutput START_REPLICATION options (proto_version 1-4, publication_names, binary, messages, streaming off/on/parallel, two_phase, origin); message flow rules (Begin/Commit, Stream Start/Stop, Relation before DML, Type messages). |
| 944 | protocol-message-types.txt | Base field types: Intn(i), Intn[k], String(s), Byten(c); no predefined string length limit. |
| 945 | protocol-message-formats.txt | Byte-level format of every message (type byte, length, fields); auth subcodes 0/2/3/5/7/8/9/10/11/12; BackendKeyData key 4-256 bytes; magic codes 80877102/3/4; StartupMessage version 196610; CommandComplete tags; ReadyForQuery I/T/E. |
| 946 | protocol-error-fields.txt | ErrorResponse/NoticeResponse field codes S V C M D H P p q W s t c d n F L R and caveats. |
| 947 | protocol-logicalrep-message-formats.txt | pgoutput message formats: Begin, Message, Commit, Origin, Relation, Type, Insert, Update (K/O/N), Delete, Truncate, Stream Start/Stop/Commit/Abort (v2), Begin Prepare/Prepare/Commit Prepared/Rollback Prepared/Stream Prepare (v3), TupleData n/u/t/b. |
| 948 | protocol-changes.txt | Protocol 2.0 -> 3.0 checklist: list-of-strings startup, length words, multi-field errors, ReadyForQuery status, extended query, CopyData/CopyDone, NOTIFY payload. |

## Notes by topic

### Ch.51 — The path of a query (5 stages)  [M1, M4]  (source: overview.txt, query-path.txt)
- Chapter origin: Stefan Simkovics' Master's Thesis [sim98], Vienna University of Technology (Prof. Georg Gottlob, Katrin Seyr). Scope: "general sequence of operations that occur within the backend from the point at which a query is received, to the point at which the results are returned to the client".
- The five stages, in order (docs' exact framing):
  1. **Connection**: application establishes a connection to the server, transmits a query, waits for results.
  2. **Parser stage**: checks the query for correct syntax and creates a *query tree*.
  3. **Rewrite system**: takes the query tree, looks for *rules* (stored in the system catalogs) to apply, performs the transformations given in the rule bodies. One application: realization of **views** — a query against a view (virtual table) is rewritten into a query against the base tables in the view definition.
  4. **Planner/optimizer**: takes the (rewritten) query tree and creates a *query plan*, the input to the executor. First creates all possible *paths* leading to the same result (e.g. with an index on a relation there are two scan paths: sequential scan and index scan); estimates cost of each path; chooses cheapest; the cheapest path is expanded into a complete plan.
  5. **Executor**: recursively steps through the *plan tree* and retrieves rows the way the plan represents. Uses the storage system while scanning relations, performs sorts and joins, evaluates qualifications, and finally hands back the rows derived.
- Data structure progression: query string (plain text) -> raw parse tree -> query tree -> (rewritten) query tree(s) -> paths -> plan tree -> rows.

### Ch.51.2 — How connections are established  [M1, M6]  (source: connect-estab.txt)
- PostgreSQL implements a **"process per user"** client/server model: every client process connects to **exactly one backend process**.
- Because the number of connections is not known ahead of time, a **supervisor process** is used that spawns a new backend process every time a connection is requested. This supervisor is called **postmaster**; it listens at a specified TCP/IP port for incoming connections. Whenever it detects a connection request it spawns a new backend process.
- Backend processes communicate with each other and with other processes of the instance using **semaphores and shared memory** to ensure data integrity during concurrent data access.
- The client can be any program that understands the PostgreSQL protocol (ch.54). Many are based on the C library **libpq**; independent implementations exist (e.g. the Java JDBC driver).
- Once connected, the client sends a query to its backend. **The query is transmitted using plain text — there is no parsing done in the client.** The backend parses the query, creates an execution plan, executes the plan, and returns retrieved rows over the established connection.

### Ch.51.3 — The parser stage  [M4]  (source: parser-stage.txt)
- Two parts: (a) the **parser** defined in `gram.y` and `scan.l`, built with Unix tools **bison** and **flex**; (b) the **transformation process**, which modifies and augments the data structures returned by the parser.
- 51.3.1 Parser:
  - Checks the query string (plain text) for valid syntax. Valid -> a **parse tree** is built and handed back; otherwise an error is returned.
  - **Lexer**: defined in `scan.l`; recognizes identifiers, SQL key words, etc. For every key word or identifier found, a **token** is generated and handed to the parser.
  - **Parser**: defined in `gram.y`; a set of grammar rules and *actions* executed whenever a rule fires. The action code (C) builds up the parse tree.
  - Build: `scan.l` -> `scan.c` via flex; `gram.y` -> `gram.c` via bison; then a normal C compiler. "Never make any changes to the generated C files as they will be overwritten the next time flex or bison is called." Normally done automatically by the makefiles.
- 51.3.2 Transformation process:
  - The parser creates a parse tree using **only fixed rules about syntactic structure**. It makes **no system catalog lookups**, so it cannot understand detailed semantics.
  - The transformation process takes the parser's tree and does the semantic interpretation needed to understand **which tables, functions, and operators** are referenced. The resulting data structure is the **query tree**.
  - **Why raw parsing is separated from semantic analysis**: system catalog lookups can only be done **within a transaction**, and the server does not want to start a transaction immediately upon receiving a query string. Raw parsing is sufficient to identify transaction control commands (`BEGIN`, `ROLLBACK`, etc.), which can then be executed without further analysis. Once it is known to be an actual query (e.g. `SELECT`, `UPDATE`), it is okay to start a transaction if not already in one; only then is the transformation process invoked.
  - Query tree is structurally similar to the raw parse tree in most places but differs in detail. Example: a **`FuncCall`** node in the parse tree (something syntactically like a function call) is transformed into either a **`FuncExpr`** or an **`Aggref`** node depending on whether the name is an ordinary function or an aggregate. Also, **actual data types of columns and expression results** are added to the query tree.

### Ch.51.4 — The rule system (rewriter)  [M4, M6]  (source: rule-system.txt)
- Rule system used "for the specification of views and ambiguous view updates".
- Historically two implementations: (1) row-level processing deep in the executor, called whenever an individual row was accessed — **removed in 1995** when the last official Berkeley Postgres release became Postgres95; (2) **query rewriting** — the rewrite system is a module between the parser stage and the planner/optimizer; still implemented.
- Details in Chapter 39. Key property: **both the input and the output of the rewriter are query trees** — no change in representation or level of semantic detail. "Rewriting can be thought of as a form of macro expansion."

### Ch.51.5 — Planner/optimizer  [M4]  (source: planner-optimizer.txt)
- Task: create an optimal execution plan. A query tree can be executed many ways producing the same results; if computationally feasible the optimizer examines each possible plan and selects the one expected to run fastest.
- When examining every plan would take excessive time/memory (queries with large numbers of joins), PostgreSQL uses the **Genetic Query Optimizer (GEQO, ch.61)** when the number of joins exceeds a threshold (`geqo_threshold`) to find a reasonable (not necessarily optimal) plan in reasonable time.
- **Paths vs plans**: the planner's search works with **paths** — "cut-down representations of plans containing only as much information as the planner needs to make its decisions". After the cheapest path is determined, a full-fledged **plan tree** is built for the executor.
- 51.5.1 Generating possible plans:
  1. Start by generating plans for scanning **each individual relation** used in the query. Possible plans are determined by the available indexes.
  2. A **sequential scan plan is always created** (always possible).
  3. If an index exists (e.g. B-tree) and the query contains restriction `relation.attribute OPR constant`, where `relation.attribute` matches the index key and `OPR` is one of the operators in the index's **operator class**, another plan using that index is created. Further indexes whose keys match restrictions yield further plans.
  4. Index scan plans are also generated for indexes whose **sort ordering matches the query's ORDER BY**, or whose ordering might be useful for **merge joining**.
  5. If the query joins two or more relations, join plans are considered **after** all feasible single-relation scan plans are found.
- The three join strategies (verbatim semantics):
  - **nested loop join**: the right relation is scanned once for every row found in the left relation. Easy to implement but can be very time consuming. (Good if the right relation can be scanned with an index scan; values from the current left row can be used as keys for the index scan of the right.)
  - **merge join**: each relation is sorted on the join attributes before the join starts; then the two are scanned in parallel and matching rows combined. Attractive because each relation is scanned only once. Sorting may come from an explicit sort step or from scanning in proper order via an index on the join key.
  - **hash join**: the right relation is first scanned and loaded into a hash table using its join attributes as hash keys; then the left relation is scanned and each row's values are used as hash keys to locate matching rows in the table.
- **Join search**: with more than two relations the result is built by a tree of join steps, each with two inputs; the planner examines different join sequences to find the cheapest.
  - If the query uses **fewer than `geqo_threshold` relations**, a **near-exhaustive search** is conducted. The planner preferentially considers joins between any two relations for which a **join clause** exists in WHERE (e.g. `where rel1.attr1=rel2.attr2`). Join pairs with **no join clause** are considered only when there is no other choice (a relation has no available join clauses to any other relation). All possible plans are generated for every join pair considered; the estimated cheapest is chosen.
  - When `geqo_threshold` is exceeded, join sequences considered are determined by heuristics (ch.61); otherwise the process is the same.
- **Finished plan tree** = sequential or index scans of base relations + nested-loop / merge / hash join nodes + auxiliary steps (sort nodes, aggregate-function calculation nodes). Most plan node types can additionally do **selection** (discarding rows not meeting a Boolean condition) and **projection** (computing derived column set / evaluating scalar expressions). A planner responsibility: attach WHERE selection conditions and computation of required output expressions to the most appropriate plan nodes.

### Ch.51.6 — Executor  [M4, M3]  (source: executor.txt)
- The executor takes the plan and **recursively processes it** to extract the required rows: a **demand-pull pipeline**. "Each time a plan node is called, it must deliver one more row, or report that it is done delivering rows."
- Worked example (animate this):
  1. Top node is `MergeJoin`. Before merging, two rows must be fetched (one from each subplan). Executor recursively calls itself on the subplans, starting with the subplan attached to **`lefttree`**.
  2. Left subplan top node is a `Sort`; recursion again to obtain input rows. Its child is a `SeqScan`, representing actual reading of a table: executing it fetches a row from the table and returns it up to the caller.
  3. `Sort` repeatedly calls its child to obtain **all** rows to be sorted. When input is exhausted (child returns **NULL** instead of a row), `Sort` performs the sort and returns its first output row; it keeps remaining rows stored to deliver in sorted order on later demands.
  4. `MergeJoin` similarly demands the first row from its right subplan, compares the two rows; if joinable returns a join row to its caller. On the next call (or immediately if the current pair cannot join) it advances to the next row of one table or the other (depending on comparison result) and checks again.
  5. Eventually one subplan is exhausted and `MergeJoin` returns NULL: no more join rows.
- General rule: each node computes and returns its next output row each time it is called; each node also applies any selection or projection expressions assigned to it by the planner.
- The executor evaluates **all five basic SQL query types: SELECT, INSERT, UPDATE, DELETE, MERGE**.
  - `SELECT`: top-level executor code just sends each row returned by the plan tree to the client.
  - `INSERT ... SELECT`, `UPDATE`, `DELETE`, `MERGE` are "effectively SELECTs under a special top-level plan node called **ModifyTable**".
  - `INSERT ... SELECT`: feeds rows up to ModifyTable for insertion.
  - `UPDATE`: planner arranges that each computed row includes **all the updated column values plus the TID** (tuple ID / row ID) of the original target row; ModifyTable creates a new updated row and marks the old row deleted.
  - `DELETE`: the only column actually returned by the plan is the **TID**; ModifyTable visits each target row and marks it deleted.
  - `MERGE`: planner joins source and target relations and includes all column values required by any WHEN clause, plus the target row TID; ModifyTable works out which WHEN clause to execute and then inserts/updates/deletes.
  - Simple `INSERT ... VALUES`: trivial plan tree of a single **`Result`** node computing one result row, fed up to ModifyTable.

### Ch.52 — System catalogs: general rules  [M1, M2]  (source: catalogs.txt, catalogs-overview.txt)
- Catalogs store schema metadata and internal bookkeeping. "PostgreSQL's system catalogs are regular tables." You *can* drop/recreate them, add columns, insert/update values "and severely mess up your system that way". Normally use SQL commands (e.g. `CREATE DATABASE` inserts a row into `pg_database` and actually creates the database on disk).
- Most catalogs are **copied from the template database during database creation** and are thereafter database-specific. A few are **physically shared across all databases in a cluster** (noted per catalog): pg_authid, pg_auth_members, pg_database, pg_db_role_setting, pg_parameter_acl, pg_replication_origin, pg_shdepend, pg_shdescription, pg_shseclabel, pg_subscription, pg_tablespace (see inventory).

### pg_aggregate  [M3, M6]  (source: catalog-pg-aggregate.txt)
- Each entry is an extension of a pg_proc entry (pg_proc carries name, input/output types). Registered via CREATE AGGREGATE.
- Columns: `aggfnoid regproc` (-> pg_proc.oid); `aggkind char` (`n` normal, `o` ordered-set, `h` hypothetical-set); `aggnumdirectargs int2` (direct non-aggregated args of ordered-set/hypothetical-set agg, variadic array counted as one; if equal to pronargs the aggregate must be variadic; always 0 for normal); `aggtransfn` (transition fn); `aggfinalfn` (0 if none); `aggcombinefn` (0 if none); `aggserialfn`; `aggdeserialfn`; `aggmtransfn` (forward transition fn for moving-aggregate mode); `aggminvtransfn` (inverse transition fn, moving-aggregate mode); `aggmfinalfn`; `aggfinalextra bool` (pass extra dummy args to aggfinalfn); `aggmfinalextra bool`; `aggfinalmodify char` (`r` read-only, `s` aggtransfn cannot be applied after aggfinalfn, `w` writes on the value); `aggmfinalmodify char`; `aggsortop oid` (-> pg_operator, 0 if none); `aggtranstype oid` (state data type); `aggtransspace int4` (approx avg state size in bytes, 0 = default estimate); `aggmtranstype`; `aggmtransspace`; `agginitval text` (initial state in external string form; null => state starts null); `aggminitval text`.

### pg_am / pg_amop / pg_amproc  [M4]  (source: catalog-pg-am.txt, catalog-pg-amop.txt, catalog-pg-amproc.txt)
- **pg_am**: one row per access method; "Currently, only tables and indexes have access methods". Columns: `oid`, `amname name`, `amhandler regproc` (handler function supplying info about the AM), `amtype char` (`t` = table incl. materialized views, `i` = index). Before 9.6 it had many more columns for index AM properties; now visible only at C level, or via `pg_index_column_has_property()` and related functions.
- **pg_amop**: one row per operator that is a member of an operator family. A member is a **search** operator or an **ordering** operator. An operator can appear in more than one family but not in more than one search position nor more than one ordering position within a family. Columns: `oid`, `amopfamily` (-> pg_opfamily), `amoplefttype`, `amoprighttype` (-> pg_type), `amopstrategy int2` (strategy number), `amoppurpose char` (`s` search, `o` ordering), `amopopr` (-> pg_operator), `amopmethod` (-> pg_am; intentional denormalization, must match opfmethod of the family), `amopsortfamily` (B-tree opfamily this entry sorts according to if ordering operator; 0 if search).
  - Search operator: index can be searched for `WHERE indexed_column operator constant`; must return boolean; left input type must match index column type.
  - Ordering operator: index can be scanned to return rows in `ORDER BY indexed_column operator constant` order; may return any sortable type; sort order assumed to be default of the referenced family, i.e. `ASC NULLS LAST`.
  - amoplefttype/amoprighttype must match oprleft/oprright of the pg_operator entry.
- **pg_amproc**: one row per support function of an operator family. Columns: `oid`, `amprocfamily`, `amproclefttype`, `amprocrighttype`, `amprocnum int2` (support function number), `amproc regproc`. "Default" support functions for an index = those with amproclefttype and amprocrighttype both equal to the opclass's `opcintype`.

### pg_attrdef  [M2]  (source: catalog-pg-attrdef.txt)
- Column default expressions **and generation expressions**; only columns with an explicitly set default/generation expression have an entry. Columns: `oid`, `adrelid` (-> pg_class), `adnum int2` (-> pg_attribute.attnum), `adbin pg_node_tree` (nodeToString() representation; use `pg_get_expr(adbin, adrelid)`).

### pg_attribute  [M2, M4]  (source: catalog-pg-attribute.txt)
- Exactly one row for every column in every table; also entries for indexes and "all objects that have pg_class entries". "Attribute" == column (historical).
- Columns (all 25):
  - `attrelid oid` -> pg_class.oid; `attname name`; `atttypid oid` -> pg_type (**zero for a dropped column**).
  - `attlen int2`: copy of pg_type.typlen.
  - `attnum int2`: ordinary columns numbered from 1 up; **system columns such as ctid have (arbitrary) negative numbers**.
  - `atttypmod int4`: type-specific data supplied at table creation (e.g. max length of varchar); passed to type input functions and length coercion functions; generally -1 for types that don't need it.
  - `attndims int2`: number of array dimensions else 0; "Presently, the number of dimensions of an array is not enforced, so any nonzero value effectively means 'it's an array'".
  - `attbyval bool`, `attalign char`: copies of pg_type.typbyval / typalign.
  - `attstorage char`: normally a copy of pg_type.typstorage; for TOAST-able types can be altered after creation.
  - `attcompression char`: `'\0'` = use current default (`default_toast_compression`); `'p'` = pglz; `'l'` = LZ4; ignored whenever attstorage does not allow compression.
  - `attnotnull bool`: "This column has a (possibly invalid) not-null constraint." (PG18: not-null constraints are real pg_constraint rows, contype `n`.)
  - `atthasdef bool`: has default or generation expression (entry in pg_attrdef); check attgenerated to tell which.
  - `atthasmissing bool`: column has a value used where the column is entirely missing from the row — happens when a column is added with a **non-volatile DEFAULT** after the row was created (fast ADD COLUMN). Value in `attmissingval`.
  - `attidentity char`: `''` (zero byte) not identity; `a` = generated always; `d` = generated by default.
  - `attgenerated char`: `''` not generated; `s` = stored; **`v` = virtual** (PG18). Stored generated column is physically stored like a normal column; a **virtual generated column is physically stored as a null value, with the actual value computed at run time**.
  - `attisdropped bool`: dropped column is "still physically present in the table, but is ignored by the parser and so cannot be accessed via SQL".
  - `attislocal bool`: defined locally (a column can be locally defined and inherited simultaneously).
  - `attinhcount int2`: number of direct ancestors; nonzero => cannot be dropped nor renamed.
  - `attcollation oid` -> pg_collation, 0 if not collatable.
  - `attstattarget int2`: detail level of ANALYZE stats. **0 = no statistics collected; null = use system default statistics target**; for scalar types it is both the target number of MCVs and the target number of histogram bins.
  - `attacl aclitem[]`: column-level privileges.
  - `attoptions text[]`: "keyword=value" attribute options; may contain internal options prefixed `pg_` not settable via DDL; currently the only internal option is `pg_attver`.
  - `attfdwoptions text[]`.
  - `attmissingval anyarray`: one-element array with the missing value; only used when atthasmissing is true.
- Dropped column: atttypid reset to zero but attlen and other fields copied from pg_type remain valid — needed because the type might later be dropped; attlen etc. are used to interpret row contents.

### pg_authid / pg_auth_members  [M1]  (source: catalog-pg-authid.txt, catalog-pg-auth-members.txt)
- **pg_authid** (shared; not publicly readable because it holds passwords; `pg_roles` is the public view blanking the password). A role subsumes "users" and "groups"; a user is a role with `rolcanlogin`.
  - Columns: `oid`, `rolname name`, `rolsuper`, `rolinherit` (auto-inherits privileges of roles it is a member of), `rolcreaterole`, `rolcreatedb`, `rolcanlogin` (can be given as initial session authorization identifier), `rolreplication` (can initiate replication connections and create/drop replication slots), `rolbypassrls`, `rolconnlimit int4` (-1 no limit), `rolpassword text` (null if none), `rolvaliduntil timestamptz` (password expiry, only for password auth; null = no expiry).
  - MD5 format: string `md5` + 32-char hex MD5 of password concatenated with user name (user joe / password xyzzy => md5 of `xyzzyjoe`). **MD5 passwords are deprecated and will be removed in a future release.**
  - SCRAM format: `SCRAM-SHA-256$<iteration count>:<salt>$<StoredKey>:<ServerKey>` (salt, StoredKey, ServerKey Base64; same as RFC 5803).
- **pg_auth_members** (shared): any non-circular membership set allowed. Columns: `oid`, `roleid` (role that has a member), `member`, `grantor`, `admin_option bool` (member can grant membership in roleid), `inherit_option bool` (member automatically inherits privileges of granted role), `set_option bool` (member can SET ROLE to the granted role).

### pg_cast  [M2, M6]  (source: catalog-pg-cast.txt)
- Stores conversion paths, built-in and user-defined — but **not every conversion**: casts deducible from generic rules are absent (domain <-> base type; "automatic I/O conversion casts" via a type's own I/O functions to/from text/string types).
- Columns: `oid`, `castsource`, `casttarget` (-> pg_type), `castfunc` (-> pg_proc; 0 if no function needed), `castcontext char` (`e` explicit only via CAST or `::`; `a` implicitly in assignment + explicit; `i` implicitly in expressions + the others), `castmethod char` (`f` function in castfunc; `i` input/output functions; `b` binary-coercible, no conversion).
- Cast function: first arg = source type, returns target type; up to three args: 2nd (integer) = destination type modifier or -1; 3rd (boolean) = true if explicit cast.
- Same source and target with a multi-arg function = **length coercion function**. Different types + multi-arg function = convert and apply length coercion in one step; otherwise two steps.

### pg_class  [M2, M4, M5, M7]  (source: catalog-pg-class.txt)
- Describes tables and "other objects that have columns or are otherwise similar to a table": indexes (see also pg_index), sequences (see also pg_sequence), views, materialized views, composite types, TOAST tables. Collectively "relations". Not all columns meaningful for all kinds.
- Columns (all 34):
  - `oid oid`; `relname name`; `relnamespace oid` -> pg_namespace.
  - `reltype oid` -> pg_type: row type of this table; **zero for indexes, sequences, and toast tables** (no pg_type entry).
  - `reloftype oid`: for typed tables the underlying composite type; else 0.
  - `relowner oid` -> pg_authid.
  - `relam oid` -> pg_am: access method for this table or index. Not meaningful for sequences or relations without on-disk file, **except partitioned tables**, where, if set, it takes precedence over `default_table_access_method` for partitions created without an explicit AM.
  - `relfilenode oid`: name of the on-disk file; **zero means a "mapped" relation** whose disk file name is determined by low-level state.
  - `reltablespace oid`: 0 = database's default tablespace. For partitioned tables: tablespace in which partitions will be created when not specified.
  - `relpages int4`: size of on-disk representation in pages (of size BLCKSZ). **Only an estimate used by the planner**; updated by VACUUM, ANALYZE, and a few DDL commands such as CREATE INDEX.
  - `reltuples float4`: number of live rows; planner estimate; same updaters. **-1 if the table has never been vacuumed or analyzed (row count unknown).**
  - `relallvisible int4`: number of pages marked all-visible in the visibility map; planner estimate (index-only scan costing).
  - `relallfrozen int4` (**new in PG18**): number of pages marked all-frozen in the VM. "Only an estimate used for triggering autovacuums"; can be used with relallvisible for scheduling manual vacuums and tuning freezing behaviour.
  - `reltoastrelid oid`: TOAST table OID, 0 if none ("stores large attributes out of line in a secondary table").
  - `relhasindex bool`: true if a table and it has (or recently had) any indexes.
  - `relisshared bool`: shared across all databases (only certain catalogs, e.g. pg_database).
  - **`relpersistence char`: `p` = permanent table/sequence, `u` = unlogged table/sequence, `t` = temporary table/sequence.**
  - **`relkind char`: `r` = ordinary table, `i` = index, `S` = sequence, `t` = TOAST table, `v` = view, `m` = materialized view, `c` = composite type, `f` = foreign table, `p` = partitioned table, `I` = partitioned index.**
  - `relnatts int2`: number of user columns (system columns not counted); must equal number of pg_attribute entries.
  - `relchecks int2`: number of CHECK constraints (must agree with pg_constraint).
  - `relhasrules bool` (has or once had rules; pg_rewrite); `relhastriggers bool` (has or once had); `relhassubclass bool` (table or index has/had inheritance children or partitions).
  - `relrowsecurity bool`: RLS enabled; `relforcerowsecurity bool`: RLS also applies to table owner.
  - `relispopulated bool`: true for all relations other than some materialized views.
  - **`relreplident char`: `d` = default (primary key, if any), `n` = nothing, `f` = all columns, `i` = index with indisreplident set (same as nothing if that index has been dropped).**
  - `relispartition bool`: table or index is a partition.
  - `relrewrite oid`: for new relations being written during DDL requiring a table rewrite, OID of the original relation; else 0; never non-zero for a user-visible relation.
  - `relfrozenxid xid`: all XIDs before this one have been replaced with a permanent ("frozen") XID in this table; tracks need to vacuum to prevent XID wraparound or to allow **pg_xact** to be shrunk. Zero (InvalidTransactionId) if not a table.
  - `relminmxid xid`: all multixact IDs before this one have been replaced by a transaction ID; wraparound / allow **pg_multixact** to be shrunk. Zero (InvalidMultiXactId) if not a table.
  - `relacl aclitem[]`; `reloptions text[]` (AM-specific "keyword=value"); `relpartbound pg_node_tree` (partition bound internal representation if relispartition).
- **Lazily maintained flags**: several Boolean flags are guaranteed true if that's the correct state but may not be reset to false immediately. E.g. `relhasindex` is set by CREATE INDEX but never cleared by DROP INDEX; **VACUUM clears relhasindex** if it finds no indexes. "This arrangement avoids race conditions and improves concurrency."

### pg_collation  [M2]  (source: catalog-pg-collation.txt)
- Collations = mappings from an SQL name to OS locale categories. Columns: `oid`, `collname` (unique per namespace and encoding), `collnamespace`, `collowner`, `collprovider char` (`d` database default, `b` builtin, `c` libc, `i` icu), `collisdeterministic bool`, `collencoding int4` (-1 = any encoding), `collcollate text` / `collctype text` (LC_COLLATE/LC_CTYPE; NULL if provider not libc), `colllocale text` (provider locale name; NULL if libc), `collicurules text`, `collversion text` (provider-specific version recorded at creation and checked on use to detect definition changes that could lead to data corruption).
- Unique key is **(collname, collencoding, collnamespace)**. Collations whose collencoding is neither the current DB encoding nor -1 are ignored; creating entries with the same name as a -1 entry is forbidden, so schema-qualified name suffices. Reason: initdb fills it with all locales available on the system for all encodings. In template0 it could be useful to create collations for other encodings manually.

### pg_constraint  [M1, M3]  (source: catalog-pg-constraint.txt)
- Stores check, **not-null**, primary key, unique, foreign key, and exclusion constraints on tables; user-defined constraint triggers (CREATE CONSTRAINT TRIGGER); check constraints on domains. Column constraints are not special — each equals some table constraint.
- Columns: `oid`; `conname` ("not necessarily unique!"); `connamespace`; **`contype char`: `c` check, `f` foreign key, `n` not-null, `p` primary key, `u` unique, `t` constraint trigger, `x` exclusion**; `condeferrable`; `condeferred` (deferred by default); **`conenforced bool`** (is the constraint enforced? PG18); `convalidated`; `conrelid` (0 if not a table constraint); `contypid` (domain; 0 if not domain constraint); `conindid` (supporting index for unique, PK, FK, or exclusion; else 0); `conparentid` (corresponding constraint of the parent partitioned table); `confrelid` (referenced table of FK); `confupdtype` / `confdeltype char` (**`a` no action, `r` restrict, `c` cascade, `n` set null, `d` set default**); `confmatchtype` (`f` full, `p` partial, `s` simple); `conislocal`; `coninhcount int2` (nonzero => cannot be dropped/renamed); `connoinherit`; **`conperiod bool`** (defined with WITHOUT OVERLAPS for PK/unique, or PERIOD for FK); `conkey int2[]` (constrained columns); `confkey int2[]` (referenced columns); `conpfeqop oid[]` (PK = FK equality operators); `conppeqop oid[]` (PK = PK); `conffeqop oid[]` (FK = FK); `confdelsetcols int2[]` (columns updated by SET NULL/SET DEFAULT delete action; null = all referencing columns); `conexclop oid[]` (per-column exclusion operators for exclusion constraint or WITHOUT OVERLAPS PK/unique); `conbin pg_node_tree` (check expression; prefer `pg_get_constraintdef()`).
- For exclusion constraints conkey is only useful for simple column references; otherwise 0 appears and the index must be consulted (conkey == pg_index.indkey).
- pg_class.relchecks must agree with the number of check-constraint entries.

### pg_conversion  [M2]  (source: catalog-pg-conversion.txt)
- Encoding conversion functions (CREATE CONVERSION). Columns: `oid`, `conname` (unique within namespace), `connamespace`, `conowner`, `conforencoding int4`, `contoencoding int4` (`pg_encoding_to_char()` translates ids), `conproc regproc`, `condefault bool`.

### pg_database  [M1, M7]  (source: catalog-pg-database.txt)
- Shared: one copy per cluster. Columns: `oid`; `datname`; `datdba` (owner); `encoding int4` (`pg_encoding_to_char()`); `datlocprovider char` (`b` builtin, `c` libc, `i` icu); `datistemplate bool` (true => can be cloned by any user with CREATEDB; false => only superusers or the owner); `datallowconn bool` (false => no one can connect; protects template0); `dathasloginevt bool` (login event triggers defined; avoids pg_event_trigger lookups at each backend startup; internal, do not alter or read for monitoring); `datconnlimit int4` (**-1 no limit, -2 database is invalid**); `datfrozenxid xid` (= **minimum of per-table pg_class.relfrozenxid**; for XID wraparound / shrinking pg_xact); `datminmxid xid` (minimum of per-table relminmxid; shrinking pg_multixact); `dattablespace oid` (default tablespace; tables with reltablespace = 0 live here, including all non-shared system catalogs); `datcollate`, `datctype`; `datlocale` (NULL if libc); `daticurules`; `datcollversion`; `datacl`.

### pg_db_role_setting  [M1, M7]  (source: catalog-pg-db-role-setting.txt)
- Shared. Defaults set for run-time configuration variables per role/database combination (ALTER ROLE/DATABASE ... SET). Columns: `setdatabase oid` (0 if not database-specific), `setrole oid` (0 if not role-specific), `setconfig text[]`.

### pg_default_acl  [M1]  (source: catalog-pg-default-acl.txt)
- Initial privileges for newly created objects. Columns: `oid`, `defaclrole`, `defaclnamespace` (0 if none), `defaclobjtype char` (`r` relation (table, view), `S` sequence, `f` function, `T` type, `n` schema, `L` large object), `defaclacl aclitem[]`.
- "Global" entries (defaclnamespace = 0) **override** the hard-wired default privileges; "per-schema" entries are **added to** the global or hard-wired defaults. A null ACL in another catalog means the hard-wired default, not whatever pg_default_acl currently says; pg_default_acl is only consulted during object creation.

### pg_depend  [M1, M6]  (source: catalog-pg-depend.txt)
- Dependency relationships between objects; lets DROP find what must be dropped by CASCADE or block in RESTRICT. (pg_shdepend for shared objects.)
- Columns: `classid oid` (catalog of dependent object), `objid oid`, `objsubid int4` (column number for a table column, else 0), `refclassid`, `refobjid`, `refobjsubid`, `deptype char`.
- In all cases the referenced object cannot be dropped without also dropping the dependent object. deptype flavors:
  - `n` **DEPENDENCY_NORMAL**: separately created objects. Dependent can be dropped freely; referenced can only be dropped with CASCADE (dependent dropped too). Example: a table column on its data type.
  - `a` **DEPENDENCY_AUTO**: dependent can be dropped separately, and is automatically dropped (regardless of RESTRICT/CASCADE) if the referenced object is dropped. Example: a named constraint on its table.
  - `i` **DEPENDENCY_INTERNAL**: dependent was created as part of the referenced object's creation; direct DROP of the dependent is disallowed outright (user told to drop the referenced object); dropping the referenced object drops the dependent whether or not CASCADE. If the dependent must be dropped due to another dependency, its drop is converted to a drop of the referenced object. Example: a view's ON SELECT rule on the view.
  - `P` **DEPENDENCY_PARTITION_PRI** / `S` **DEPENDENCY_PARTITION_SEC**: like INTERNAL but with more than one referenced object; dependent must not be dropped unless at least one referenced object is dropped; if any is, the dependent is dropped regardless of CASCADE. A drop of some other object the dependent depends on does not automatically delete a partition-referenced object, so unless the drop cascades to one of them via another path it is refused. Primary is preferred in error messages; an object should have one primary and one or more secondary. Made in addition to normal dependencies (simplifies ATTACH/DETACH PARTITION). Example: child partitioned index depends on its partition table (secondary) and parent partitioned index (primary).
  - `e` **DEPENDENCY_EXTENSION**: dependent is a member of the extension; can be dropped only via DROP EXTENSION; acts like INTERNAL; separate for clarity and pg_dump.
  - `x` **DEPENDENCY_AUTO_EXTENSION**: dependent is not a member of the extension (so not ignored by pg_dump) but cannot function without it; auto-dropped with the extension; may be dropped on its own; acts like AUTO.
- Two objects may be linked by more than one entry (union of semantics). A dependent can be dropped without CASCADE if any of its dependencies satisfies its condition for automatic dropping; conversely all restrictions must be satisfied.
- **Pinned objects**: most objects created during initdb are "pinned" (the system depends on them) and can never be dropped; the mechanism makes **no pg_depend entries** for dependencies on them (a numeric column has a notional NORMAL dependency on numeric, but no row exists).

### pg_description  [M1]  (source: catalog-pg-description.txt)
- Comments (COMMENT command; shown by psql `\d`). Columns: `objoid`, `classoid`, `objsubid int4` (column number for column comments else 0), `description text`. Built-in object descriptions are in the initial contents.

### pg_enum  [M2]  (source: catalog-pg-enum.txt)
- "The internal representation of a given enum value is actually the OID of its associated row in pg_enum."
- Columns: `oid`, `enumtypid` (-> pg_type), `enumsortorder float4`, `enumlabel name`.
- **OID rule**: even-numbered OIDs are guaranteed ordered the same as the sort ordering of their enum type (for two even OIDs of the same type, smaller OID => smaller enumsortorder). Odd OIDs bear no relationship. Lets comparison routines avoid catalog lookups in common cases; creation routines try to assign even OIDs.
- At creation, members get sort positions 1..n; members added later may get **negative or fractional** enumsortorder; must just be correctly ordered and unique within the type.

### pg_event_trigger  [M6]  (source: catalog-pg-event-trigger.txt)
- Columns: `oid`, `evtname` (must be unique), `evtevent name`, `evtowner`, `evtfoid` (-> pg_proc), `evtenabled char` (controls firing by `session_replication_role`: `O` = fires in "origin" and "local" modes, `D` = disabled, `R` = fires in "replica" mode, `A` = always), `evttags text[]` (command tags; NULL = not restricted).

### pg_extension  [M6]  (source: catalog-pg-extension.txt)
- Columns: `oid`, `extname`, `extowner`, `extnamespace` (schema containing exported objects), `extrelocatable bool`, `extversion text`, `extconfig oid[]` (regclass OIDs of configuration tables or NULL), `extcondition text[]` (WHERE filter conditions for config tables or NULL).
- extnamespace does **not** mean the extension belongs to that schema; extension names are never schema-qualified. If extrelocatable is true the schema must contain all schema-qualifiable objects of the extension.

### Foreign data catalogs  [M6]  (source: catalog-pg-foreign-data-wrapper.txt, catalog-pg-foreign-server.txt, catalog-pg-foreign-table.txt)
- **pg_foreign_data_wrapper**: `oid`, `fdwname`, `fdwowner`, `fdwhandler` (handler function supplying execution routines; 0 if none), `fdwvalidator` (validates options for the FDW, its foreign servers and user mappings; 0 if none), `fdwacl`, `fdwoptions text[]`.
- **pg_foreign_server**: `oid`, `srvname`, `srvowner`, `srvfdw`, `srvtype text` (optional), `srvversion text` (optional), `srvacl`, `srvoptions text[]`.
- **pg_foreign_table**: `ftrelid` (-> pg_class), `ftserver`, `ftoptions text[]`. A foreign table is primarily a pg_class entry (relkind f).

### pg_index  [M4, M5]  (source: catalog-pg-index.txt)
- "Contains part of the information about indexes. The rest is mostly in pg_class."
- Columns (all 21):
  - `indexrelid oid` (pg_class entry for the index); `indrelid oid` (the table).
  - `indnatts int2`: total columns in the index (duplicates pg_class.relnatts), **key + included**.
  - `indnkeyatts int2`: number of **key** columns, not counting included columns "which are merely stored and do not participate in the index semantics".
  - `indisunique bool`.
  - `indnullsnotdistinct bool`: only for unique indexes. false => nulls are distinct (multiple nulls allowed; default); true => nulls considered equal (only one null).
  - `indisprimary bool` (indisunique always true when this is true).
  - `indisexclusion bool`: supports an exclusion constraint.
  - `indimmediate bool`: uniqueness check enforced immediately on insertion (irrelevant if not unique).
  - `indisclustered bool`: table was last clustered on this index.
  - `indisvalid bool`: currently valid for queries. False => possibly incomplete: must still be modified by INSERT/UPDATE but cannot safely be used for queries; if unique, uniqueness not guaranteed either.
  - `indcheckxmin bool`: queries must not use the index until the **xmin of this pg_index row is below their TransactionXmin event horizon**, because the table may contain **broken HOT chains** with incompatible rows they can see.
  - `indisready bool`: ready for inserts. False => index must be ignored by INSERT/UPDATE.
  - `indislive bool`: false => index is being dropped; ignore for all purposes (including HOT-safety decisions).
  - `indisreplident bool`: chosen via `ALTER TABLE ... REPLICA IDENTITY USING INDEX ...`.
  - `indkey int2vector`: indnatts values naming table columns (e.g. `1 3`); key columns come before included columns; **0 = expression** rather than simple column reference.
  - `indcollation oidvector`: per key column (indnkeyatts values) collation OID or 0.
  - `indclass oidvector`: per key column operator class OID.
  - `indoption int2vector`: indnkeyatts per-column flag bits; meaning defined by the AM.
  - `indexprs pg_node_tree`: expression trees for non-simple attributes, one element per zero in indkey; null if none.
  - `indpred pg_node_tree`: partial index predicate; null if not partial.
- CREATE INDEX CONCURRENTLY state machine teaching hook: indisready=false,indisvalid=false -> indisready=true -> indisvalid=true; DROP CONCURRENTLY uses indislive.

### pg_inherits  [M7, M1]  (source: catalog-pg-inherits.txt)
- One entry per **direct** parent-child table or index relationship (indirect via chains). Columns: `inhrelid` (child), `inhparent`, `inhseqno int4` (order among multiple direct parents, starts at 1; indexes cannot have multiple inheritance since they only inherit via declarative partitioning), `inhdetachpending bool` (true for a partition in the process of being detached).

### pg_init_privs  [M1, M6]  (source: catalog-pg-init-privs.txt)
- One entry per object with non-default (non-NULL) initial privileges; set by initdb (`privtype` = `'i'`) or by GRANT/REVOKE in a CREATE EXTENSION script (`'e'`; recorded automatically). Columns: `objoid`, `classoid`, `objsubid int4`, `privtype char`, `initprivs aclitem[]`.

### pg_language  [M6]  (source: catalog-pg-language.txt)
- Columns: `oid`, `lanname`, `lanowner`, `lanispl bool` (false for internal languages such as SQL, true for user-defined; still used by pg_dump), `lanpltrusted bool` (trusted = believed not to grant access outside the normal SQL execution environment; **only superusers can create functions in untrusted languages**), `lanplcallfoid` (language handler; 0 for internal languages), `laninline` (executes DO blocks; 0 if unsupported), `lanvalidator` (checks syntax/validity of new functions; 0 if none), `lanacl`.

### pg_largeobject / pg_largeobject_metadata  [M2]  (source: catalog-pg-largeobject.txt, catalog-pg-largeobject-metadata.txt)
- Large object identified by OID assigned at creation; broken into "pages" stored as rows. Data per page = **LOBLKSIZE = BLCKSZ/4, typically 2 kB**.
- pg_largeobject columns: `loid oid` (-> pg_largeobject_metadata.oid), `pageno int4` (from zero), `data bytea` (never more than LOBLKSIZE bytes, may be less). Row holds data starting at byte offset `pageno * LOBLKSIZE`. **Sparse storage**: pages may be missing and may be short even if not last; missing regions read as zeroes.
- Before 9.0 there were no LO permissions and pg_largeobject was publicly readable; now use pg_largeobject_metadata to list LO OIDs.
- pg_largeobject_metadata columns: `oid`, `lomowner`, `lomacl`.

### pg_namespace  [M1]  (source: catalog-pg-namespace.txt)
- A namespace is the structure underlying SQL schemas. Columns: `oid`, `nspname`, `nspowner`, `nspacl`.

### pg_opclass / pg_operator / pg_opfamily  [M4]  (source: catalog-pg-opclass.txt, catalog-pg-operator.txt, catalog-pg-opfamily.txt)
- **pg_opclass**: an operator class "essentially specifies that a particular operator family is applicable to a particular indexable column data type"; usable operators = those in the family accepting the column type as left-hand input. Columns: `oid`, `opcmethod` (-> pg_am), `opcname`, `opcnamespace`, `opcowner`, `opcfamily`, `opcintype` (type indexed), `opcdefault bool`, `opckeytype` (type stored in index, 0 if same as opcintype). opcmethod must match the family's opfmethod; at most one opcdefault per (opcmethod, opcintype).
- **pg_operator**: `oid`, `oprname`, `oprnamespace`, `oprowner`, `oprkind char` (`b` = infix "both", `l` = prefix "left"), `oprcanmerge bool` (supports merge joins), `oprcanhash bool` (supports hash joins), `oprleft` (0 for prefix), `oprright`, `oprresult` (0 for a not-yet-defined "shell" operator), `oprcom` (commutator, 0 if none), `oprnegate` (negator), `oprcode regproc` (implementing function; 0 for shell), **`oprrest regproc` (restriction selectivity estimator)**, **`oprjoin regproc` (join selectivity estimator)**.
- **pg_opfamily**: collection of operators and support routines implementing semantics for an index AM; operators in a family are "compatible"; enables cross-data-type operators with indexes. Columns: `oid`, `opfmethod`, `opfname`, `opfnamespace`, `opfowner`. Most defining info is in pg_amop, pg_amproc, pg_opclass.

### pg_parameter_acl  [M1, M7]  (source: catalog-pg-parameter-acl.txt)
- Shared. GUCs for which privileges have been granted (GRANT SET/ALTER SYSTEM ON PARAMETER); no entry for default privileges. Columns: `oid`, `parname text`, `paracl aclitem[]`.

### pg_partitioned_table  [M7]  (source: catalog-pg-partitioned-table.txt)
- Columns: `partrelid`, `partstrat char` (`h` hash, `l` list, `r` range), `partnatts int2`, `partdefid oid` (default partition or 0), `partattrs int2vector` (e.g. `1 3`; 0 = expression), `partclass oidvector` (opclass per key column), `partcollation oidvector`, `partexprs pg_node_tree` (one element per zero in partattrs; null if none).

### pg_policy  [M1, M5]  (source: catalog-pg-policy.txt)
- RLS policies. Columns: `oid`, `polname`, `polrelid`, `polcmd char` (`r` SELECT, `a` INSERT, `w` UPDATE, `d` DELETE, `*` all), `polpermissive bool`, `polroles oid[]` (0 means PUBLIC, normally alone), `polqual pg_node_tree` (added to security-barrier qualifications), `polwithcheck pg_node_tree` (WITH CHECK for rows being added). Policies apply only when `pg_class.relrowsecurity` is set.

### pg_proc  [M6, M4]  (source: catalog-pg-proc.txt)
- Functions, procedures, aggregate functions, window functions (collectively "routines"). Aggregates have a matching pg_aggregate row.
- Columns (all 30): `oid`; `proname`; `pronamespace`; `proowner`; `prolang` (-> pg_language: implementation language or call interface); **`procost float4`** (estimated execution cost **in units of `cpu_operator_cost`**; if proretset, cost per row returned); **`prorows float4`** (estimated result rows; 0 if not proretset); `provariadic oid` (element type of variadic array param, 0 if none); **`prosupport regproc`** (planner support function, 0 if none); **`prokind char`** (`f` normal function, `p` procedure, `a` aggregate, `w` window function); `prosecdef bool` (security definer, "setuid" function); **`proleakproof bool`** (no side effects; no info about args conveyed except via return value; any function that might throw an error depending on argument values is not leakproof); `proisstrict bool` (returns null if any arg is null — function is not actually called at all); `proretset bool` (returns a set); **`provolatile char`** (`i` immutable: same result for same inputs always; `s` stable: results for fixed inputs do not change within a scan; `v` volatile: may change at any time — also use v for side-effect functions so calls cannot be optimized away); **`proparallel char`** (`s` safe without restriction; `r` restricted to the parallel group leader, workers cannot invoke; `u` unsafe: presence forces a serial plan); `pronargs int2`; `pronargdefaults int2`; `prorettype oid`; `proargtypes oidvector` (input args only, incl. INOUT and VARIADIC = call signature; **subscripted from 0** for historical reasons); `proallargtypes oid[]` (all args incl. OUT/INOUT; null if all IN; 1-based); `proargmodes char[]` (`i` IN, `o` OUT, `b` INOUT, `v` VARIADIC, `t` TABLE; null if all IN; positions per proallargtypes); `proargnames text[]` (unnamed = empty string; null if none named); `proargdefaults pg_node_tree` (list of pronargdefaults elements for the last N input args); `protrftypes oid[]` (types for TRANSFORM clause); `prosrc text`; `probin text`; `prosqlbody pg_node_tree` (pre-parsed SQL-standard function body); `proconfig text[]` (function-local GUC settings); `proacl`.
- prosrc: for compiled functions (built-in and dynamically loaded) = C-language name (link symbol); for SQL functions = source text if string literal, unused (typically empty) if SQL-standard body (prosqlbody then holds it); other languages = source text. probin: null except dynamically loaded C functions, where it names the shared library file.

### Publication catalogs  [M7]  (source: catalog-pg-publication.txt, catalog-pg-publication-namespace.txt, catalog-pg-publication-rel.txt)
- **pg_publication**: `oid`, `pubname`, `pubowner`, `puballtables bool` (auto-includes all tables incl. future ones), `pubinsert`, `pubupdate`, `pubdelete`, `pubtruncate` (which operations are replicated), `pubviaroot bool` (operations on a leaf partition are replicated using the identity and schema of its topmost partitioned ancestor mentioned in the publication), **`pubgencols char`** (PG18; generated column handling when no column list: `n` = generated columns not replicated, `s` = stored generated columns replicated).
- **pg_publication_namespace**: `oid`, `pnpubid`, `pnnspid` (many-to-many schema<->publication).
- **pg_publication_rel**: `oid`, `prpubid`, `prrelid`, `prqual pg_node_tree` (row filter; null if none), `prattrs int2vector` (column list e.g. `1 3`; null = all columns published).

### pg_range  [M2]  (source: catalog-pg-range.txt)
- `rngtypid`, `rngsubtype` (element type), `rngmultitypid` (multirange type), `rngcollation` (0 if none), `rngsubopc` (subtype opclass used for range comparisons), `rngcanonical regproc` (canonical-form function, 0 if none; used when element type is discrete), `rngsubdiff regproc` (difference between two element values as double precision; optional but improves GiST index performance). rngsubopc (+ rngcollation) determines the sort ordering.

### pg_replication_origin  [M7]  (source: catalog-pg-replication-origin.txt)
- Shared. `roident oid` (unique cluster-wide id; "Should never leave the system"), `roname text` (external user-defined name).

### pg_rewrite  [M6, M4]  (source: catalog-pg-rewrite.txt)
- Rewrite rules for tables and views. Columns: `oid`, `rulename`, `ev_class` (table), **`ev_type char`: `1` = SELECT, `2` = UPDATE, `3` = INSERT, `4` = DELETE**, `ev_enabled char` (O/D/R/A by session_replication_role, as triggers), `is_instead bool`, `ev_qual pg_node_tree` (qualifying condition), `ev_action pg_node_tree` (**query tree** of the rule's action in nodeToString() form). pg_class.relhasrules must be true if any rules exist. A view = a relation with relkind `v` + an ON SELECT INSTEAD rule here (conventionally named `_RETURN`; name per ch.39, not this page).

### pg_seclabel / pg_shseclabel / pg_shdescription  [M1]  (source: catalog-pg-seclabel.txt, catalog-pg-shseclabel.txt, catalog-pg-shdescription.txt)
- **pg_seclabel**: `objoid`, `classoid`, `objsubid`, `provider text`, `label text` (SECURITY LABEL command; easier via pg_seclabels view).
- **pg_shseclabel** (shared): `objoid`, `classoid`, `provider`, `label`.
- **pg_shdescription** (shared): `objoid`, `classoid`, `description`.

### pg_sequence  [M2]  (source: catalog-pg-sequence.txt)
- `seqrelid` (-> pg_class), `seqtypid`, `seqstart int8`, `seqincrement int8`, `seqmax int8`, `seqmin int8`, `seqcache int8`, `seqcycle bool`. Name and schema are in pg_class.

### pg_shdepend  [M1]  (source: catalog-pg-shdepend.txt)
- Shared. Dependencies between database objects and shared objects (roles etc.) so shared objects are unreferenced before deletion.
- Columns: `dbid oid` (0 for a shared object), `classid`, `objid`, `objsubid int4`, `refclassid` (must be a shared catalog), `refobjid`, `deptype char`.
- deptype: `o` SHARED_DEPENDENCY_OWNER (referenced role owns the dependent object); `a` SHARED_DEPENDENCY_ACL (role mentioned in the ACL; not made for the owner); `i` SHARED_DEPENDENCY_INITACL (role mentioned in a pg_init_privs entry); `r` SHARED_DEPENDENCY_POLICY (role is target of a dependent policy); `t` SHARED_DEPENDENCY_TABLESPACE (tablespace mentioned for a relation that doesn't have storage). Only roles and tablespaces supported as referenced objects. Pinned objects: no entries.

### pg_statistic  [M4]  (source: catalog-pg-statistic.txt)
- Created by ANALYZE; used by the planner. "All the statistical data is inherently approximate, even assuming that it is up-to-date."
- Normally one entry with `stainherit = false` per analyzed table column. If the table has inheritance children or partitions, a second entry with `stainherit = true` is also created = stats over the inheritance tree (`SELECT column FROM table*`), whereas false = `SELECT column FROM ONLY table`.
- Also stores stats about **index expression** values, described as if actual data columns (`starelid` references the index). No entry for an ordinary non-expression index column (redundant). Index-expression entries always have stainherit = false.
- Design: only extremely general stats (nullness) get dedicated columns; everything else is stored in **"slots"** — groups of associated columns whose content is identified by a code number in one of the slot's columns (see `src/include/catalog/pg_statistic.h`).
- **Not publicly readable** (min/max of a salary column could be sensitive). `pg_stats` is the public view exposing only tables readable by the current user.
- Columns: `starelid oid`; `staattnum int2`; `stainherit bool`; `stanullfrac float4` (fraction of entries that are null); `stawidth int4` (average stored width in bytes of nonnull entries); **`stadistinct float4`**: > 0 = actual number of distinct nonnull values; < 0 = negative of a multiplier for the number of rows (e.g. ~80% nonnull and each nonnull value appearing about twice => `stadistinct = -0.4`); 0 = unknown. Slot columns for each slot N: `stakindN int2` (code number for the kind of statistics in the Nth slot), `staopN oid` (operator used to derive the stats, e.g. the `<` operator defining sort order for a histogram; 0 if not needed), `stacollN oid` (collation used; 0 for noncollatable), `stanumbersN float4[]` (numerical stats or null), `stavaluesN anyarray` (column data values or null; elements are of the column's type or a related type such as an array's element type — hence anyarray).
- NOTE (not stated on this docs page; the page defers to pg_statistic.h): the page writes the slot columns generically as "N" and does not enumerate the stakind codes or the slot count. The pg_stats view (below) shows which kinds exist: MCV (most_common_vals/freqs), histogram (histogram_bounds), correlation, MCELEM (most_common_elems/elem_freqs), DECHIST (elem_count_histogram), range-length histogram, range-bounds histogram. From the header (outside this slice, verify before quoting): 5 slots (N = 1..5); STATISTIC_KIND_MCV=1, HISTOGRAM=2, CORRELATION=3, MCELEM=4, DECHIST=5, RANGE_LENGTH_HISTOGRAM=6, BOUNDS_HISTOGRAM=7.

### pg_statistic_ext / pg_statistic_ext_data  [M4]  (source: catalog-pg-statistic-ext.txt, catalog-pg-statistic-ext-data.txt)
- **pg_statistic_ext** (definitions; one row per CREATE STATISTICS object): `oid`, `stxrelid`, `stxname`, `stxnamespace`, `stxowner`, `stxkeys int2vector` (covered columns e.g. `1 3`), `stxstattarget int2` (0 = no stats collected; null = max of the statistics targets of the referenced columns if set, or system default; positive = target number of MCVs), **`stxkind char[]`** (`d` n-distinct, `f` functional dependencies, `m` MCV list, `e` expression statistics), `stxexprs pg_node_tree` (one element per expression; null if all simple references).
  - Row is filled completely during CREATE STATISTICS, but **values are not computed then**; a subsequent ANALYZE populates pg_statistic_ext_data.
- **pg_statistic_ext_data**: `stxoid`, `stxdinherit bool` (second row with true when table has children/partitions), `stxdndistinct pg_ndistinct`, `stxddependencies pg_dependencies`, `stxdmcv pg_mcv_list`, `stxdexpr pg_statistic[]` (per-expression stats as array of pg_statistic). Not publicly readable; `pg_stats_ext` is the public view (only tables the current user **owns**).

### Subscription catalogs  [M7]  (source: catalog-pg-subscription.txt, catalog-pg-subscription-rel.txt)
- **pg_subscription** (shared; `subconninfo` access revoked from normal users since it may hold plain-text passwords). Columns: `oid`; `subdbid`; `subskiplsn pg_lsn` (finish LSN of the transaction whose changes are to be skipped; else 0/0); `subname`; `subowner`; `subenabled bool`; `subbinary bool` (request binary format); **`substream char`** (`f` disallow streaming of in-progress transactions; `t` spill changes of in-progress transactions to disk and apply at once after commit on publisher is received; `p` apply directly using a parallel apply worker if available, same as t if none); **`subtwophasestate char`** (`d` disabled, `p` pending enablement, `e` enabled); `subdisableonerr bool`; `subpasswordrequired bool`; `subrunasowner bool`; `subfailover bool` (associated slots — main slot and table sync slots — in upstream are enabled to be synchronized to standbys); `subconninfo text`; `subslotname name` (also used as local replication origin name; null = NONE); `subsynccommit text` (synchronous_commit for workers); `subpublications text[]`; `suborigin text` (`none` = only changes without an origin; `any` (default) = regardless of origin).
- **pg_subscription_rel**: `srsubid`, `srrelid`, **`srsubstate char`** (`i` initialize, `d` data is being copied, `f` finished table copy, `s` synchronized, `r` ready (normal replication)), `srsublsn pg_lsn` (remote LSN of the state change for sync coordination in s or r states, else null). Only contains tables known after CREATE SUBSCRIPTION or ALTER SUBSCRIPTION ... REFRESH PUBLICATION.

### pg_tablespace / pg_transform / pg_user_mapping  [M1, M6]  (source: catalog-pg-tablespace.txt, catalog-pg-transform.txt, catalog-pg-user-mapping.txt)
- **pg_tablespace** (shared): `oid`, `spcname`, `spcowner`, `spcacl`, `spcoptions text[]`.
- **pg_transform**: `oid`, `trftype`, `trflang`, `trffromsql regproc` (convert type for input to the PL; 0 = default behaviour), `trftosql regproc` (convert PL output to the type; 0 = default).
- **pg_user_mapping** (restricted; use view pg_user_mappings): `oid`, `umuser` (0 if public mapping), `umserver`, `umoptions text[]`.

### pg_trigger  [M6]  (source: catalog-pg-trigger.txt)
- Triggers on tables and views. Columns: `oid`; `tgrelid`; `tgparentid` (parent trigger this was cloned from when partitions are created/attached; 0 if not a clone); `tgname` (unique among triggers of same table); `tgfoid`; `tgtype int2` (bit mask of firing conditions); `tgenabled char` (`O` origin and local modes, `D` disabled, `R` replica mode, `A` always — per `session_replication_role`); `tgisinternal bool` (internally generated, usually to enforce tgconstraint); `tgconstrrelid` (table referenced by an RI constraint); `tgconstrindid` (index supporting unique/PK/RI/exclusion constraint); `tgconstraint` (-> pg_constraint); `tgdeferrable`; `tginitdeferred`; `tgnargs int2`; `tgattr int2vector` (column numbers if column-specific; else empty array); `tgargs bytea` (argument strings, each NULL-terminated); `tgqual pg_node_tree` (WHEN condition); `tgoldtable name`, `tgnewtable name` (REFERENCING transition table names).
- Column-specific triggering is supported only for UPDATE events. A non-deferrable trigger can be associated with a deferrable constraint (FK constraints have some deferrable and some non-deferrable triggers). pg_class.relhastriggers must be true if any triggers exist.

### Text search catalogs  [M6]  (source: catalog-pg-ts-config.txt, catalog-pg-ts-config-map.txt, catalog-pg-ts-dict.txt, catalog-pg-ts-parser.txt, catalog-pg-ts-template.txt)
- **pg_ts_config**: a configuration = one parser + list of dictionaries per parser output token type. `oid`, `cfgname`, `cfgnamespace`, `cfgowner`, `cfgparser`.
- **pg_ts_config_map**: `mapcfg`, `maptokentype int4`, `mapseqno int4` (lower first), `mapdict`.
- **pg_ts_dict**: dictionary depends on a template (implementation functions); dictionary supplies user-settable parameters, so unprivileged users can create dictionaries. `oid`, `dictname`, `dictnamespace`, `dictowner`, `dicttemplate`, `dictinitoption text`.
- **pg_ts_parser** (C functions; superuser-only): `oid`, `prsname`, `prsnamespace`, `prsstart`, `prstoken`, `prsend`, `prsheadline` (0 if none), `prslextype`.
- **pg_ts_template** (superuser-only): `oid`, `tmplname`, `tmplnamespace`, `tmplinit` (0 if none), `tmpllexize`.

### pg_type  [M2]  (source: catalog-pg-type.txt)
- Base and enum types via CREATE TYPE, domains via CREATE DOMAIN. **A composite type is automatically created for each table** (its row structure); also CREATE TYPE AS.
- Columns (all 32):
  - `oid`, `typname`, `typnamespace`, `typowner`.
  - **`typlen int2`**: fixed-size = number of bytes; variable-length is negative: **-1 = "varlena" (has a length word), -2 = null-terminated C string**.
  - **`typbyval bool`**: pass by value vs reference. "had better be false if typlen is not 1, 2, or 4 (or 8 on machines where Datum is 8 bytes)". Variable-length always by reference. Can be false even if length would allow by-value.
  - **`typtype char`**: `b` base, `c` composite (e.g. table row type), `d` domain, `e` enum, `p` pseudo-type, `r` range, `m` multirange.
  - `typcategory char`: arbitrary classification used by the parser to determine which implicit casts are "preferred" (codes below). `typispreferred bool`: preferred cast target within its category.
  - `typisdefined bool`: false = placeholder (shell) for a not-yet-defined type; only name, namespace, OID reliable.
  - `typdelim char`: separator between values when parsing array input (associated with the element type, not the array type).
  - `typrelid oid`: for composite types, the pg_class entry (for free-standing composite types the pg_class entry doesn't represent a table but is needed for pg_attribute entries). 0 otherwise.
  - `typsubscript regproc`: subscripting handler, 0 if none; "true" arrays have `array_subscript_handler`.
  - `typelem oid`: type yielded by subscripting; implies physical containment of the element type (DDL on element type may be restricted).
  - `typarray oid`: the "true" array type having this type as element.
  - `typinput`, `typoutput` (text format); `typreceive`, `typsend` (binary format, 0 if none); `typmodin` (0 if no modifiers), `typmodout` (0 = standard format); `typanalyze` (custom ANALYZE function, 0 = standard).
  - **`typalign char`**: alignment when storing a value (on disk and most in-memory representations); padding inserted before a datum so it begins on the boundary; reference is the beginning of the first datum in the sequence. `c` = char alignment (none needed); `s` = short (2 bytes on most machines); `i` = int (4 bytes on most machines); `d` = double (8 bytes on many machines, but by no means all).
  - **`typstorage char`** (for varlena types): `p` plain (always stored plain; non-varlena types always use this); `e` external (can be stored in the TOAST relation; no compression); `m` main (can be compressed and stored inline); `x` extended (can be compressed and/or moved to secondary relation). `x` is the usual choice. `m` values can also be moved out, but only as a last resort (e and x moved first).
  - `typnotnull bool` (domains only); `typbasetype oid` (domain base type); `typtypmod int4` (typmod applied to base type; -1 if none or not a domain); `typndims int4` (array dimensions for a domain over an array; else 0); `typcollation oid` (0 if not collatable; typically DEFAULT_COLLATION_OID); `typdefaultbin pg_node_tree` (domains only); `typdefault text` (human-readable default, or external representation of default value); `typacl`.
- "For fixed-width types used in system tables, it is critical that the size and alignment defined in pg_type agree with the way that the compiler will lay out the column in a structure representing a table row."
- **typcategory codes (Table 52.65)**: `A` Array, `B` Boolean, `C` Composite, `D` Date/time, `E` Enum, `G` Geometric, `I` Network address, `N` Numeric, `P` Pseudo-types, `R` Range, `S` String, `T` Timespan, `U` User-defined, `V` Bit-string, `X` unknown type, `Z` Internal-use. Future additions will be upper-case ASCII; all other ASCII characters are reserved for user-defined categories.

### Ch.53 — System views: general  [M1]  (source: views.txt, views-overview.txt)
- Two flavours: views giving convenient access to common catalog queries; views exposing **internal server state**. The information schema (ch.35) overlaps; since it is SQL-standard it is "usually better to use the information schema if it provides all the information you need". Accumulated-statistics views (pg_stat_*) are in Table 27.2, not here. All views here are read-only except where noted (pg_settings is updatable).

### pg_aios (new in PG18)  [M1, M2]  (source: view-pg-aios.txt)
- Lists all **Asynchronous I/O handles currently in use**; one row per handle. A handle references an I/O operation being prepared, executed, or completing. Mainly for PostgreSQL developers, also tuning. Read-only; readable only by superusers or roles with privileges of `pg_read_all_stats`.
- Columns: `pid int4` (process issuing the I/O); `io_id int4` (handle id; handles are reused once I/O completed or released before start; on reuse io_generation is incremented); `io_generation int8`; **`state text`**: `HANDED_OUT` (referenced by code but not yet used) -> `DEFINED` (information necessary for execution is known) -> `STAGED` (ready for execution) -> `SUBMITTED` (submitted for execution) -> `COMPLETED_IO` (finished, result not yet processed) -> `COMPLETED_SHARED` (shared completion processing completed) -> `COMPLETED_LOCAL` (backend-local completion processing completed); `operation text` (`invalid` not yet known, `readv` vectored read, `writev` vectored write); `off int8`; `length int8`; `target text` (`smgr` = I/O on relations); `handle_data_len int2` (for I/O to/from shared_buffers and temp_buffers = number of buffers operated on); `raw_result int4` (low-level result or NULL); **`result text`** (`UNKNOWN`; `OK`; `PARTIAL` = completed without error but did not process all data, callers commonly retry the remainder in a separate I/O; `WARNING` = completed but triggered a warning, e.g. corrupted buffer with `zero_damaged_pages` enabled; `ERROR`); `target_desc text`; `f_sync bool` (executed synchronously); `f_localmem bool` (references process-local memory); `f_buffered bool` (buffered I/O).

### Extension availability views  [M6]  (source: view-pg-available-extensions.txt, view-pg-available-extension-versions.txt)
- **pg_available_extensions**: `name`, `default_version` (NULL if none specified), `installed_version` (NULL if not installed), `comment` (from control file).
- **pg_available_extension_versions**: `name`, `version`, `installed bool`, `superuser bool` (only superusers may install — but see trusted), `trusted bool` (installable by non-superusers with appropriate privileges), `relocatable bool`, `schema name` (required schema or NULL if relocatable), `requires name[]` (prerequisite extensions), `comment`.

### pg_backend_memory_contexts  [M1]  (source: view-pg-backend-memory-contexts.txt)
- All memory contexts of the server process attached to the **current session**; one row per context. Readable by superusers / `pg_read_all_stats`.
- Columns: `name text`; `ident text` (truncated at 1024 bytes); `type text`; `level int4` (1-based level in hierarchy; also the position of the context in `path`); `path int4[]` (transient numeric ids: first element is **TopMemoryContext**, then intermediate parents, last = this context); `total_bytes int8`; `total_nblocks int8`; `free_bytes int8`; `free_chunks int8`; `used_bytes int8`.
- Path ids can be unstable between invocations in the same query (contexts are created/destroyed during query execution) — use a CTE to evaluate once. Example: total bytes of CacheMemoryContext and all children:
  ```sql
  WITH memory_contexts AS (SELECT * FROM pg_backend_memory_contexts)
  SELECT sum(c1.total_bytes)
  FROM memory_contexts c1, memory_contexts c2
  WHERE c2.name = 'CacheMemoryContext'
  AND c1.path[c2.level] = c2.path[c2.level];
  ```

### pg_config  [M1]  (source: view-pg-config.txt)
- Compile-time configuration parameters of the installed version (same info as the `pg_config` client application); for packages locating headers/libraries. Superuser-only by default. Columns: `name text`, `setting text`.

### pg_cursors  [M6, M3]  (source: view-pg-cursors.txt)
- Lists currently available cursors, created via: (1) `DECLARE` in SQL; (2) the **Bind message** of the frontend/backend protocol (portals); (3) SPI. Cursors exist only for the duration of the defining transaction unless declared `WITH HOLD`. Cursors are also used internally (e.g. procedural languages), so the view may show cursors not explicitly created by the user.
- Columns: `name text`; `statement text` (verbatim query string submitted to declare the cursor); `is_holdable bool` (accessible after the declaring transaction committed); `is_binary bool` (declared BINARY); `is_scrollable bool` (rows retrievable nonsequentially); `creation_time timestamptz`. Read-only.

### pg_file_settings / pg_hba_file_rules / pg_ident_file_mappings  [M7, M1]  (source: view-pg-file-settings.txt, view-pg-hba-file-rules.txt, view-pg-ident-file-mappings.txt)
- All three: superuser-only by default; report the **current contents of the files, not what was last applied/loaded** by the server — use them to pre-check planned changes or diagnose a failed reload.
- **pg_file_settings**: one row per "name = value" entry (+ extra rows for problems like syntax errors). Columns: `sourcefile text` (full path), `sourceline int4`, `seqno int4` (processing order 1..n), `name`, `setting`, `applied bool` (value can be applied successfully), `error text`.
  - If the file has syntax errors or invalid parameter names, the server will not apply **any** settings from it: all `applied` = false, with one or more rows with non-null error. Otherwise individual settings are applied if possible; an individual failure (invalid value, or setting cannot be changed after server start) gets an error message. `applied = false` with null error = **overridden by a later entry** for the same parameter (not an error).
- **pg_hba_file_rules**: one row per non-empty, non-comment line. Columns: `rule_number int4` (order considered until a match is found; NULL if invalid), `file_name text`, `line_number int4`, `type text` (connection type), `database text[]`, `user_name text[]`, `address text` (host name / IP, or `all`, `samehost`, `samenet`; null for local), `netmask text`, `auth_method text`, `options text[]`, `error text`. Incorrect entries usually have values only for line_number and error.
- **pg_ident_file_mappings**: `map_number int4` (priority order; NULL if invalid), `file_name`, `line_number`, `map_name`, `sys_name` (detected user name of the client), `pg_username` (requested PostgreSQL user name), `error`.

### pg_group / pg_roles / pg_shadow / pg_user (role views; pg_roles etc. detailed later)  [M1]  (source: view-pg-group.txt)
- **pg_group**: backwards compatibility (emulates a pre-8.1 catalog). Shows names and members of all roles marked not `rolcanlogin` (approximation of "groups"). Columns: `groname`, `grosysid oid`, `grolist oid[]`.

### pg_indexes / pg_matviews / pg_policies  [M4, M6]  (source: view-pg-indexes.txt, view-pg-matviews.txt, view-pg-policies.txt)
- **pg_indexes**: `schemaname`, `tablename`, `indexname`, `tablespace` (null if database default), `indexdef text` (reconstructed CREATE INDEX command).
- **pg_matviews**: `schemaname`, `matviewname`, `matviewowner`, `tablespace`, `hasindexes bool` (has or recently had), `ispopulated bool`, `definition text` (reconstructed SELECT).
- **pg_policies**: `schemaname`, `tablename`, `policyname`, `permissive text`, `roles name[]`, `cmd text`, `qual text`, `with_check text`.

### pg_locks  [M5]  (source: view-pg-locks.txt)
- Information about locks held by active processes. **One row per active lockable object, requested lock mode, and relevant process.** Same object may appear many times; an object with no locks does not appear at all.
- Lockable object kinds: whole relations; individual pages of relations; individual tuples; transaction IDs (virtual and permanent); general database objects (class OID + object OID, as in pg_description/pg_depend); the right to **extend a relation**; the right to update **pg_database.datfrozenxid**; **advisory** locks on user-defined numbers.
- Columns (all 16):
  1. **`locktype text`**: `relation`, `extend`, `frozenid`, `page`, `tuple`, `transactionid`, `virtualxid`, `spectoken`, `object`, `userlock`, `advisory`, or `applytransaction` (12 values; see also wait events Table 27.11).
  2. `database oid`: database of the lock target; **0 if target is a shared object; null if target is a transaction ID**.
  3. `relation oid`: relation targeted; null if target is not a relation or part of one.
  4. `page int4`: page number within the relation; null unless target is a relation page or tuple.
  5. `tuple int2`: tuple number within the page; null unless a tuple.
  6. `virtualxid text`: virtual ID of the targeted transaction; null unless target is a virtual transaction ID.
  7. `transactionid xid`: ID of the targeted transaction; null unless a transaction ID.
  8. `classid oid`: system catalog containing the lock target; null unless a general database object.
  9. `objid oid`: OID of the lock target within its catalog; null unless general object.
  10. `objsubid int2`: column number (classid/objid refer to the table); 0 for other general objects; null if not a general object.
  11. `virtualtransaction text`: virtual ID of the transaction **holding or awaiting** this lock.
  12. `pid int4`: server process holding or awaiting; **null if held by a prepared transaction**.
  13. `mode text`: lock mode held or desired (table-level modes of 13.3.1 and SSI modes of 13.2.3, e.g. AccessShareLock ... AccessExclusiveLock, SIReadLock).
  14. `granted bool`: true if held, false if awaited.
  15. `fastpath bool`: true if taken via **fast path**, false if via main lock table.
  16. `waitstart timestamptz`: when the process started waiting; null if held. Can be null for a very short period after the wait started even though granted is false.
- `granted = false` implies at least one other process is holding or waiting for a conflicting mode on the same object. The waiter sleeps until the other lock is released or a deadlock is detected. **A single process can be waiting to acquire at most one lock at a time.**
- **Transaction-ID locking protocol**: throughout a transaction a server process holds an **exclusive lock on the transaction's virtual transaction ID**. If a permanent ID is assigned (normally only if the transaction changes database state), it also holds an **exclusive lock on the permanent XID** until it ends. To wait for another transaction to end, a process attempts to acquire a **share lock on that transaction's ID** (virtual or permanent) — succeeds only when the other transaction terminates and releases its locks.
- **Row-level locks**: tuples are a lockable type, but "information about row-level locks is stored on disk, not in memory, and therefore row-level locks normally do not appear in this view". A process waiting for a row lock usually appears as waiting for the **permanent transaction ID of the current holder** of that row lock.
- **Speculative insertion lock** (`spectoken`): transaction ID + speculative insertion token; token shown in `objid`.
- **Advisory locks**: keys are a single bigint or two integers. bigint key: high-order half in `classid`, low-order half in `objid`, `objsubid = 1`; reassemble with `(classid::bigint << 32) | objid::bigint`. Two-integer keys: first in `classid`, second in `objid`, `objsubid = 2`. Advisory locks are **local to each database** (database column meaningful).
- **Apply transaction locks** (`applytransaction`): used in parallel apply mode in logical replication. Remote transaction ID in `transactionid`; `objsubid` = lock subtype: 0 = lock used to synchronize the set of changes, 1 = lock used to wait for the transaction to finish to ensure commit order.
- pg_locks is **cluster-global** (all databases). Joining `relation` to pg_class.oid only works for relations in the current database (database = current DB OID or zero).
- Joins: `SELECT * FROM pg_locks pl LEFT JOIN pg_stat_activity psa ON pl.pid = psa.pid;` and for prepared transactions `SELECT * FROM pg_locks pl LEFT JOIN pg_prepared_xacts ppx ON pl.virtualtransaction = '-1/' || ppx.transaction;` (a prepared transaction can never be waiting for a lock, but continues to hold locks it acquired).
- **Who blocks whom**: self-joining pg_locks is "very difficult to get right" (needs lock conflict knowledge; view doesn't expose wait-queue order nor which processes are parallel workers for which sessions). Use **`pg_blocking_pids()`**.
- **Consistency**: view shows data from the regular lock manager and the **predicate lock manager** (separate systems); the regular manager further splits regular vs fast-path locks. Collection: (1) fast-path locks gathered from each backend one at a time without freezing the lock manager (these are known not to conflict with any other lock in place); (2) the remainder of the regular lock manager is locked as a unit, consistent snapshot taken atomically; (3) after unlocking, the predicate lock manager is similarly locked and all predicate locks collected atomically. So each manager is self-consistent (except fast-path) but the two are not consistent with each other. Frequent access may impact performance (locks held for minimum time needed).

### pg_prepared_statements  [M6, M4]  (source: view-pg-prepared-statements.txt)
- All prepared statements available in the **current session**; row added on creation, removed on release (e.g. DEALLOCATE). Read-only.
- Columns: `name text`; `statement text` (for SQL-created: the PREPARE statement submitted; for protocol-created: the text of the prepared statement itself); `prepare_time timestamptz`; `parameter_types regtype[]`; `result_types regtype[]` (null if no result, e.g. DML); `from_sql bool` (true = via PREPARE; false = via frontend/backend protocol); **`generic_plans int8`** (times a generic plan was chosen); **`custom_plans int8`** (times a custom plan was chosen).

### pg_prepared_xacts  [M5, M7]  (source: view-pg-prepared-xacts.txt)
- Transactions currently prepared for two-phase commit (PREPARE TRANSACTION); one row each; removed on commit/rollback.
- Columns: `transaction xid`; `gid text` (global transaction identifier assigned); `prepared timestamptz`; `owner name`; `database name`.
- On access the internal transaction manager data structures are momentarily locked and copied (consistent results; possible performance impact if accessed frequently).

### pg_publication_tables / pg_replication_origin_status  [M7]  (source: view-pg-publication-tables.txt, view-pg-replication-origin-status.txt)
- **pg_publication_tables**: unlike pg_publication_rel, **expands FOR ALL TABLES and FOR TABLES IN SCHEMA** (one row per eligible table). Columns: `pubname`, `schemaname`, `tablename`, `attnames name[]` (all columns when no column list), `rowfilter text`.
- **pg_replication_origin_status**: how far replay for an origin has progressed. `local_id oid` (roident), `external_id text` (roname), `remote_lsn pg_lsn` (origin node's LSN up to which data has been replicated), `local_lsn pg_lsn` (this node's LSN at which remote_lsn has been replicated; used to flush commit records before persisting data to disk when using asynchronous commits).

### pg_replication_slots  [M7]  (source: view-pg-replication-slots.txt)
- All replication slots existing on the cluster with current state. Columns (all 21):
  - `slot_name name`: unique, cluster-wide identifier.
  - `plugin name`: base name of the shared object containing the output plugin of this logical slot; null for physical slots.
  - `slot_type text`: `physical` or `logical`.
  - `datoid oid`, `database name`: associated database or null (**only logical slots have an associated database**).
  - `temporary bool`: temporary slots are not saved to disk and are automatically dropped on error or when the session finishes.
  - `active bool`: slot is currently being streamed. `active_pid int4`: session streaming data; NULL if inactive.
  - **`xmin xid`**: oldest transaction this slot needs the database to retain. **VACUUM cannot remove tuples deleted by any later transaction.**
  - **`catalog_xmin xid`**: oldest transaction affecting the system catalogs the slot needs retained; VACUUM cannot remove catalog tuples deleted by any later transaction.
  - **`restart_lsn pg_lsn`**: LSN of the oldest WAL which might still be required by the slot's consumer and thus won't be automatically removed during checkpoints **unless this LSN gets behind more than `max_slot_wal_keep_size` from the current LSN**. NULL if the LSN has never been reserved.
  - `confirmed_flush_lsn pg_lsn`: LSN up to which the logical slot's consumer has confirmed receiving data; data for transactions committed before this LSN is no longer available. NULL for physical slots.
  - **`wal_status text`**: `reserved` (claimed files within `max_wal_size`); `extended` (max_wal_size exceeded but files still retained, by the slot or by `wal_keep_size`); `unreserved` (slot no longer retains required WAL; some files are to be removed at the next checkpoint; typically when `max_slot_wal_keep_size` is non-negative; **can return to reserved or extended**); `lost` (slot no longer usable).
  - `safe_wal_size int8`: bytes that can be written to WAL such that the slot is not in danger of becoming "lost". NULL for lost slots and if `max_slot_wal_keep_size` is -1.
  - `two_phase bool`: enabled for decoding prepared transactions; always false for physical slots. `two_phase_at pg_lsn`: LSN from which decoding of prepared transactions is enabled; NULL when two_phase is false and for physical slots.
  - `inactive_since timestamptz`: when the slot became inactive; NULL if currently streamed. Never updated once the slot becomes invalid. For synced standby slots (`synced` true): time when slot synchronization was most recently stopped; NULL if always synchronized.
  - `conflicting bool`: logical slot conflicted with recovery (now invalidated); check invalidation_reason. Always NULL for physical slots.
  - **`invalidation_reason text`** (logical and physical; NULL if not invalidated): `wal_removed` (required WAL removed); `rows_removed` (required rows removed; logical only); `wal_level_insufficient` (primary's wal_level insufficient for logical decoding; logical only); `idle_timeout` (slot inactive longer than `idle_replication_slot_timeout`, PG18).
  - `failover bool`: logical slot enabled to be synced to standbys so logical replication can resume from the new primary after failover; always false for physical.
  - `synced bool`: logical slot was synced from a primary. On a hot standby synced slots can neither be used for logical decoding nor dropped manually. No meaning on the primary (default false; may be true if leftover from a promoted standby).

### Role views: pg_roles / pg_shadow / pg_user  [M1]  (source: view-pg-roles.txt, view-pg-shadow.txt, view-pg-user.txt)
- **pg_roles**: publicly readable view of pg_authid blanking the password. Columns: `rolname`, `rolsuper`, `rolinherit`, `rolcreaterole`, `rolcreatedb`, `rolcanlogin`, `rolreplication`, `rolconnlimit` (-1 no limit), `rolpassword` ("Not the password (always reads as ********)"), `rolvaliduntil`, `rolbypassrls`, `rolconfig text[]` (role-specific GUC defaults), `oid`.
- **pg_shadow**: backward compat (pre-8.1 catalog); all roles with rolcanlogin; not public (contains passwords). Columns: `usename`, `usesysid`, `usecreatedb`, `usesuper`, `userepl` (can initiate streaming replication and put the system in and out of backup mode), `usebypassrls`, `passwd` (encrypted password; null if none), `valuntil`, `useconfig text[]`.
- **pg_user**: public view of pg_shadow; same columns, `passwd` always `********`.

### pg_rules / pg_views / pg_tables / pg_sequences / pg_seclabels  [M6, M1]  (source: view-pg-rules.txt, view-pg-views.txt, view-pg-tables.txt, view-pg-sequences.txt, view-pg-seclabels.txt)
- **pg_rules**: `schemaname`, `tablename`, `rulename`, `definition` (reconstructed creation command). **Excludes the ON SELECT rules of views and materialized views** (see pg_views / pg_matviews).
- **pg_views**: `schemaname`, `viewname`, `viewowner`, `definition` (reconstructed SELECT query).
- **pg_tables**: `schemaname`, `tablename`, `tableowner`, `tablespace` (null if database default), `hasindexes` (relhasindex; has or recently had), `hasrules`, `hastriggers`, `rowsecurity`.
- **pg_sequences**: `schemaname`, `sequencename`, `sequenceowner`, `data_type regtype`, `start_value int8`, `min_value`, `max_value`, `increment_by`, `cycle bool`, `cache_size int8`, `last_value int8` (**last sequence value written to disk**; with caching can be greater than the last value handed out). last_value is null if: the sequence has not been read from yet; the current user lacks USAGE or SELECT privilege; or the sequence is unlogged and the server is a standby.
- **pg_seclabels**: `objoid`, `classoid`, `objsubid`, `objtype text`, `objnamespace oid` (NULL if n/a), `objname text`, `provider`, `label`.

### pg_settings  [M7, M1]  (source: view-pg-settings.txt)
- Alternative interface to SHOW and SET, plus facts not available from SHOW (min/max etc.).
- Columns (all 17): `name text`; `setting text` (current value); `unit text` (implicit unit); `category text` (logical group); `short_desc text`; `extra_desc text`; `context text` (see below); `vartype text` (`bool`, `enum`, `integer`, `real`, or `string`); `source text` (source of current value); `min_val text`, `max_val text` (null for non-numeric); `enumvals text[]` (null for non-enum); `boot_val text` (value assumed at server startup if not otherwise set); `reset_val text` (value RESET would restore in the current session); `sourcefile text` (config file where the value was set; null for other sources or when examined by a user who is neither superuser nor has `pg_read_all_settings`; useful with include directives); `sourceline int4`; `pending_restart bool` (true if the value has been changed in the configuration file but needs a restart).
- **`context` values, in order of decreasing difficulty of changing**:
  1. `internal`: cannot be changed directly; internally determined (some adjustable by rebuilding the server with different configure options or by initdb options).
  2. `postmaster`: only applied at server start; any change requires restart (postgresql.conf or command line).
  3. `sighup`: change in postgresql.conf without restart; send SIGHUP to the postmaster, which re-reads the file and forwards SIGHUP to its children.
  4. `superuser-backend`: change in postgresql.conf without restart; can also be set for a particular session in the connection request packet (e.g. libpq's `PGOPTIONS`), but only if the connecting user is a superuser or has been granted the appropriate SET privilege. **Never changes in a session after it is started**; SIGHUP-reloaded values only affect subsequently launched sessions.
  5. `backend`: same as superuser-backend but any user can set it in the connection packet; never changes after session start.
  6. `superuser`: postgresql.conf or SET within a session, but only superusers and users with the appropriate SET privilege can SET. postgresql.conf changes affect existing sessions only if no session-local value has been established with SET.
  7. `user`: postgresql.conf or SET by any user (session-local). Same rule for existing sessions.
- **Updatable** (not insertable/deletable): `UPDATE pg_settings SET setting = ... WHERE name = ...` is equivalent to `SET`; affects only the current session; rolled back if the transaction aborts; after commit persists until end of session unless overridden.
- Does not display customized options unless the defining extension module has been loaded by the backend executing the query (via shared_preload_libraries, a call to a C function of the extension, or LOAD). E.g. archive-module options are not shown, since archive modules are normally loaded only by the archiver process.

### pg_shmem_allocations / pg_shmem_allocations_numa  [M1]  (source: view-pg-shmem-allocations.txt, view-pg-shmem-allocations-numa.txt)
- **pg_shmem_allocations**: allocations made from the server's **main shared memory segment** (by PostgreSQL itself and by extensions). **Does not include dynamic shared memory (DSM)**. Readable by superusers / `pg_read_all_stats`.
  - Columns: `name text` (**NULL for unused memory**, `<anonymous>` for anonymous allocations); `off int8` (offset where the allocation starts; NULL for anonymous); `size int8` (bytes); `allocated_size int8` (bytes including padding; equals size for anonymous allocations and for free memory).
  - Anonymous allocations = made with `ShmemAlloc()` directly rather than via `ShmemInitStruct()` or `ShmemInitHash()`.
- **pg_shmem_allocations_numa** (PG18): how main-segment allocations are distributed across NUMA nodes; multiple rows per allocation if spread over nodes. Columns: `name text`, `numa_node int4`, `size int8` (bytes on that node). Does not show anonymous allocations; no DSM.
  - "Should not be queried by monitoring systems as it is very slow and may end up allocating shared memory in case it was not used earlier." Warning: determining the NUMA node touches all memory pages of the segment, forcing allocation, possibly all in a single NUMA node.

### pg_stats  [M4]  (source: view-pg-stats.txt)
- Public, readable presentation of pg_statistic; shows only rows for tables the user has permission to read. Schema must be extended whenever new slot types are defined.
- Columns (all 17):
  - `schemaname`, `tablename`, `attname`, `inherited bool` (includes child tables).
  - `null_frac float4`: fraction of entries that are null.
  - `avg_width int4`: average width in bytes.
  - **`n_distinct float4`**: > 0 = estimated number of distinct values; < 0 = negative of (distinct values / number of rows). Negated form is used when ANALYZE believes the number of distinct values is likely to increase as the table grows; positive form when the column seems to have a fixed number of possible values. **-1 = unique column**.
  - `most_common_vals anyarray`: most common values (null if no values seem more common than others).
  - `most_common_freqs float4[]`: frequencies = occurrences / total rows.
  - **`histogram_bounds anyarray`**: values dividing the column's values into groups of **approximately equal population**; **MCV values are omitted from the histogram calculation**. Null if the type has no `<` operator or if the MCV list accounts for the entire population.
  - **`correlation float4`**: statistical correlation between physical row ordering and logical ordering of column values; -1..+1. Near -1 or +1 => index scan estimated cheaper than near zero, "due to reduction of random access to the disk". Null if no `<` operator.
  - `most_common_elems anyarray`: non-null element values most often appearing within values of the column (null for scalar types).
  - `most_common_elem_freqs float4[]`: fraction of rows containing at least one instance of the element; followed by **two or three additional values**: the minimum and maximum of the preceding per-element frequencies, and optionally the frequency of null elements.
  - `elem_count_histogram float4[]`: histogram of the counts of distinct non-null element values within the column's values, followed by the average number of distinct non-null elements.
  - `range_length_histogram anyarray`: histogram of the lengths of non-empty, non-null range values (computed with the `subtype_diff` range function regardless of bound inclusivity). Null for non-range types.
  - `range_empty_frac float4`: fraction of entries that are empty ranges.
  - `range_bounds_histogram anyarray`: histograms of lower and upper bounds of non-empty non-null ranges, represented as a single array of ranges whose lower bounds are the lower-bound histogram and upper bounds the upper-bound histogram.
- Max entries in the array fields is controlled per column with `ALTER TABLE SET STATISTICS` or globally with `default_statistics_target`.

### pg_stats_ext / pg_stats_ext_exprs  [M4]  (source: view-pg-stats-ext.txt, view-pg-stats-ext-exprs.txt)
- Both combine pg_statistic_ext + pg_statistic_ext_data; show only tables the user **owns**; public.
- **pg_stats_ext**: `schemaname`, `tablename`, `statistics_schemaname`, `statistics_name`, `statistics_owner`, `attnames name[]`, `exprs text[]`, `kinds char[]`, `inherited bool`, `n_distinct pg_ndistinct` (per column combination; same sign convention; -1 = unique combination), `dependencies pg_dependencies` (functional dependency stats), `most_common_vals text[]` (most common **combinations**), `most_common_val_nulls bool[]` (NULL flags), `most_common_freqs float8[]`, `most_common_base_freqs float8[]` (**base frequencies = product of per-value frequencies**).
- **pg_stats_ext_exprs** (one row per expression in an extended statistics object): `schemaname`, `tablename`, `statistics_schemaname`, `statistics_name`, `statistics_owner`, `expr text`, `inherited`, `null_frac`, `avg_width`, `n_distinct`, `most_common_vals`, `most_common_freqs`, `histogram_bounds`, `correlation`, `most_common_elems`, `most_common_elem_freqs`, `elem_count_histogram` (same semantics as pg_stats).

### Time zone views, pg_user_mappings, pg_wait_events  [M2, M6, M1]  (source: view-pg-timezone-abbrevs.txt, view-pg-timezone-names.txt, view-pg-user-mappings.txt, view-pg-wait-events.txt)
- **pg_timezone_abbrevs**: abbreviations currently recognized by datetime input routines; contents change with `TimeZone` or `timezone_abbreviations`. `abbrev text`, `utc_offset interval` (positive = east of Greenwich), `is_dst bool`. Abbreviations whose value has varied historically are shown with their current meaning.
- **pg_timezone_names**: names recognized by SET TIMEZONE; many imply DST transition rules, so info is computed at the current value of CURRENT_TIMESTAMP. "Technically, PostgreSQL does not use UTC because leap seconds are not handled." `name`, `abbrev`, `utc_offset`, `is_dst` (currently observing DST).
- **pg_user_mappings**: `umid`, `srvid`, `srvname`, `umuser` (0 if public), `usename`, `umoptions text[]`. umoptions reads as null unless: current user is the mapped user and owns the server or has USAGE on it; or current user is the server owner and mapping is for PUBLIC; or current user is a superuser.
- **pg_wait_events**: `type text` (wait event type), `name text`, `description text`.

### Ch.54 — Protocol overview  [M6, M1]  (source: protocol.txt, protocol-overview.txt)
- Message-based protocol between frontends (clients) and backends (servers), over **TCP/IP and Unix-domain sockets**. **Port 5432** registered with IANA; any non-privileged port usable.
- Docs describe **version 3.2**, introduced in **PostgreSQL 18**. Server and libpq are backwards compatible with **3.0** (PostgreSQL 7.4 and later).
- The server launches a new "backend" process per client; a new child process is created immediately after an incoming connection is detected (transparent to the protocol). "backend" == "server", "frontend" == "client" for protocol purposes.
- **Phases**:
  - *Startup*: frontend opens connection and authenticates (one or several messages depending on auth method); then server sends status information and enters normal operation. Except for the initial startup-request message, this phase is **driven by the server**.
  - *Normal operation*: frontend sends queries/commands, backend returns results. A few cases (e.g. NOTIFY) produce unsolicited backend messages; mostly driven by frontend requests.
  - *Termination*: normally by frontend choice; can be forced by backend. **When the backend closes the connection it rolls back any open transaction before exiting.**
- Two sub-protocols for SQL: **simple query** (frontend sends a textual query string, parsed and immediately executed) and **extended query** (processing separated into parsing, binding of parameter values, execution; more flexible and performant, more complex). Additional sub-protocols for special operations such as COPY.
- **54.1.1 Messaging**: all communication is a stream of messages. **First byte = message type; next four bytes = length of the rest of the message (the length count includes itself but not the message-type byte).** For historical reasons the very first message sent by the client (**the startup message) has no initial message-type byte**.
  - Receivers typically read an entire message into a buffer (using the byte count) before processing, enabling easy recovery on error; in extreme situations (not enough memory) the byte count tells how much input to skip.
  - Senders must never send an incomplete message (marshal the whole message in a buffer first). On a communications failure mid-message the only sensible response is to abandon the connection.
- **54.1.2 Extended query overview**: state retained between steps = **prepared statements** and **portals**.
  - Prepared statement = result of parsing and semantic analysis of a textual query string; not itself ready to execute (may lack parameter values).
  - Portal = a ready-to-execute or already-partially-executed statement with missing parameter values filled in. For SELECT a portal is equivalent to an open cursor (different term because cursors don't handle non-SELECT statements).
  - Cycle: **parse** step (prepared statement from query string) -> **bind** step (portal from prepared statement + parameter values) -> **execute** step (runs the portal's query). For row-returning queries (SELECT, SHOW, etc.) execute can be told to fetch only a limited number of rows, so multiple execute steps may be needed.
  - Multiple prepared statements and portals can exist, **only within a session, never shared across sessions**; referenced by names. An **"unnamed" prepared statement and portal** also exist: operations on them are optimized for executing a query once and discarding it; named objects are optimized for multiple uses.
- **54.1.3 Formats**: only "text" and "binary" supported (as of 7.4). **Format code 0 = text, 1 = binary**; all others reserved. Clients can specify a format code per parameter value and per result column.
  - Text representation = whatever the type's I/O conversion functions produce/accept; **no trailing null character** in transmitted form (frontend must add one for C strings); text format does not allow embedded nulls.
  - Binary integers use **network byte order (most significant byte first)**. Binary representations of complex types may change across server versions; text is usually more portable.
- **54.1.4 Protocol versions**: current latest = 3.2, but **libpq still uses 3.0 by default** for compatibility with old servers and middleware that don't support version negotiation.
  - Startup message states requested version. Unsupported **major** version (e.g. 4.0) => connection rejected. Unsupported **minor** version (e.g. client requests 3.2, server supports only 3.0) => server may reject or respond with **NegotiateProtocolVersion** containing the highest minor version it supports; the client then continues with that version or aborts.
  - Negotiation was introduced in PostgreSQL **9.3.21**; earlier versions reject unsupported minor versions.
  - Table 54.1: **3.2** — PostgreSQL 18 and later; the secret key used in query cancellation was enlarged **from 4 bytes to a variable-length field**; BackendKeyData changed accordingly and CancelRequest redefined to have a variable-length payload. **3.1** — Reserved; never used by any PostgreSQL version; skipped because old versions of **pgbouncer** had a protocol negotiation bug that made it incorrectly claim support for 3.1. **3.0** — PostgreSQL 7.4 and later. **2.0** — up to PostgreSQL 13.

### 54.2.1 Start-up message flow  [M6, M1]  (source: protocol-flow.txt)
- Sub-protocols by connection state: start-up, query, function call, COPY, termination; plus asynchronous operations (notifications, cancellation) any time after start-up.
- Frontend opens connection and sends a **StartupMessage**: user name, database name, protocol version; optionally run-time parameter settings. Server uses this + config files (pg_hba.conf) to decide whether the connection is provisionally acceptable and what authentication is required.
- Server sends an authentication request; frontend replies. For all methods **except GSSAPI, SSPI and SASL** there is at most one request and one response (some methods need no response, so no request). GSSAPI/SSPI/SASL may need multiple exchanges. Cycle ends with **ErrorResponse** (rejected; server immediately closes) or **AuthenticationOk**.
- Server messages in the auth phase:
  - `AuthenticationOk` — exchange complete.
  - `AuthenticationKerberosV5` — **no longer supported**.
  - `AuthenticationCleartextPassword` — frontend sends PasswordMessage with clear-text password.
  - `AuthenticationMD5Password` — PasswordMessage = MD5 of (password+username), then MD5 again with the **4-byte random salt**; in SQL: `concat('md5', md5(concat(md5(concat(password, username)), random-salt)))`. MD5 deprecated, to be removed.
  - `AuthenticationGSS` / `AuthenticationSSPI` — frontend sends GSSResponse with first part of the data stream; server replies `AuthenticationGSSContinue` if more needed.
  - `AuthenticationGSSContinue` — response data from the previous GSS/SSPI step; frontend sends another GSSResponse if more data needed; else server sends AuthenticationOk or ErrorResponse.
  - `AuthenticationSASL` — lists SASL mechanisms; frontend sends **SASLInitialResponse** (chosen mechanism + first data). Server continues with `AuthenticationSASLContinue` (challenge; frontend answers with **SASLResponse**) and `AuthenticationSASLFinal` (completion with mechanism-specific data, only if the mechanism specifies server-to-client final data), then AuthenticationOk / ErrorResponse.
  - `NegotiateProtocolVersion` — server doesn't support the requested minor version but supports an earlier one (indicates highest supported minor version); also sent if the client requested unsupported **protocol options (names beginning with `_pq_.`)**. Auth then continues with the server's version; a client not supporting it should close immediately. Absence means the requested version and all options are supported.
- If the frontend doesn't support the requested auth method it should close the connection.
- After AuthenticationOk the frontend is "an interested bystander" while the backend process starts. Startup may still fail (ErrorResponse) or NegotiateProtocolVersion may arrive; normally the backend sends some **ParameterStatus** messages, **BackendKeyData**, then **ReadyForQuery**. Startup-packet run-time parameters are applied and become session defaults; an error causes ErrorResponse and exit.
  - `BackendKeyData`: secret-key data the frontend must save to issue cancel requests later; no response. PostgreSQL always sends it; some third-party backend implementations that don't support cancellation don't.
  - `ParameterStatus`: current (initial) setting of parameters such as client_encoding, DateStyle; no response.
  - `ReadyForQuery`: start-up complete. `ErrorResponse`: start-up failed, connection closed. `NoticeResponse`: warning; keep listening.
- ReadyForQuery is the same message sent after each command cycle; may be treated as starting a cycle or as ending the previous one.

### 54.2.2 Simple Query  [M6, M3, M5]  (source: protocol-flow.txt)
- Frontend sends **Query** (one or more SQL commands as text). Backend sends response messages then **ReadyForQuery** (frontend need not wait for it before sending another command, but then must handle earlier failures itself).
- Possible responses: `CommandComplete` (one SQL command completed), `CopyInResponse`, `CopyOutResponse`, `RowDescription` (column layout, followed by a DataRow per row), `DataRow`, `EmptyQueryResponse`, `ErrorResponse`, `ReadyForQuery` (whole string processed; **always** sent whether success or error; CommandComplete marks one command, not the whole string), `NoticeResponse`.
- SELECT (and EXPLAIN, SHOW) => RowDescription, zero or more DataRow, CommandComplete. COPY => special sub-protocol. Others => only CommandComplete.
- Completely empty string (only whitespace) => EmptyQueryResponse + ReadyForQuery.
- Error => ErrorResponse + ReadyForQuery; **all further processing of the string is aborted** (may occur partway through a single query's message sequence).
- Simple Query result format is always **text**, except FETCH from a cursor declared BINARY. RowDescription format codes tell which.
- Frontends must accept ErrorResponse and NoticeResponse whenever expecting any other message; recommended **state-machine style** coding rather than assuming exact sequences.
- **54.2.2.1 Multiple statements in one Query** run as a **single implicit transaction** unless explicit transaction control is included:
  - `INSERT 1; SELECT 1/0; INSERT 2;` => divide-by-zero rolls back the first INSERT; the second INSERT is never attempted.
  - `BEGIN; INSERT 1; COMMIT; INSERT 2; SELECT 1/0;` => first INSERT committed; second INSERT rolled back.
  - Implicit transaction block is closed automatically at the end of the Query message (implicit commit if no error, rollback if error).
  - If already in a transaction block (BEGIN in a previous message), the Query continues it. A COMMIT/ROLLBACK closing that block makes following statements run in a new implicit block. A BEGIN inside a multi-statement Query starts a regular block terminated only by explicit COMMIT/ROLLBACK; statements before it in the implicit block are **retroactively included** in the new regular block.
  - COMMIT/ROLLBACK inside an implicit block closes it normally but issues a **warning** (no previous BEGIN). New implicit block for further statements.
  - **Savepoints are not allowed in an implicit transaction block.**
  - Execution stops at first error regardless: `BEGIN; SELECT 1/0; ROLLBACK;` leaves the session in a **failed regular transaction block** (ROLLBACK never reached); another ROLLBACK is needed.
  - **Lexical and syntactic analysis is done on the entire string before any execution**: a typo (`SELCT`) in a later statement prevents all statements from running (so the first committed INSERT in the example is not committed). Errors detected at semantic analysis or later (misspelled table/column) do not have this effect.
  - All statements see the same `statement_timestamp()` (updated only on receipt of the Query message), hence the same `transaction_timestamp()` too, except when the string ends one transaction and begins another.

### 54.2.3 Extended Query  [M6, M4]  (source: protocol-flow.txt)
- **Parse**: query string, optional parameter type OIDs, destination prepared statement name (empty = unnamed). Response ParseComplete or ErrorResponse. Untyped parameters are inferred like untyped literal string constants.
  - A type is unspecified if set to 0 or the OID array is shorter than the number of `$n` symbols. Type `void` lets a `$n` stand for an OUT parameter (effectively ignored): `foo($1,$2,$3,$4)` can match a function with two IN and two OUT args if $3,$4 are void; pass NULL for them in Bind.
  - **Parse query string cannot contain more than one SQL statement** (syntax error) — unlike simple Query.
  - Named prepared statement lasts until end of session unless destroyed; **unnamed** lasts until the next Parse targeting the unnamed statement (a simple Query also destroys it). Named statements must be Closed before redefinition; not required for unnamed. SQL-level equivalents: PREPARE/EXECUTE.
- **Bind**: source prepared statement name, destination portal name (empty = unnamed), parameter values, result format codes (overall or per column). Response BindComplete or ErrorResponse. Text vs binary output is determined by Bind format codes regardless of the command; the cursor BINARY attribute is irrelevant here.
  - **Query planning typically occurs when Bind is processed.** If the statement has no parameters or is executed repeatedly, the server may save the plan and re-use it — only if a **generic plan** is not much less efficient than a parameter-specific (custom) plan. Transparent to the protocol.
  - Named portal lasts until **end of the current transaction**; unnamed portal destroyed at end of transaction or at the next Bind targeting it (or a simple Query). Named portals must be Closed before redefinition. SQL-level: DECLARE CURSOR / FETCH.
- **Execute**: portal name + maximum result-row count (**0 = fetch all**). Row count only meaningful for row-returning commands. Responses as in simple query except Execute **does not cause ReadyForQuery or RowDescription**. If stopped by a nonzero row limit => **PortalSuspended** (issue another Execute). CommandComplete only after the portal finishes. An Execute phase ends with exactly one of: CommandComplete, EmptyQueryResponse, ErrorResponse, PortalSuspended.
- **Sync**: at the end of each series. Closes the current transaction if not inside BEGIN/COMMIT (commit if no error, rollback if error), then ReadyForQuery. Resynchronization point: on error in any extended-query message the backend sends ErrorResponse, then **reads and discards messages until Sync**, then ReadyForQuery. No skipping if the error is in processing Sync itself (exactly one ReadyForQuery per Sync). Sync does not close a BEGIN block (detectable via ReadyForQuery's status).
- **Describe** (portal variant): RowDescription, or **NoData** if no rows, or ErrorResponse. (statement variant): **ParameterDescription** then RowDescription (or NoData); format code fields are zeros since Bind hasn't happened. Tip: issue one Describe variant before Execute.
- **Close**: closes statement or portal; not an error on nonexistent names; response CloseComplete. Closing a prepared statement implicitly closes portals built from it.
- **Flush**: no output of its own; forces delivery of pending output. Needed after any extended-query command except Sync if the frontend wants results before sending more; otherwise backend packs responses into the minimum number of packets.
- Simple Query ≈ Parse, Bind, portal Describe, Execute, Close, Sync with unnamed objects and no parameters, except it accepts multiple statements and does not return ParseComplete, BindComplete, CloseComplete, or NoData.

### 54.2.4 Pipelining  [M6]  (source: protocol-flow.txt)
- Extended protocol allows sending a series of queries without waiting for earlier ones (fewer round trips). Must plan failure behaviour since later queries are already in flight.
- Options: wrap the series in BEGIN...COMMIT; or **omit Sync between dependent steps** — after an error the backend skips messages until Sync, so dependent later commands are auto-skipped. Independently-committable segments are separated by Syncs.
- Without explicit BEGIN an implicit transaction block starts, and each Sync ordinarily causes an implicit COMMIT (success) or ROLLBACK (failure). The implicit block is only detected by the server when the first command ends without a sync.
- Commands that can't run in a transaction block (e.g. **CREATE DATABASE**) fail in a pipeline unless they are the **first command after a Sync**; on success they force an immediate commit, so a following Sync just yields ReadyForQuery.
- **Pipeline completion: count ReadyForQuery messages until equal to Syncs sent**; counting command completions is unreliable (skipped commands produce none).

### 54.2.5 Function Call  [M6]  (source: protocol-flow.txt)
- Direct call of any pg_proc function (needs EXECUTE permission). **Legacy; best avoided** — use a prepared `SELECT function($1, ...)` with Bind/Execute.
- FunctionCall -> ErrorResponse | FunctionCallResponse (single scalar result only; no row type or set) | NoticeResponse, then always ReadyForQuery.

### 54.2.6 COPY sub-protocols  [M6, M7]  (source: protocol-flow.txt)
- **Copy-in** (COPY FROM STDIN): backend sends **CopyInResponse**; frontend sends zero or more **CopyData** (boundaries need not match rows), terminates with **CopyDone** (success) or **CopyFail** (COPY fails with error). Backend reverts to previous mode (simple or extended), sends CommandComplete or ErrorResponse.
  - On backend-detected error (incl. CopyFail): ErrorResponse; if issued via extended query, discard frontend messages until Sync then ReadyForQuery; if via simple Query, rest of the message discarded and ReadyForQuery issued. Later CopyData/CopyDone/CopyFail are dropped.
  - Backend **ignores Flush and Sync during copy-in** (convenience for libraries that always send them after Execute); any other non-copy message aborts copy-in.
- **Copy-out** (COPY TO STDOUT): **CopyOutResponse**, zero or more CopyData (**always one per row**), CopyDone, then CommandComplete. Frontend cannot abort (except closing the connection or a Cancel) but may discard. On error: ErrorResponse terminates copy-out. NoticeResponse and ParameterStatus may be interspersed; other non-CopyData/CopyDone messages may be treated as terminating.
- **Copy-both**: initiated when a backend in **walsender mode** executes **START_REPLICATION**; backend sends **CopyBothResponse**; both sides send CopyData until either sends CopyDone. Client CopyDone => connection goes copy-both -> copy-out (client may not send more CopyData); server CopyDone => copy-in. After both CopyDones, back to command mode. On backend error: ErrorResponse, discard until Sync, ReadyForQuery; frontend treats ErrorResponse as terminating both directions and sends no CopyDone.
- Copy*Response messages carry number of columns and per-column format codes (currently all columns of a COPY use the same format, but the design doesn't assume it).

### 54.2.7 Asynchronous operations  [M6]  (source: protocol-flow.txt)
- Frontends must handle unprompted messages at any time, even when idle (check before reading a query response).
- NoticeResponse from outside activity, e.g. a "fast" shutdown notice before closing.
- **ParameterStatus** whenever the active value of a reported parameter changes: usually after SET (effectively synchronous), but also after a config change + SIGHUP; also generated if a SET is rolled back. **Hard-wired reported set (15)**: `application_name`, `client_encoding`, `DateStyle`, `default_transaction_read_only`, `in_hot_standby`, `integer_datetimes`, `IntervalStyle`, `is_superuser`, `scram_iterations`, `search_path`, `server_encoding`, `server_version`, `session_authorization`, `standard_conforming_strings`, `TimeZone`. (default_transaction_read_only and in_hot_standby since 14; scram_iterations since 16; **search_path since 18**.) server_version, server_encoding, integer_datetimes are pseudo-parameters that can't change after startup. Frontends should ignore unknown ones.
- LISTEN => **NotificationResponse** (not NoticeResponse!) whenever NOTIFY runs on that channel. Currently only sent outside a transaction (may occur just before ReadyForQuery), but frontends should accept it anywhere.

### 54.2.8 Cancel  [M6, M1]  (source: protocol-flow.txt)
- Not sent on the open connection (backend would have to keep checking for input). Frontend **opens a new connection and sends CancelRequest** instead of StartupMessage; server processes it and closes the connection; **no direct reply** (security).
- Ignored unless it contains the same key data (**PID and secret key**) from BackendKeyData. If it matches a currently executing backend, the current query is aborted (implemented by sending a **special signal** to the backend process).
- May have no effect (e.g. query already finished); if effective, command ends early with an error. Frontend cannot tell directly whether cancel succeeded; must keep waiting.
- Any process can send it (flexibility for multi-process apps; security risk addressed by the dynamically generated secret key).

### 54.2.9 Termination  [M6, M5]  (source: protocol-flow.txt)
- Graceful: frontend sends **Terminate** and immediately closes; backend closes and terminates.
- Backend-initiated (e.g. admin shutdown): backend tries to send an error/notice with the reason first.
- Unexpected closure on either side => clean up and terminate; frontend may reconnect. Close the connection on an unrecognizable message type (likely lost sync).
- **Any open transaction is rolled back, not committed.** But if the frontend disconnects during a non-SELECT query, the backend will probably finish it before noticing; outside a transaction block its results might be committed.

### 54.2.10 SSL session encryption  [M6, M1]  (source: protocol-flow.txt)
- Frontend sends **SSLRequest** instead of StartupMessage; server replies with a single byte **`S`** (willing) or **`N`** (unwilling). After S: SSL handshake, then StartupMessage and everything after encrypted. After N: plain StartupMessage, or try **GSSENCRequest** instead.
- Server may respond with an error message to SSLRequest: frontend **must not display it** (server not authenticated; **CVE-2024-10977**); close and optionally reconnect without SSL.
- After `S` the server sends only that byte; extra readable bytes suggest a MITM **buffer-stuffing attack (CVE-2021-23222)**: read exactly one byte before handing the socket to the SSL library, or treat extra bytes as a protocol violation.
- Client starting SSL negotiation without waiting for the response saves a round trip but can't handle a negative response (server just disconnects).
- SSLRequest can also precede a CancelRequest.
- **Direct SSL** (alternate): server recognizes connections that immediately begin SSL negotiation without SSLRequest; then expects a normal startup packet over the encrypted channel; other encryption requests refused. Not preferred for general tools (can't negotiate best encryption or handle unencrypted), useful when client and server are controlled together (saves one round trip, works with standard SSL network tools). Client **must use ALPN (RFC 7301)**; protocol id **`postgresql`** (IANA TLS ALPN registry).
- Protocol cannot force SSL; admin can reject unencrypted sessions through authentication configuration.

### 54.2.11 GSSAPI session encryption  [M6]  (source: protocol-flow.txt)
- Frontend sends **GSSENCRequest**; server replies single byte **`G`** or **`N`**. After G: call `gss_init_sec_context()` in a loop (RFC 2744), sending each result prefixed with a **four-byte network-order length**, starting with empty input, until no output. After N: plain StartupMessage, or try SSLRequest.
- Same rules as SSL: don't display error responses (CVE-2024-10977); read exactly one byte (CVE-2021-23222); can precede CancelRequest.
- After establishment, `gss_wrap()` encrypts StartupMessage and all subsequent data, each packet prefixed by 4-byte length. **Server only accepts encrypted packets < 16kB**; use `gss_wrap_size_limit()`; typical segments are **8kB** unencrypted. Server won't send packets > 16kB.

### 54.3 SASL authentication  [M6, M1]  (source: sasl-authentication.txt)
- PostgreSQL implements three SASL mechanisms: **SCRAM-SHA-256, SCRAM-SHA-256-PLUS, OAUTHBEARER**.
- Generic flow: (1) server sends **AuthenticationSASL** with mechanisms in the server's preferred order; (2) client sends **SASLInitialResponse** with chosen mechanism + optional Initial Client Response; (3) one or more **AuthenticationSASLContinue** (server challenge) / **SASLResponse** (client response) pairs; (4) on success optional **AuthenticationSASLFinal** (mechanism-specific server data; omitted if the mechanism has none) immediately followed by **AuthenticationOk**. Server may abort at any stage with an error.
- **SCRAM-SHA-256** (RFC 7677, RFC 5802):
  - Server **ignores the user name in client-first-message**; uses the one from the startup message (PG user names may not be representable in UTF-8 as SCRAM requires).
  - Password: SCRAM wants UTF-8 + **SASLprep**. PG processes the password with SASLprep as if UTF-8 regardless of encoding; if not legal UTF-8 or contains prohibited sequences, the **raw password is used without SASLprep** instead of erroring.
  - Channel binding requires SSL build; mechanism **SCRAM-SHA-256-PLUS**; binding type **`tls-server-end-point`**. Without binding, the server's random nonce prevents replay but not a MITM relaying the nonce; with binding, the server certificate's signature is mixed into the hash, so a fake server (lacking the private key) fails.
  - Exchange: AuthenticationSASL (SCRAM-SHA-256-PLUS and SCRAM-SHA-256 if SSL-capable, else only the latter) -> SASLInitialResponse (client-first-message, including chosen channel binding type; client should prefer -PLUS) -> AuthenticationSASLContinue (server-first-message) -> SASLResponse (client-final-message) -> AuthenticationSASLFinal (server-final-message) -> AuthenticationOk.
- **OAUTHBEARER** (RFC 7628; new in PG18): token-based federated auth; client-initiated. Client initial response = standard SCRAM "GS2" header + key=value pairs; only key supported is **`auth`** (bearer token); authzid, `host`, `port` are ignored.
  - Token grants access like a clear-text password => **use only over SSL**. No channel binding, no "OAUTHBEARER-PLUS". AuthenticationSASLFinal is not used.
  - Without a cached token: **two connections**. Discovery: AuthenticationSASL(OAUTHBEARER) -> SASLInitialResponse with empty auth -> AuthenticationSASLContinue with error status + well-known URI + scopes -> client SASLResponse with the empty set (single **0x01** byte) -> server error fails the exchange. Client runs an OAuth flow (unspecified), reconnects: AuthenticationSASL -> SASLInitialResponse with auth = token -> server validates per the token provider -> AuthenticationOk. libpq has no built-in caching, so it always uses the two-connection exchange.

### 54.5 Logical streaming replication protocol (pgoutput)  [M7]  (source: protocol-logical-replication.txt)
- Message flow started by `START_REPLICATION SLOT slot_name LOGICAL`; built on physical streaming replication primitives. **pgoutput** is the standard output plugin for built-in logical replication.
- pgoutput options:
  - `proto_version` (required): 1, 2, 3, 4. **v2** (server 14+): streaming of large in-progress transactions. **v3** (15+): streaming of two-phase commits. **v4** (16+): streams of large in-progress transactions applied in parallel.
  - `publication_names` (required, at least one): comma-separated, quotable.
  - `binary` (bool): binary transfer — faster but slightly less robust.
  - `messages` (bool): send messages written by `pg_logical_emit_message`.
  - `streaming`: `off` (default), `on`, `parallel` (sends extra info for parallelization). on requires proto v2; parallel requires v4.
  - `two_phase` (bool): requires proto v3.
  - `origin`: `none` (only changes without an origin) or `any`; avoids replication loops.
- Messages: every top-level message begins with a type byte (signed byte, no encoding); no embedded length (the streaming protocol supplies it).
- Flow: except START_REPLICATION and replay progress messages, information flows only backend -> frontend. Transactions sent one at a time: messages between **Begin/Commit** belong to one transaction; likewise **Begin Prepare/Prepare**; large in-progress transactions are sent in chunks between **Stream Start/Stream Stop**, the last stream containing **Stream Commit** or **Stream Abort**.
  - Each transaction: zero or more DML messages (Insert, Update, Delete); in cascaded setups also **Origin** messages (always before any DML in the transaction; only identifier is the origin name).
  - Every DML message contains a relation OID. A **Relation** message describing the schema is sent before the first DML for that OID, and again whenever the definition changed. Client must cache this metadata.
  - Relation messages identify column types by OID. For non-built-in types a **Type** message (type name for the OID) is sent before the Relation message; clients should cache Type messages and fall back to local lookup.

### 54.6 Message data types  [M6]  (source: protocol-message-types.txt)
- `Intn(i)`: n-bit integer in **network byte order**; if i given, exact value (e.g. `Int16`, `Int32(42)`).
- `Intn[k]`: array of k n-bit integers; k determined by an earlier field (e.g. `Int16[M]`).
- `String(s)`: null-terminated C string; no specific length limitation (e.g. `String("user")`). Frontends should use an expandable buffer, or read the full string and discard what doesn't fit.
- `Byten(c)`: exactly n bytes; n determinable from an earlier field if not constant (e.g. `Byte2`, `Byte1('\n')`).

### 54.4 Streaming replication protocol  [M7]  (source: protocol-replication.txt)
- Start: frontend sends the `replication` parameter in the startup message. `true` (or on, yes, 1) => **physical replication walsender mode** (only replication commands accepted instead of SQL). `database` => **logical replication walsender mode**, connected to `dbname`; replication commands **and normal SQL** accepted. In either mode **only the simple query protocol** can be used.
- Testing: `psql "dbname=postgres replication=database" -c "IDENTIFY_SYSTEM;"`; more usefully pg_receivewal / pg_recvlogical. Commands are logged when `log_replication_commands` is on. Boolean option values may be omitted (= TRUE).
- **Commands**:
  - `IDENTIFY_SYSTEM` -> one row: `systemid text` (unique cluster identifier; check that the base backup came from the same cluster), `timeline int8` (current TLI), `xlogpos text` (current WAL flush location), `dbname text` (or null).
  - `SHOW name` -> current setting of a run-time parameter (like SQL SHOW).
  - `TIMELINE_HISTORY tli` -> one row: `filename` (e.g. `00000002.history`), `content` (labelled text but raw bytes, no encoding conversion).
  - `CREATE_REPLICATION_SLOT slot_name [ TEMPORARY ] { PHYSICAL | LOGICAL output_plugin } [ ( option [, ...] ) ]`. TEMPORARY: not saved to disk, dropped on error or session end. Options: `TWO_PHASE [bool]` (logical; decode PREPARE TRANSACTION / COMMIT PREPARED / ROLLBACK PREPARED, transaction decoded at PREPARE time; default false); `RESERVE_WAL [bool]` (physical; reserve WAL immediately instead of at first streaming client connection; default false); `SNAPSHOT { 'export' | 'use' | 'nothing' }` (logical slot init snapshot: **export** (default) for other sessions, not usable inside a transaction; **use** for the current transaction — must be in a transaction and be its first command; **nothing**); `FAILOVER [bool]` (sync slot to standbys; default false). Result row: `slot_name`, `consistent_point` (WAL location where slot became consistent = earliest streaming start), `snapshot_name` (valid until next command on this connection or close; null for physical), `output_plugin` (null for physical). Legacy syntax: `... { PHYSICAL [ RESERVE_WAL ] | LOGICAL output_plugin [ EXPORT_SNAPSHOT | NOEXPORT_SNAPSHOT | USE_SNAPSHOT | TWO_PHASE ] }`.
  - `ALTER_REPLICATION_SLOT slot_name ( option [, ...] )` — logical slots only; options `TWO_PHASE`, `FAILOVER`.
  - `READ_REPLICATION_SLOT slot_name` — physical slots only; returns NULLs if missing; row: `slot_type` (physical or NULL), `restart_lsn`, `restart_tli int8`.
  - `START_REPLICATION [ SLOT slot_name ] [ PHYSICAL ] XXX/XXX [ TIMELINE tli ]` — stream WAL from XXX/XXX on timeline tli (default current). Error if e.g. WAL already recycled. Success => **CopyBothResponse** then WAL streaming. With a slot, the slot is updated as replication progresses (which WAL segments, and if `hot_standby_feedback` is on which transactions, are still needed).
    - Requesting a historic timeline: server streams that timeline from the start point up to the switch point; if requested exactly at the end of an old timeline, COPY mode is skipped. After streaming a non-latest timeline the server exits COPY mode; when the client also exits, server sends a one-row result: next timeline ID (int8) and switch WAL location (text) (usually the end of streamed WAL; corner cases may include WAL from the old timeline not replayed before promotion). Then **two CommandComplete** messages (one ends the CopyData, one ends START_REPLICATION).
    - WAL sent as CopyData messages (server may intermix ErrorResponse).
  - `START_REPLICATION SLOT slot_name LOGICAL XXX/XXX [ ( option_name [ option_value ] [, ...] ) ]` — starts at the **greater of XXX/XXX and the slot's confirmed_flush_lsn** (so clients needn't update their LSN when idle; but may hide client errors — check confirmed_flush_lsn first). SLOT required (existing logical slot). Same CopyBoth message formats incl. two CommandComplete. Options are passed to the slot's output plugin (pgoutput options in 54.5).
  - `DROP_REPLICATION_SLOT slot_name [ WAIT ]` — WAIT waits for an active slot to become inactive instead of erroring.
  - `UPLOAD_MANIFEST` — upload a backup manifest in preparation for an **incremental backup**.
  - `BASE_BACKUP [ ( option [, ...] ) ]` — server enters backup mode automatically before and leaves after. Options:
    - `LABEL 'label'` (default `base backup`; standard_conforming_strings quoting).
    - `TARGET 'target'`: `client` (default), `server` (write to path in TARGET_DETAIL; needs superuser or `pg_write_server_files`), `blackhole` (discard). `TARGET_DETAIL 'detail'` (server directory; only with server target).
    - `PROGRESS [bool]` (approximate size per tablespace header; enumerates file sizes first, may delay first data; incremental: counted at archive size; default false).
    - `CHECKPOINT { 'fast' | 'spread' }` (default **spread**).
    - `WAL [bool]` (include WAL between start and stop in pg_wal of base tar; default false).
    - `WAIT [bool]` (wait until last required WAL segment archived, or warn if archiving disabled; default **true**).
    - `COMPRESSION 'method'`: `gzip`, `lz4`, `zstd`. `COMPRESSION_DETAIL detail`: integer level or list of `level`, `long`, `workers`. Levels: gzip 1-9 (default Z_DEFAULT_COMPRESSION / -1); lz4 1-12 (default 0 fast mode); zstd ZSTD_minCLevel() (usually -131072) to ZSTD_maxCLevel() (usually 22), default 3. `long` (long-distance matching) and `workers` (parallel threads) are zstd only.
    - `MAX_RATE rate` (kB/s; 0 or 32 kB..1 GB inclusive; 0/absent = unlimited).
    - `TABLESPACE_MAP [bool]` (write `tablespace_map` file of pg_tblspc symlinks; default false).
    - `VERIFY_CHECKSUMS [bool]` (default true, if checksums enabled).
    - `MANIFEST manifest_option` (`yes` or `force-encode` (hex-encode all filenames; testing); default `'no'` for compatibility). Manifest lists every file except included WAL, with size, mtime, optional checksum.
    - `MANIFEST_CHECKSUMS algorithm`: NONE, CRC32C (default), SHA224, SHA256, SHA384, SHA512.
    - `INCREMENTAL` (requires a prior UPLOAD_MANIFEST).
    - Response: result set 1 = start position (XLogRecPtr) + timeline ID; result set 2 = one row per tablespace: `spcoid` (null for base dir), `spclocation` (null for base), `size int8` (kB, if PROGRESS; measured before server-side compression). Then CopyOutResponse with CopyData payloads: `'n'` new archive (String filename, String path or empty for main dir; tar "ustar" POSIX 1003.1-2008, one per main dir + each tablespace), `'m'` manifest start, `'d'` archive/manifest data (Byten), `'p'` progress report (Int64 cumulative bytes before compression). Finally a result set with the WAL end position.
    - **Excluded files**: `postmaster.pid`, `postmaster.opts`, `pg_internal.init` (multiple dirs), temp files/dirs (e.g. starting with `pgsql_tmp`, temporary relations), **unlogged relations except the init fork**, `pg_wal` (a synthesized minimal pg_wal if WAL included). `pg_dynshmem`, `pg_notify`, `pg_replslot`, `pg_serial`, `pg_snapshots`, `pg_stat_tmp`, `pg_subtrans` copied as **empty directories**. Non-regular files skipped (pg_tblspc symlinks maintained). Owner/group/mode set if supported.
- **CopyData payload messages** (B = backend->frontend, F = frontend->backend); timestamps are **microseconds since midnight 2000-01-01**:
  - **XLogData (B)** `'w'`: Int64 start of WAL data in this message; Int64 current end of WAL on server; Int64 server clock; Byten WAL data. **A single WAL record is never split across two XLogData messages**, except at a WAL page boundary where it is already split into continuation records.
  - **Primary keepalive (B)** `'k'`: Int64 current end of WAL; Int64 server clock; Byte1 reply-requested (1 = reply ASAP to avoid timeout disconnect).
  - **Standby status update (F)** `'r'`: Int64 last WAL byte+1 **written**; Int64 last byte+1 **flushed**; Int64 last byte+1 **applied**; Int64 client clock; Byte1 (1 = request immediate reply; ping).
  - **Hot standby feedback (F)** `'h'`: Int64 client clock; Int32 standby global xmin (excluding slot catalog_xmin); Int32 xmin epoch; Int32 lowest catalog_xmin of standby slots (0 if none or disabling); Int32 catalog_xmin epoch. Both xmin and catalog_xmin 0 => feedback will no longer be sent (later non-zero messages may restart it).

### 54.7 Message formats (byte level)  [M6]  (source: protocol-message-formats.txt)
- Each message marked F (frontend), B (backend), or F & B. Although each message carries a byte count, most are defined so the end can be found without it (historical: protocol 2 had no length field; also aids validity checking).
- Notation: `Byte1('X')` type byte, then `Int32` length including itself. Fixed lengths shown as `Int32(n)`.
- **Authentication family** (all `'R'`): AuthenticationOk `Int32(8)` + `Int32(0)`; KerberosV5 `Int32(2)`; CleartextPassword `Int32(3)`; MD5Password length 12, `Int32(5)` + `Byte4` salt; GSS `Int32(7)`; GSSContinue `Int32(8)` + Byten data; SSPI `Int32(9)`; SASL `Int32(10)` + list of mechanism Strings terminated by a zero byte; SASLContinue `Int32(11)` + Byten; SASLFinal `Int32(12)` + Byten.
- **BackendKeyData** `'K'`: Int32 length, Int32 backend **PID**, Byten **secret key** to end of message. **Key length min 4, max 256 bytes; PostgreSQL server sends keys up to 32 bytes**; larger maximum leaves room for future servers and middleware/poolers (which may wrap/augment the key; middleware encouraged not to use all bytes so layers can stack). **Before 3.2 the key was always 4 bytes.**
- **Bind** `'B'`: String portal name; String statement name; Int16 C = number of parameter format codes (0 = all text / no params; 1 = applies to all; or = number of params); Int16[C]; Int16 number of parameter values (must match); per param Int32 length (**-1 = NULL**, no bytes follow) + Byten; Int16 R result-format count (same 0/1/N rule); Int16[R].
- **BindComplete** `'2'` Int32(4). **CloseComplete** `'3'` Int32(4). **ParseComplete** `'1'` Int32(4). **NoData** `'n'` Int32(4). **PortalSuspended** `'s'` Int32(4) (only when Execute row limit reached). **EmptyQueryResponse** `'I'` Int32(4) (substitutes for CommandComplete). **Sync** `'S'` Int32(4). **Flush** `'H'` Int32(4). **Terminate** `'X'` Int32(4). **CopyDone** `'c'` Int32(4).
- **CancelRequest** (no type byte): Int32 length; **Int32(80877102)** (1234 in high 16 bits, **5678** in low 16 bits; must differ from any protocol version); Int32 target PID; Byten secret key (max 256 bytes; 4 bytes before 3.2).
- **SSLRequest** (no type byte): Int32(8), **Int32(80877103)** (1234/**5679**). **GSSENCRequest**: Int32(8), **Int32(80877104)** (1234/**5680**).
- **StartupMessage** (no type byte): Int32 length; **Int32(196610)** = protocol version (high 16 bits major = 3, low 16 bits minor = 2; i.e. 3<<16 | 2); then name/value String pairs terminated by a zero byte. Recognized names: `user` (**required, no default**), `database` (defaults to the user name), `options` (backend command-line args; deprecated; spaces separate args unless backslash-escaped, `\\` = literal backslash), `replication` (`true`, `false`, `database`; default false). Names beginning with **`_pq_.`** are reserved for protocol extensions; others are run-time parameters applied at backend start (after command-line args) as session defaults.
- **Close** `'C'` (F): Byte1 `'S'` statement or `'P'` portal; String name. **Describe** `'D'` (F): Byte1 `'S'`/`'P'`; String name.
- **CommandComplete** `'C'` (B): String command tag. Tags: `INSERT oid rows` (**oid always 0** now that OID system columns are unsupported), `DELETE rows`, `UPDATE rows`, `MERGE rows` (inserted+updated+deleted), `SELECT rows` (also for CREATE TABLE AS), `MOVE rows`, `FETCH rows`, `COPY rows` (count since 8.2). Usually a single word otherwise.
- **CopyData** `'d'` (F & B): Byten; backend messages always correspond to single rows, frontend may divide arbitrarily. **CopyFail** `'f'` (F): String error message.
- **CopyInResponse** `'G'`, **CopyOutResponse** `'H'`, **CopyBothResponse** `'W'` (only streaming replication): Int8 overall format (0 textual, 1 binary); Int16 N columns; Int16[N] per-column format codes (all 0 if textual).
- **DataRow** `'D'` (B): Int16 number of columns; per column Int32 length (-1 = NULL) + Byten.
- **ErrorResponse** `'E'` / **NoticeResponse** `'N'`: one or more fields, each Byte1 field code + String value, terminated by a zero byte; fields in any order; unknown codes must be silently ignored.
- **Execute** `'E'` (F): String portal; Int32 max rows (0 = no limit).
- **FunctionCall** `'F'`: Int32 function OID; Int16 C arg format codes; Int16[C]; Int16 arg count; per arg Int32 length (-1 NULL) + Byten; Int16 result format code. **FunctionCallResponse** `'V'`: Int32 length (-1 NULL) + Byten.
- **GSSResponse**, **PasswordMessage**, **SASLInitialResponse**, **SASLResponse** all use `'p'` (type deduced from context). PasswordMessage: String password. SASLInitialResponse: String mechanism; Int32 length of Initial Client Response (-1 if none); Byten. SASLResponse/GSSResponse: Byten.
- **NegotiateProtocolVersion** `'v'`: Int32 newest minor version supported for the requested major; Int32 number of unrecognized protocol options; String per unrecognized option name.
- **NotificationResponse** `'A'`: Int32 notifying backend PID; String channel; String payload.
- **ParameterDescription** `'t'`: Int16 count; Int32 type OID per parameter.
- **ParameterStatus** `'S'` (B): String name; String value. (Note `'S'` also = Sync from frontend; direction disambiguates.)
- **Parse** `'P'`: String statement name; String query; Int16 number of prespecified parameter types (not necessarily the number of `$n`); Int32 OID each (0 = unspecified).
- **Query** `'Q'`: String query string.
- **ReadyForQuery** `'Z'`: Int32(5); Byte1 transaction status: **`'I'` idle** (not in a transaction block), **`'T'` in a transaction block**, **`'E'` in a failed transaction block** (queries rejected until the block ends).
- **RowDescription** `'T'`: Int16 field count; per field: String name; Int32 table OID (0 if not a table column); Int16 column attribute number (0 if not); Int32 type OID; Int16 type size (pg_type.typlen; negative = variable width); Int32 type modifier (pg_attribute.atttypmod); Int16 format code (always 0 from statement-variant Describe).

### 54.8 Error and notice message fields  [M6]  (source: protocol-error-fields.txt)
- Each field type appears at most once per message. Codes:
  - `S` Severity: ERROR, FATAL, PANIC (errors) or WARNING, NOTICE, DEBUG, INFO, LOG (notices), possibly **localized**. Always present.
  - `V` Severity, **never localized** (9.6+).
  - `C` Code: **SQLSTATE** (Appendix A); not localizable; always present.
  - `M` Message: primary message, accurate but terse (typically one line); always present.
  - `D` Detail: optional secondary message, may be multi-line.
  - `H` Hint: optional advice (potentially inappropriate) rather than hard facts.
  - `P` Position: decimal ASCII integer, error cursor index into the original query string; **first character = 1; measured in characters, not bytes**.
  - `p` Internal position: same as P but refers to an internally generated command; `q` always appears with it.
  - `q` Internal query: text of failed internally-generated command (e.g. SQL issued by a PL/pgSQL function).
  - `W` Where: context — call-stack traceback of active PL functions and internal queries, one entry per line, **most recent first**.
  - `s` Schema name; `t` Table name; `c` Column name; `d` Data type name; `n` Constraint name (indexes treated as constraints).
  - `F` File, `L` Line, `R` Routine of the source-code location reporting the error.
- s/t/c/d/n are supplied only for a limited number of error types; presence of one doesn't guarantee another; user-defined functions may use them differently; they may not denote contemporary objects in the current database. Newlines in fields are paragraph breaks, not line breaks; client formats/wraps.

### 54.9 Logical replication message formats (pgoutput)  [M7]  (source: protocol-logicalrep-message-formats.txt)
- Returned by the replication slot SQL interface or sent by a walsender inside XLogData messages. Timestamps are microseconds since PostgreSQL epoch 2000-01-01. "Xid (only present for streamed transactions)" fields exist since protocol v2.
- **Begin** `'B'`: Int64 final LSN of the transaction; Int64 commit timestamp; Int32 xid.
- **Message** `'M'` (pg_logical_emit_message): [Int32 xid if streamed]; Int8 flags (0 none, **1 transactional**); Int64 LSN; String prefix; Int32 content length; Byten content.
- **Commit** `'C'`: Int8(0) flags; Int64 commit LSN; Int64 end LSN of transaction; Int64 commit timestamp.
- **Origin** `'O'`: Int64 commit LSN on origin server; String origin name. Multiple Origin messages may appear in one transaction.
- **Relation** `'R'`: [xid]; Int32 relation OID; String namespace (**empty for pg_catalog**); String relation name; Int8 replica identity (same as pg_class.relreplident); Int16 column count; per published column: Int8 flags (**1 = part of the key**), String name, Int32 type OID, Int32 atttypmod.
- **Type** `'Y'`: [xid]; Int32 type OID; String namespace (empty for pg_catalog); String type name.
- **Insert** `'I'`: [xid]; Int32 relation OID; Byte1 `'N'`; TupleData new tuple.
- **Update** `'U'`: [xid]; Int32 relation OID; optional `'K'` + TupleData (key; present only if the update changed any REPLICA IDENTITY index column) **or** optional `'O'` + TupleData (old tuple; present only with REPLICA IDENTITY FULL) — never both, possibly neither; then `'N'` + TupleData new tuple.
- **Delete** `'D'`: [xid]; Int32 relation OID; `'K'` (index replica identity) or `'O'` (FULL) + TupleData — never both.
- **Truncate** `'T'`: [xid]; Int32 number of relations; Int8 option bits (**1 CASCADE, 2 RESTART IDENTITY**); Int32 relation OID repeated.
- Since v2: **Stream Start** `'S'` (Int32 xid; Int8 1 = first segment for this xid, else 0); **Stream Stop** `'E'` (no fields); **Stream Commit** `'c'` (Int32 xid; Int8(0); Int64 commit LSN; Int64 end LSN; Int64 commit timestamp); **Stream Abort** `'A'` (Int32 xid; Int32 subtransaction xid (same as xid for top-level); Int64 abort LSN and Int64 abort timestamp — **only when streaming = parallel, since v4**).
- Since v3: **Begin Prepare** `'b'` (Int64 prepare LSN; Int64 end LSN; Int64 prepare timestamp; Int32 xid; String GID); **Prepare** `'P'` (Int8(0); Int64 prepare LSN; Int64 end LSN; Int64 prepare ts; Int32 xid; String GID); **Commit Prepared** `'K'` (Int8(0); Int64 commit LSN; Int64 end LSN of commit; Int64 commit ts; Int32 xid; String GID); **Rollback Prepared** `'r'` (Int8(0); Int64 end LSN of prepared txn; Int64 end LSN of rollback; Int64 prepare ts; Int64 rollback ts; Int32 xid; String GID); **Stream Prepare** `'p'` (same fields as Prepare).
- **TupleData**: Int16 column count; per published column one of: `'n'` NULL; `'u'` **unchanged TOASTed value (actual value not sent)**; `'t'` text value; `'b'` binary value — t/b followed by Int32 length + Byten.

### 54.10 Changes since protocol 2.0  [M6]  (source: protocol-changes.txt)
- Checklist for porting clients to 3.0: startup packet is a flexible list of strings (session defaults directly settable; previously only via the narrow, unquotable `options` field). All messages have a length count after the type byte (startup packets have no type byte); PasswordMessage now has a type byte. ErrorResponse/NoticeResponse carry multiple fields (fields typically don't end in newline). ReadyForQuery includes transaction status. BinaryRow merged into DataRow (layout changed; binary representation no longer tied to server internals). New extended query sub-protocol: frontend Parse, Bind, Execute, Describe, Close, Flush, Sync; backend ParseComplete, BindComplete, PortalSuspended, ParameterDescription, NoData, CloseComplete. COPY data encapsulated in CopyData/CopyDone with well-defined error recovery; the `\.` last line not needed and not sent during COPY OUT (still recognized as a terminator in text-mode COPY IN but not CSV; deprecated). Binary COPY supported; Copy responses carry column count/formats. FunctionCall supports NULL args and text/binary; no longer a security hole. ParameterStatus sent at startup and on change. RowDescription has table OID + column number + format code. CursorResponse ('P') no longer generated. NotificationResponse gained a payload string. EmptyQueryResponse lost its empty string parameter.

## Complete inventories

### All 64 system catalogs (Table 52.1)  [M1]
Shared = one copy per cluster (all others are per-database, copied from the template at CREATE DATABASE).

| catalog | purpose | shared |
|---|---|---|
| pg_aggregate | aggregate functions | |
| pg_am | relation access methods | |
| pg_amop | access method operators | |
| pg_amproc | access method support functions | |
| pg_attrdef | column default values | |
| pg_attribute | table columns ("attributes") | |
| pg_authid | authorization identifiers (roles) | yes |
| pg_auth_members | authorization identifier membership relationships | yes |
| pg_cast | casts (data type conversions) | |
| pg_class | tables, indexes, sequences, views ("relations") | |
| pg_collation | collations (locale information) | |
| pg_constraint | check, unique, primary key, foreign key constraints (+ not-null, exclusion, constraint triggers, domain checks) | |
| pg_conversion | encoding conversion information | |
| pg_database | databases within this database cluster | yes |
| pg_db_role_setting | per-role and per-database settings | yes |
| pg_default_acl | default privileges for object types | |
| pg_depend | dependencies between database objects | |
| pg_description | descriptions or comments on database objects | |
| pg_enum | enum label and value definitions | |
| pg_event_trigger | event triggers | |
| pg_extension | installed extensions | |
| pg_foreign_data_wrapper | foreign-data wrapper definitions | |
| pg_foreign_server | foreign server definitions | |
| pg_foreign_table | additional foreign table information | |
| pg_index | additional index information | |
| pg_inherits | table inheritance hierarchy | |
| pg_init_privs | object initial privileges | |
| pg_language | languages for writing functions | |
| pg_largeobject | data pages for large objects | |
| pg_largeobject_metadata | metadata for large objects | |
| pg_namespace | schemas | |
| pg_opclass | access method operator classes | |
| pg_operator | operators | |
| pg_opfamily | access method operator families | |
| pg_parameter_acl | configuration parameters for which privileges have been granted | yes |
| pg_partitioned_table | information about partition key of tables | |
| pg_policy | row-security policies | |
| pg_proc | functions and procedures | |
| pg_publication | publications for logical replication | |
| pg_publication_namespace | schema to publication mapping | |
| pg_publication_rel | relation to publication mapping | |
| pg_range | information about range types | |
| pg_replication_origin | registered replication origins | yes |
| pg_rewrite | query rewrite rules | |
| pg_seclabel | security labels on database objects | |
| pg_sequence | information about sequences | |
| pg_shdepend | dependencies on shared objects | yes |
| pg_shdescription | comments on shared objects | yes |
| pg_shseclabel | security labels on shared database objects | yes |
| pg_statistic | planner statistics | |
| pg_statistic_ext | extended planner statistics (definition) | |
| pg_statistic_ext_data | extended planner statistics (built statistics) | |
| pg_subscription | logical replication subscriptions | yes |
| pg_subscription_rel | relation state for subscriptions | |
| pg_tablespace | tablespaces within this database cluster | yes |
| pg_transform | transforms (data type to procedural language conversions) | |
| pg_trigger | triggers | |
| pg_ts_config | text search configurations | |
| pg_ts_config_map | text search configurations' token mappings | |
| pg_ts_dict | text search dictionaries | |
| pg_ts_parser | text search parsers | |
| pg_ts_template | text search templates | |
| pg_type | data types | |
| pg_user_mapping | mappings of users to foreign servers | |

Shared catalogs (11): pg_authid, pg_auth_members, pg_database, pg_db_role_setting, pg_parameter_acl, pg_replication_origin, pg_shdepend, pg_shdescription, pg_shseclabel, pg_subscription, pg_tablespace.
Restricted (not publicly readable): pg_authid (use pg_roles), pg_statistic (use pg_stats), pg_statistic_ext_data (use pg_stats_ext), pg_user_mapping (use pg_user_mappings), pg_subscription.subconninfo column, pg_largeobject (use pg_largeobject_metadata for OIDs).

### All 37 system views in ch.53 (Table 53.1)  [M1]
(Cumulative-statistics pg_stat_* views, incl. pg_stat_activity, are in ch.27 Table 27.2, not here.) All read-only except pg_settings (UPDATE = SET).

| view | purpose | default access |
|---|---|---|
| pg_aios | in-use asynchronous IO handles (PG18) | superuser / pg_read_all_stats |
| pg_available_extensions | available extensions | public |
| pg_available_extension_versions | available versions of extensions | public |
| pg_backend_memory_contexts | backend memory contexts (current session) | superuser / pg_read_all_stats |
| pg_config | compile-time configuration parameters | superuser |
| pg_cursors | open cursors | public (own session) |
| pg_file_settings | summary of configuration file contents | superuser |
| pg_group | groups of database users (compat) | public |
| pg_hba_file_rules | summary of pg_hba.conf contents | superuser |
| pg_ident_file_mappings | summary of pg_ident.conf contents | superuser |
| pg_indexes | indexes | public |
| pg_locks | locks currently held or awaited | public |
| pg_matviews | materialized views | public |
| pg_policies | policies | public |
| pg_prepared_statements | prepared statements (current session) | public |
| pg_prepared_xacts | prepared transactions | public |
| pg_publication_tables | publications and their associated tables (expanded) | public |
| pg_replication_origin_status | replication origin progress | (not stated) |
| pg_replication_slots | replication slot information | public |
| pg_roles | database roles (password blanked) | public |
| pg_rules | rules (excl. view ON SELECT rules) | public |
| pg_seclabels | security labels | public |
| pg_sequences | sequences | public |
| pg_settings | parameter settings (updatable) | public |
| pg_shadow | database users incl. password (compat) | restricted |
| pg_shmem_allocations | shared memory allocations (main segment) | superuser / pg_read_all_stats |
| pg_shmem_allocations_numa | NUMA node mappings for shared memory (PG18) | superuser / pg_read_all_stats |
| pg_stats | planner statistics (readable tables only) | public |
| pg_stats_ext | extended planner statistics (owned tables only) | public |
| pg_stats_ext_exprs | extended statistics for expressions (owned tables) | public |
| pg_tables | tables | public |
| pg_timezone_abbrevs | time zone abbreviations | public |
| pg_timezone_names | time zone names | public |
| pg_user | database users (password blanked) | public |
| pg_user_mappings | user mappings (options hidden unless privileged) | public |
| pg_views | views | public |
| pg_wait_events | wait events (type, name, description) | public |

### Single-character code enumerations in catalogs  [M1, M2, M4, M5, M7]
| catalog.column | codes |
|---|---|
| pg_class.relkind | r ordinary table, i index, S sequence, t TOAST table, v view, m materialized view, c composite type, f foreign table, p partitioned table, I partitioned index |
| pg_class.relpersistence | p permanent, u unlogged, t temporary |
| pg_class.relreplident | d default (PK), n nothing, f full (all columns), i index (indisreplident) |
| pg_am.amtype | t table (incl. matviews), i index |
| pg_amop.amoppurpose | s search, o ordering |
| pg_aggregate.aggkind | n normal, o ordered-set, h hypothetical-set |
| pg_aggregate.aggfinalmodify / aggmfinalmodify | r read-only, s transfn cannot follow finalfn, w writes |
| pg_attribute.attidentity | '' none, a always, d by default |
| pg_attribute.attgenerated | '' none, s stored, v virtual (PG18) |
| pg_attribute.attcompression | '\0' default, p pglz, l LZ4 |
| pg_attribute.attstorage / pg_type.typstorage | p plain, e external, m main, x extended |
| pg_cast.castcontext | e explicit, a assignment, i implicit |
| pg_cast.castmethod | f function, i I/O functions, b binary-coercible |
| pg_collation.collprovider | d database default, b builtin, c libc, i icu |
| pg_database.datlocprovider | b builtin, c libc, i icu |
| pg_constraint.contype | c check, f foreign key, n not-null, p primary key, u unique, t constraint trigger, x exclusion |
| pg_constraint.confupdtype / confdeltype | a no action, r restrict, c cascade, n set null, d set default |
| pg_constraint.confmatchtype | f full, p partial, s simple |
| pg_default_acl.defaclobjtype | r relation, S sequence, f function, T type, n schema, L large object |
| pg_depend.deptype | n normal, a auto, i internal, P partition primary, S partition secondary, e extension, x auto-extension |
| pg_shdepend.deptype | o owner, a ACL, i init-ACL, r policy, t tablespace |
| pg_event_trigger.evtenabled / pg_trigger.tgenabled / pg_rewrite.ev_enabled | O origin+local, D disabled, R replica, A always |
| pg_rewrite.ev_type | 1 SELECT, 2 UPDATE, 3 INSERT, 4 DELETE |
| pg_init_privs.privtype | i initdb, e CREATE EXTENSION |
| pg_operator.oprkind | b infix, l prefix |
| pg_partitioned_table.partstrat | h hash, l list, r range |
| pg_policy.polcmd | r SELECT, a INSERT, w UPDATE, d DELETE, * all |
| pg_proc.prokind | f function, p procedure, a aggregate, w window |
| pg_proc.provolatile | i immutable, s stable, v volatile |
| pg_proc.proparallel | s safe, r restricted, u unsafe |
| pg_proc.proargmodes | i IN, o OUT, b INOUT, v VARIADIC, t TABLE |
| pg_publication.pubgencols | n none, s stored (PG18) |
| pg_statistic_ext.stxkind | d ndistinct, f functional dependencies, m MCV, e expressions |
| pg_subscription.substream | f off, t spill to disk, p parallel apply |
| pg_subscription.subtwophasestate | d disabled, p pending, e enabled |
| pg_subscription_rel.srsubstate | i initialize, d data copying, f finished copy, s synchronized, r ready |
| pg_type.typtype | b base, c composite, d domain, e enum, p pseudo, r range, m multirange |
| pg_type.typalign | c char (1), s short (2), i int (4), d double (8 on many machines) |
| pg_type.typcategory | A array, B boolean, C composite, D date/time, E enum, G geometric, I network, N numeric, P pseudo, R range, S string, T timespan, U user-defined, V bit-string, X unknown, Z internal |
| pg_type.typlen negatives | -1 varlena, -2 null-terminated C string |
| pg_database.datconnlimit | -1 no limit, -2 invalid database |

### pg_statistic slot kinds (NOT from the docs in this slice)
- The pg_statistic docs page (idx 884) names slot columns generically (`stakindN`, `staopN`, `stacollN`, `stanumbersN`, `stavaluesN`) and defers the kind codes to `src/include/catalog/pg_statistic.h`. It does **not** give the codes or the slot count.
- **Unverified, from outside the docs (verify against pg_statistic.h before using in a lesson):** 5 slots (N = 1..5); STATISTIC_KIND_MCV = 1, HISTOGRAM = 2, CORRELATION = 3, MCELEM = 4, DECHIST = 5, RANGE_LENGTH_HISTOGRAM = 6, BOUNDS_HISTOGRAM = 7.
- What the docs do establish (via pg_stats): the kinds of slot data exposed are MCV list (most_common_vals/freqs), equal-population histogram (histogram_bounds), correlation, element MCV (most_common_elems/elem_freqs), distinct-element-count histogram (elem_count_histogram), range length histogram + range_empty_frac, range bounds histogram.

### pg_locks locktype values (12)  [M5]
relation, extend, frozenid, page, tuple, transactionid, virtualxid, spectoken, object, userlock, advisory, applytransaction.

### pg_settings.context values (7, hardest to easiest)  [M7]
internal, postmaster, sighup, superuser-backend, backend, superuser, user. vartype: bool, enum, integer, real, string.

### Other view enumerations  [M7, M1]
- pg_replication_slots.wal_status: reserved, extended, unreserved, lost.
- pg_replication_slots.invalidation_reason: wal_removed, rows_removed, wal_level_insufficient, idle_timeout.
- pg_aios.state: HANDED_OUT, DEFINED, STAGED, SUBMITTED, COMPLETED_IO, COMPLETED_SHARED, COMPLETED_LOCAL; operation: invalid, readv, writev; target: smgr; result: UNKNOWN, OK, PARTIAL, WARNING, ERROR.

### Protocol message types (54.7)  [M6]
| byte | message | direction |
|---|---|---|
| (none) | StartupMessage (Int32 196610 = v3.2) | F |
| (none) | CancelRequest (80877102) | F |
| (none) | SSLRequest (80877103) | F |
| (none) | GSSENCRequest (80877104) | F |
| R | Authentication* (subcode 0 Ok, 2 KerberosV5, 3 Cleartext, 5 MD5, 7 GSS, 8 GSSContinue, 9 SSPI, 10 SASL, 11 SASLContinue, 12 SASLFinal) | B |
| K | BackendKeyData | B |
| B | Bind | F |
| 2 | BindComplete | B |
| C | Close | F |
| 3 | CloseComplete | B |
| C | CommandComplete | B |
| d | CopyData | F & B |
| c | CopyDone | F & B |
| f | CopyFail | F |
| G | CopyInResponse | B |
| H | CopyOutResponse | B |
| W | CopyBothResponse | B |
| D | DataRow | B |
| D | Describe | F |
| I | EmptyQueryResponse | B |
| E | ErrorResponse | B |
| E | Execute | F |
| H | Flush | F |
| F | FunctionCall | F |
| V | FunctionCallResponse | B |
| p | GSSResponse / PasswordMessage / SASLInitialResponse / SASLResponse | F |
| v | NegotiateProtocolVersion | B |
| n | NoData | B |
| N | NoticeResponse | B |
| A | NotificationResponse | B |
| t | ParameterDescription | B |
| S | ParameterStatus | B |
| P | Parse | F |
| 1 | ParseComplete | B |
| s | PortalSuspended | B |
| Q | Query | F |
| Z | ReadyForQuery (status I / T / E) | B |
| T | RowDescription | B |
| S | Sync | F |
| X | Terminate | F |
Single-byte responses to SSLRequest: S / N; to GSSENCRequest: G / N.

### Streaming replication CopyData sub-messages  [M7]
w XLogData (B), k primary keepalive (B), r standby status update (F), h hot standby feedback (F). BASE_BACKUP CopyData: n new archive, m manifest, d data, p progress.

### Replication commands (54.4)  [M7]
IDENTIFY_SYSTEM, SHOW, TIMELINE_HISTORY, CREATE_REPLICATION_SLOT (TWO_PHASE, RESERVE_WAL, SNAPSHOT export/use/nothing, FAILOVER), ALTER_REPLICATION_SLOT (TWO_PHASE, FAILOVER), READ_REPLICATION_SLOT, START_REPLICATION ... PHYSICAL, START_REPLICATION SLOT ... LOGICAL, DROP_REPLICATION_SLOT [WAIT], UPLOAD_MANIFEST, BASE_BACKUP (LABEL, TARGET, TARGET_DETAIL, PROGRESS, CHECKPOINT, WAL, WAIT, COMPRESSION, COMPRESSION_DETAIL, MAX_RATE, TABLESPACE_MAP, VERIFY_CHECKSUMS, MANIFEST, MANIFEST_CHECKSUMS, INCREMENTAL).

### pgoutput options and logical replication messages  [M7]
- Options: proto_version (1-4), publication_names, binary, messages, streaming (off/on/parallel), two_phase, origin (none/any).
- Messages: B Begin, M Message, C Commit, O Origin, R Relation, Y Type, I Insert, U Update, D Delete, T Truncate; v2: S Stream Start, E Stream Stop, c Stream Commit, A Stream Abort; v3: b Begin Prepare, P Prepare, K Commit Prepared, r Rollback Prepared, p Stream Prepare. Tuple parts: N new, K key, O old. TupleData column kinds: n null, u unchanged TOAST, t text, b binary.

### Error/notice field codes (54.8)  [M6]
S severity (localized), V severity (non-localized), C SQLSTATE, M message, D detail, H hint, P position, p internal position, q internal query, W where, s schema, t table, c column, d data type, n constraint, F file, L line, R routine.

### ParameterStatus reported parameters (15)  [M6]
application_name, client_encoding, DateStyle, default_transaction_read_only, in_hot_standby, integer_datetimes, IntervalStyle, is_superuser, scram_iterations, search_path (since 18), server_encoding, server_version, session_authorization, standard_conforming_strings, TimeZone.

### Protocol versions  [M6]
3.2 (PG18+, variable-length cancel key), 3.1 (reserved/skipped: pgbouncer bug), 3.0 (PG 7.4+; libpq default), 2.0 (up to PG 13).

## Lesson ideas

### Visualizers
- **Query pipeline conveyor (M4)**: string -> tokens (scan.l) -> raw parse tree (gram.y, no catalog access) -> [transaction starts] -> query tree (FuncCall becomes FuncExpr or Aggref, types attached) -> rewriter (view expanded via pg_rewrite ev_action) -> paths -> plan tree -> rows. Show `BEGIN` exiting right after raw parsing. Facts: ch.51.3-51.5.
- **Demand-pull executor animation (M4)**: MergeJoin pulls from left Sort, which drains SeqScan until NULL, sorts, emits first row; MergeJoin pulls right; advances the lesser side. Then ModifyTable variant: UPDATE rows carry new values + TID; DELETE carries only TID. Facts: ch.51.6.
- **Join search tree (M4)**: relations as nodes, join clauses as edges; the planner joins along edges first and adds clause-less (cartesian) pairs only when it has no other choice; switches to "GEQO" past geqo_threshold.
- **Wire-protocol sequence diagram (M6)**: byte-level frames scroll by: StartupMessage (196610) -> R/10 SASL -> p -> R/11 -> p -> R/12 -> R/0 -> S... -> K -> Z('I'). Then simple Query ('Q' -> 'T','D'...,'C','Z') vs extended (P,B,D,E,S -> 1,2,T,D...,C,Z). Toggle "error in step 2" to show the backend discarding until Sync. Facts: 54.2, 54.7.
- **Pipelining with and without Sync (M6)**: three queries; place Sync markers; inject an error; count ReadyForQuery to see which segments committed.
- **ReadyForQuery status light (M5/M6)**: I/T/E indicator driven by playground commands (BEGIN, error, ROLLBACK).
- **Cancel side-channel (M6)**: second socket carrying CancelRequest(80877102, PID, key); no reply; the original query ends in an error or not.
- **pg_locks explorer (M5)**: two simulated sessions; show vxid ExclusiveLock always held, xid lock after the first write, the waiter's ShareLock on the holder's transactionid for a row conflict (row locks themselves are not in the view).
- **Catalog ER map (M1/M2)**: pg_class at the center, linked to pg_attribute (attrelid), pg_index (indexrelid/indrelid), pg_type (reltype/typrelid), pg_namespace, pg_constraint, pg_statistic, pg_depend; click a relkind letter to filter.
- **pg_index build states (M4/M5)**: CREATE INDEX CONCURRENTLY flips indisready then indisvalid; DROP CONCURRENTLY clears indislive.
- **Histogram/MCV visual (M4)**: draw pg_stats.most_common_vals as bars plus histogram_bounds as equal-population buckets (MCVs excluded); estimate selectivity of `col = x` and `col < x`.
- **Replication slot WAL gauge (M7)**: restart_lsn vs current LSN against max_wal_size / max_slot_wal_keep_size thresholds, with wal_status moving reserved -> extended -> unreserved -> lost and safe_wal_size counting down.
- **pgoutput decoder (M7)**: hex stream of B/R/I/U/C messages decoded into fields; toggle REPLICA IDENTITY FULL to show the 'O' tuple appear; show 'u' for unchanged TOAST.

### Playground SQL (PGlite, PG18, single session)
```sql
-- relkind / relpersistence census
SELECT relkind, relpersistence, count(*) FROM pg_class GROUP BY 1,2 ORDER BY 1,2;

-- reltuples is -1 before ANALYZE/VACUUM; relallfrozen is new in 18
CREATE TABLE t(id int PRIMARY KEY, v text);
SELECT relpages, reltuples, relallvisible, relallfrozen FROM pg_class WHERE relname='t';
INSERT INTO t SELECT g, md5(g::text) FROM generate_series(1,10000) g;
ANALYZE t;
SELECT relpages, reltuples FROM pg_class WHERE relname='t';

-- columns incl. system columns (negative attnum)
SELECT attnum, attname, atttypid::regtype, attlen, attalign, attstorage
FROM pg_attribute WHERE attrelid='t'::regclass ORDER BY attnum;

-- dropped column remains physically
ALTER TABLE t ADD COLUMN junk int; ALTER TABLE t DROP COLUMN junk;
SELECT attnum, attname, attisdropped, atttypid FROM pg_attribute WHERE attrelid='t'::regclass AND attnum>0;

-- fast default: atthasmissing / attmissingval
ALTER TABLE t ADD COLUMN flag int DEFAULT 7;
SELECT attname, atthasmissing, attmissingval FROM pg_attribute WHERE attrelid='t'::regclass AND attname='flag';

-- virtual generated column (PG18)
ALTER TABLE t ADD COLUMN v2 int GENERATED ALWAYS AS (id*2) VIRTUAL;
SELECT attname, attgenerated FROM pg_attribute WHERE attrelid='t'::regclass AND attgenerated <> '';

-- not-null constraints are pg_constraint rows (contype 'n')
SELECT conname, contype, conenforced, convalidated FROM pg_constraint WHERE conrelid='t'::regclass;

-- pg_index flags and indkey
SELECT indexrelid::regclass, indnatts, indnkeyatts, indisunique, indisprimary, indisvalid, indisready, indislive, indkey
FROM pg_index WHERE indrelid='t'::regclass;

-- planner stats
SELECT attname, null_frac, avg_width, n_distinct, correlation,
       most_common_vals IS NOT NULL AS has_mcv, array_length(histogram_bounds,1) AS hist_buckets
FROM pg_stats WHERE tablename='t';

-- extended statistics (built only after ANALYZE)
CREATE STATISTICS t_s (ndistinct, dependencies, mcv) ON id, flag FROM t;
SELECT stxkind FROM pg_statistic_ext WHERE stxname='t_s';
ANALYZE t;
SELECT kinds, n_distinct, dependencies FROM pg_stats_ext WHERE statistics_name='t_s';

-- your own locks: vxid lock always, xid lock after first write
BEGIN;
SELECT locktype, virtualxid, transactionid, mode, granted, fastpath FROM pg_locks WHERE pid = pg_backend_pid();
UPDATE t SET v='x' WHERE id=1;
SELECT locktype, relation::regclass, transactionid, mode, fastpath FROM pg_locks WHERE pid = pg_backend_pid();
COMMIT;

-- advisory lock key encoding
SELECT pg_advisory_lock(42); SELECT pg_advisory_lock(1,2);
SELECT classid, objid, objsubid FROM pg_locks WHERE locktype='advisory';
SELECT pg_advisory_unlock_all();

-- generic vs custom plan counters
PREPARE q(int) AS SELECT * FROM t WHERE id=$1;
EXECUTE q(1); EXECUTE q(2); EXECUTE q(3); EXECUTE q(4); EXECUTE q(5); EXECUTE q(6);
SELECT name, from_sql, parameter_types, generic_plans, custom_plans FROM pg_prepared_statements;

-- cursors and pg_settings as a writable view
BEGIN; DECLARE c SCROLL CURSOR FOR SELECT * FROM t;
SELECT name, is_holdable, is_scrollable, is_binary FROM pg_cursors; COMMIT;
SELECT name, setting, unit, context, vartype, source, boot_val, reset_val, pending_restart FROM pg_settings WHERE name IN ('work_mem','shared_buffers','geqo_threshold');
UPDATE pg_settings SET setting='64MB' WHERE name='work_mem'; SHOW work_mem;
SELECT context, count(*) FROM pg_settings GROUP BY 1 ORDER BY 2 DESC;

-- dependency graph: what depends on table t
SELECT classid::regclass, objid, objsubid, deptype FROM pg_depend WHERE refobjid='t'::regclass;

-- view = relkind v + _RETURN rule
CREATE VIEW tv AS SELECT id FROM t;
SELECT rulename, ev_type, is_instead FROM pg_rewrite WHERE ev_class='tv'::regclass;

-- enum even-OID ordering rule
CREATE TYPE mood AS ENUM ('sad','ok','happy'); ALTER TYPE mood ADD VALUE 'meh' BEFORE 'ok';
SELECT oid, enumlabel, enumsortorder FROM pg_enum WHERE enumtypid='mood'::regtype ORDER BY enumsortorder;

-- pg_type internals
SELECT typname, typlen, typbyval, typtype, typcategory, typalign, typstorage
FROM pg_type WHERE typname IN ('int4','int8','text','numeric','bool','cstring','t');

-- memory contexts (needs pg_read_all_stats or superuser)
SELECT name, level, total_bytes, used_bytes FROM pg_backend_memory_contexts ORDER BY total_bytes DESC LIMIT 10;

-- multi-statement implicit transaction (one simple Query message, if the client sends it as one)
CREATE TABLE mytable(x int);
-- send as ONE string: INSERT INTO mytable VALUES(1); SELECT 1/0; INSERT INTO mytable VALUES(2);
SELECT * FROM mytable;  -- empty: the first INSERT was rolled back
```
(Notes: PGlite may restrict pg_backend_memory_contexts, pg_shmem_allocations, pg_aios, and pg_file_settings, since they need superuser or pg_read_all_stats. pg_replication_slots and pg_stat_activity will be empty or trivial in PGlite.)

### Pitfalls the docs warn about (with documented fix)
- Editing catalogs by hand can "severely mess up your system" -> use the SQL commands (52 intro).
- relpages/reltuples/relallvisible are **estimates** updated only by VACUUM/ANALYZE/some DDL; reltuples = -1 means unknown -> run ANALYZE.
- relhasindex/relhasrules/relhastriggers/relhassubclass are lazily maintained (may stay true) -> don't treat them as exact; VACUUM clears relhasindex.
- Joining pg_locks.relation to pg_class only works for the current database -> filter on `database` = current DB OID or 0.
- Self-joining pg_locks to find blockers is very hard to get right -> use `pg_blocking_pids()`.
- Row-level locks don't appear in pg_locks -> look for a wait on the holder's transactionid (or use pg_rowlocks-style tools).
- pg_locks fast-path vs main vs predicate data is not mutually consistent, and querying it often can hurt performance.
- pg_prepared_xacts locks transaction manager structures momentarily -> avoid very frequent polling.
- pg_shmem_allocations_numa is very slow and touches/allocates all pages -> never query it from monitoring.
- pg_backend_memory_contexts path ids are unstable within a query -> materialize the view in a CTE first.
- pg_file_settings / pg_hba_file_rules show **current file contents**, not what's applied -> use pg_settings (or reload) to see the effective values; a syntax error means none of the file's settings are applied.
- pg_settings does not show custom GUCs of modules not loaded in this backend -> LOAD the module or check in the right process.
- pg_sequences.last_value can be ahead of values handed out when caching is on, and is NULL without privilege, before the first read, or for unlogged sequences on a standby.
- Replication slot `xmin`/`catalog_xmin` hold back VACUUM; `restart_lsn` holds WAL until `max_slot_wal_keep_size` -> monitor wal_status/safe_wal_size; drop unused slots; idle_replication_slot_timeout (PG18) can invalidate idle slots.
- MD5 password auth is deprecated and will be removed -> migrate to SCRAM-SHA-256.
- Multi-statement simple Query: `BEGIN; SELECT 1/0; ROLLBACK;` leaves the session in a failed transaction -> send another ROLLBACK. A syntax error anywhere in the string prevents **all** statements from running. Savepoints aren't allowed in the implicit block.
- Extended protocol: a Parse can contain only one statement; Execute without Flush/Sync may not return results promptly -> send Flush to see results early, Sync to end a series.
- Pipelines: count ReadyForQuery messages, not CommandCompletes, to detect completion; CREATE DATABASE in a pipeline must be the first command after a Sync.
- Disconnecting mid-statement does not guarantee rollback of an autocommit non-SELECT -> it may already be committed.
- SSL/GSS negotiation: don't display an error response to SSLRequest/GSSENCRequest (CVE-2024-10977); read exactly one byte after 'S'/'G' (CVE-2021-23222 buffer stuffing). Direct SSL requires ALPN "postgresql".
- OAUTHBEARER tokens act like clear-text passwords -> use only over SSL.
- Frontends must accept ErrorResponse/NoticeResponse/ParameterStatus/NotificationResponse at any point -> write the client as a state machine.
- libpq still defaults to protocol 3.0 -> request 3.2 explicitly to get long cancel keys; middleware must handle variable-length keys (4-256 bytes).
