# I — Part VI Reference, SQL Commands, first half (idx 603-695: ABORT .. CREATE TRIGGER)

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 603 | reference.txt | Part VI intro + TOC of all SQL commands, client apps, server apps |
| 604 | sql-commands.txt | SQL Commands section TOC (183 commands ABORT..VALUES with one-line purposes) |
| 605 | sql-abort.txt | ABORT = ROLLBACK synonym; AND [NO] CHAIN |
| 606 | sql-alteraggregate.txt | Rename/owner/schema of aggregate; aggregate_signature forms incl. ORDER BY for ordered-set |
| 607 | sql-altercollation.txt | REFRESH VERSION, collation version mismatch warning, rebuild-then-refresh procedure |
| 608 | sql-alterconversion.txt | Rename/owner/schema of encoding conversion |
| 609 | sql-alterdatabase.txt | ALLOW_CONNECTIONS / CONNECTION LIMIT / IS_TEMPLATE, rename, owner, SET TABLESPACE, per-db GUC defaults |
| 610 | sql-alterdefaultprivileges.txt | Default privileges for future objects by class; per-schema additive rule |
| 611 | sql-alterdomain.txt | Domain default/not null/constraints, NOT VALID + VALIDATE recipe, container-type limitation |
| 612 | sql-altereventtrigger.txt | Enable/disable (REPLICA/ALWAYS), owner, rename; superuser only |
| 613 | sql-alterextension.txt | UPDATE [TO], SET SCHEMA, ADD/DROP member object list |
| 614 | sql-alterforeigndatawrapper.txt | HANDLER/VALIDATOR/OPTIONS changes; superuser only |
| 615 | sql-alterforeigntable.txt | Foreign table column/constraint/option changes; nothing verified against remote |
| 616 | sql-alterfunction.txt | Function attribute changes (volatility, strictness, parallel, cost, rows, support, SET), DEPENDS ON EXTENSION |
| 617 | sql-altergroup.txt | Obsolete ADD/DROP USER, rename; equals GRANT/REVOKE membership |
| 618 | sql-alterindex.txt | Rename (SHARE UPDATE EXCLUSIVE), tablespace, ATTACH PARTITION, storage params, expression-column statistics |
| 619 | sql-alterlanguage.txt | Rename/owner of procedural language |
| 620 | sql-alterlargeobject.txt | Change owner of a large object by OID |
| 621 | sql-altermaterializedview.txt | Subset of ALTER TABLE actions for matviews |
| 622 | sql-alteroperator.txt | Owner/schema; SET RESTRICT/JOIN/COMMUTATOR/NEGATOR/HASHES/MERGES |
| 623 | sql-alteropclass.txt | Rename/owner/schema of operator class |
| 624 | sql-alteropfamily.txt | ADD/DROP loose operators & support functions in a family; superuser; no validation |
| 625 | sql-alterpolicy.txt | Change roles/USING/WITH CHECK of RLS policy; cannot change command or permissive/restrictive |
| 626 | sql-alterprocedure.txt | Procedure security/SET options, rename, owner, schema, extension dependency |
| 627 | sql-alterpublication.txt | ADD/SET/DROP tables & schemas, SET parameters, publish_via_partition_root caution |
| 628 | sql-alterrole.txt | Role attributes, rename (MD5 password cleared), per-role/per-db GUC defaults and precedence |
| 629 | sql-alterroutine.txt | ALTER for function/aggregate/procedure generically; no CREATE ROUTINE |
| 630 | sql-alterrule.txt | Rename a rewrite rule (only action) |
| 631 | sql-alterschema.txt | Rename/owner of schema; pg_ prefix reserved |
| 632 | sql-altersequence.txt | Sequence params, RESTART transactional vs setval, cache visibility in other backends, LOGGED/UNLOGGED |
| 633 | sql-alterserver.txt | Foreign server VERSION/OPTIONS/owner/rename |
| 634 | sql-alterstatistics.txt | Extended statistics owner/rename/schema/SET STATISTICS target 0..10000 |
| 635 | sql-altersubscription.txt | CONNECTION, SET/ADD/DROP/REFRESH PUBLICATION, ENABLE/DISABLE, SET params, SKIP (lsn), txn-block restrictions |
| 636 | sql-altersystem.txt | Writes postgresql.auto.conf; reload needed; not in txn block; allow_alter_system |
| 637 | sql-altertable.txt | All ALTER TABLE sub-forms, per-form lock levels, rewrite rules, NOT VALID, partitions attach/detach, replica identity |
| 638 | sql-altertablespace.txt | Rename/owner; per-tablespace seq_page_cost, random_page_cost, effective_io_concurrency, maintenance_io_concurrency |
| 639 | sql-altertsconfig.txt | ADD/ALTER/DROP MAPPING token types to dictionaries, REPLACE dictionary |
| 640 | sql-altertsdictionary.txt | Change template-specific options; dummy-option trick to force config re-read |
| 641 | sql-altertsparser.txt | Rename / set schema of FTS parser; superuser |
| 642 | sql-altertstemplate.txt | Rename / set schema of FTS template; superuser |
| 643 | sql-altertrigger.txt | Rename trigger, DEPENDS ON EXTENSION; enable/disable lives in ALTER TABLE |
| 644 | sql-altertype.txt | Composite attributes, enum ADD/RENAME VALUE, base-type SET properties (STORAGE rules) |
| 645 | sql-alteruser.txt | Alias for ALTER ROLE |
| 646 | sql-alterusermapping.txt | Change user mapping OPTIONS |
| 647 | sql-alterview.txt | View column defaults, rename, options check_option/security_barrier/security_invoker |
| 648 | sql-analyze.txt | ANALYZE options, sampling, statistics target, inheritance/partition stats, autovacuum gaps |
| 649 | sql-begin.txt | BEGIN transaction modes, autocommit, nested BEGIN warning |
| 650 | sql-call.txt | CALL procedure, OUT params, transaction control restriction |
| 651 | sql-checkpoint.txt | Force immediate checkpoint / restartpoint; pg_checkpoint role |
| 652 | sql-close.txt | Close cursor(s); holdable cursor lifetime; not rolled back with savepoint |
| 653 | sql-cluster.txt | Physical reorder by index, ACCESS EXCLUSIVE, two methods and disk space needs |
| 654 | sql-comment.txt | COMMENT ON all object kinds; SHARE UPDATE EXCLUSIVE; comments world-readable |
| 655 | sql-commit.txt | COMMIT [AND CHAIN]; durability guarantee; warning outside txn |
| 656 | sql-commit-prepared.txt | Commit a 2PC prepared transaction by GID; not in txn block |
| 657 | sql-copy.txt | COPY FROM/TO syntax, all options (FREEZE, ON_ERROR, REJECT_LIMIT...), text/CSV/binary file formats byte layout, permissions, caveats |
| 658 | sql-create-access-method.txt | Define TABLE or INDEX access method with handler function; superuser |
| 659 | sql-createaggregate.txt | Aggregate definition: SFUNC/STYPE/FINALFUNC, combine/serial for parallel, moving-aggregate mode, ordered-set/hypothetical, SORTOP |
| 660 | sql-createcast.txt | Casts: WITH FUNCTION / WITHOUT FUNCTION / WITH INOUT, explicit vs assignment vs implicit, binary coercibility |
| 661 | sql-createcollation.txt | Collation providers builtin/icu/libc, DETERMINISTIC, RULES, lock on pg_collation |
| 662 | sql-createconversion.txt | Encoding conversion definition and conversion function signature |
| 663 | sql-createdatabase.txt | Template cloning, STRATEGY WAL_LOG vs FILE_COPY, locale/encoding rules, connection limit caveats |
| 664 | sql-createdomain.txt | Domain with DEFAULT/NOT NULL/CHECK(VALUE); null-leak pitfalls; immutability assumption |
| 665 | sql-createeventtrigger.txt | Event trigger on event with TAG filter; superuser; event_triggers GUC escape hatch |
| 666 | sql-createextension.txt | Install extension: SCHEMA/VERSION/CASCADE, trusted extensions, security caution |
| 667 | sql-createforeigndatawrapper.txt | FDW with HANDLER/VALIDATOR/OPTIONS; superuser |
| 668 | sql-createforeigntable.txt | Foreign table columns/constraints (unenforced), LIKE, INHERITS, PARTITION OF, generated columns |
| 669 | sql-createfunction.txt | Function definition: volatility, strictness, security definer, parallel, COST/ROWS defaults, sql_body, overloading, safe SECURITY DEFINER |
| 670 | sql-creategroup.txt | Alias for CREATE ROLE |
| 671 | sql-createindex.txt | Index syntax, INCLUDE, NULLS NOT DISTINCT, storage parameters per AM, CONCURRENTLY phases and caveats, parallel builds |
| 672 | sql-createlanguage.txt | Register a procedural language: HANDLER/INLINE/VALIDATOR, TRUSTED, per-database |
| 673 | sql-creatematerializedview.txt | Matview from a query, WITH [NO] DATA, unscannable until refreshed, security-restricted query |
| 674 | sql-createoperator.txt | Operator naming rules, COMMUTATOR/NEGATOR pairing, RESTRICT/JOIN, HASHES/MERGES |
| 675 | sql-createopclass.txt | Operator class: strategies, support functions, STORAGE, DEFAULT, FAMILY; superuser |
| 676 | sql-createopfamily.txt | Empty operator family for an index method; superuser |
| 677 | sql-createpolicy.txt | RLS policy syntax, per-command rules, Table 301, permissive/restrictive combination, leaks |
| 678 | sql-createprocedure.txt | Procedure definition; SECURITY DEFINER or SET clause forbids transaction control; BEGIN ATOMIC body |
| 679 | sql-createpublication.txt | Publication of tables/schemas, row filters, column lists, publish / publish_generated_columns / publish_via_partition_root, replica identity rules |
| 680 | sql-createrole.txt | Role attributes with defaults, membership clauses, password storage, CONNECTION LIMIT caveats |
| 681 | sql-createrule.txt | Rewrite rules as command macros, _RETURN view rules, INSTEAD/ALSO, RETURNING limits, NOTIFY caveat |
| 682 | sql-createschema.txt | Schema creation, AUTHORIZATION, embedded schema elements, pg_ prefix reserved |
| 683 | sql-createsequence.txt | Sequence options and defaults, UNLOGGED/TEMP, non-transactional nextval, cache holes and ordering |
| 684 | sql-createserver.txt | Foreign server with TYPE/VERSION/OPTIONS; sort pushdown ordering caveat |
| 685 | sql-createstatistics.txt | Extended statistics: expression stats, ndistinct/dependencies/mcv, worked estimation examples, no join use |
| 686 | sql-createsubscription.txt | Subscription parameters with defaults (streaming=parallel, synchronous_commit=off...), same-cluster hang, row filter combination |
| 687 | sql-createtable.txt | Full CREATE TABLE: TEMP/UNLOGGED/ON COMMIT, columns (STORAGE, COMPRESSION, generated VIRTUAL default, identity), all constraint kinds incl. temporal, INHERITS, partitioning bounds, LIKE options, every storage parameter |
| 688 | sql-createtableas.txt | Table from query result, WITH [NO] DATA, EXECUTE prepared query, preferred over SELECT INTO |
| 689 | sql-createtablespace.txt | Cluster-wide tablespace LOCATION rules, options, superuser, not in txn block |
| 690 | sql-createtsconfig.txt | FTS configuration from PARSER or COPY; no mappings ignores all words |
| 691 | sql-createtsdictionary.txt | FTS dictionary from TEMPLATE with options |
| 692 | sql-createtsparser.txt | FTS parser START/GETTOKEN/END/LEXTYPES[/HEADLINE]; superuser |
| 693 | sql-createtstemplate.txt | FTS template LEXIZE[/INIT]; superuser; why templates are separate |
| 694 | sql-createtransform.txt | Type-to-language transform FROM SQL / TO SQL functions |
| 695 | sql-createtrigger.txt | Trigger timing/granularity matrix, constraint triggers, transition tables, WHEN semantics, partition cloning |

## Notes by topic

### Part VI Reference / SQL Commands index pages  [M1, M3, M6, M7]  (source: reference.txt, sql-commands.txt)
- Part VI = "authoritative, complete, and formal summary"; entries also shipped as man pages. Three sections: I. SQL Commands (ABORT .. VALUES, 183 commands), II. Client Applications, III. Server Applications.
- Client apps listed (21): clusterdb, createdb, createuser, dropdb, dropuser, ecpg, pg_amcheck, pg_basebackup, pgbench, pg_combinebackup, pg_config, pg_dump, pg_dumpall, pg_isready, pg_receivewal, pg_recvlogical, pg_restore, pg_verifybackup, psql, reindexdb, vacuumdb.
- Server apps listed (14): initdb, pg_archivecleanup, pg_checksums, pg_controldata, pg_createsubscriber, pg_ctl, pg_resetwal, pg_rewind, pg_test_fsync, pg_test_timing, pg_upgrade, pg_waldump, pg_walsummary, postgres.
- Full SQL command list with one-line purposes: see "Complete inventories".

### Common ownership / privilege rule for ALTER ... OWNER TO / SET SCHEMA  [M1, M6]  (source: nearly every ALTER page)
- Pattern repeated on ALTER AGGREGATE/COLLATION/CONVERSION/DOMAIN/FOREIGN TABLE/FUNCTION/MATERIALIZED VIEW/OPERATOR/OPERATOR CLASS/PROCEDURE/ROUTINE/SEQUENCE/STATISTICS/TABLE/TYPE/VIEW/TEXT SEARCH *: you must own the object; SET SCHEMA additionally needs CREATE on the new schema; OWNER TO requires that you can SET ROLE to the new owner AND that the new owner has CREATE on the object's schema. Rationale (verbatim idea): "altering the owner doesn't do anything you couldn't do by dropping and recreating the object". Superusers bypass.
- OWNER TO accepts `{ new_owner | CURRENT_ROLE | CURRENT_USER | SESSION_USER }`.
- Function/procedure identity = name + input arg types only (IN, INOUT, VARIADIC). OUT args and arg names are ignored when referencing. If no arg list is given the name must be unique in its schema.

### ABORT  [M5]  (source: sql-abort.txt)
- `ABORT [ WORK | TRANSACTION ] [ AND [ NO ] CHAIN ]` — identical to ROLLBACK; historical PG extension. AND CHAIN starts a new txn with the same characteristics (see SET TRANSACTION). Outside a transaction block: warning, no effect.

### ALTER AGGREGATE  [M6]  (source: sql-alteraggregate.txt)
- RENAME TO / OWNER TO / SET SCHEMA. Signature: `*` (zero-arg), arg list, or `[direct args] ORDER BY agg args` for ordered-set aggregates. argmode IN or VARIADIC. Abbreviated form (no ORDER BY, one merged list) also works; if VARIADIC "any" was in both lists write it once.

### ALTER COLLATION / collation versioning  [M2, M4]  (source: sql-altercollation.txt)
- `ALTER COLLATION name REFRESH VERSION | RENAME TO | OWNER TO | SET SCHEMA`.
- When a collation is created the provider-specific version is recorded in catalog (`pg_collation.collversion`); on use the current version is compared; mismatch => `WARNING: collation "xx-x-icu" has version mismatch` with HINT to rebuild objects and run REFRESH VERSION.
- A change in collation definition can corrupt indexes (stored sort order assumptions). Happens legitimately on OS major upgrade or pg_upgrade to binaries linked with newer ICU. Fix: rebuild all dependent objects (e.g. REINDEX) then `ALTER COLLATION ... REFRESH VERSION` — which only updates the catalog; it does NOT check that objects were rebuilt.
- Version info availability: libc => GNU C library (most Linux), FreeBSD, Windows; ICU => all platforms. glibc: C library version used as proxy (imperfect: distros can back-port). Windows: only collations defined with BCP 47 tags such as en-US.
- Database default collation analogue: `ALTER DATABASE ... REFRESH COLLATION VERSION`.
- Query to find collations needing refresh + dependents: join `pg_depend` to `pg_collation` where `c.collversion <> pg_collation_actual_version(c.oid)`, using `pg_describe_object(...)`.

### ALTER CONVERSION  [M2]  (source: sql-alterconversion.txt)
- RENAME TO / OWNER TO / SET SCHEMA only.

### ALTER DATABASE  [M1, M7]  (source: sql-alterdatabase.txt)
- Options: `ALLOW_CONNECTIONS allowconn` (false => no one can connect), `CONNECTION LIMIT connlimit` (-1 = no limit), `IS_TEMPLATE istemplate` (true => clonable by any user with CREATEDB; false => only superusers or owner).
- RENAME TO: owner or superuser; non-superuser owner also needs CREATEDB; the current database cannot be renamed.
- OWNER TO: must be able to SET ROLE to new owner and have CREATEDB.
- SET TABLESPACE: owner/superuser + CREATE on new tablespace; physically moves tables/indexes in the old default tablespace; new default tablespace must be empty for this database; no one may be connected; objects in non-default tablespaces unaffected; file copy method governed by `file_copy_method` GUC (v18). Cannot run inside a transaction block.
- REFRESH COLLATION VERSION.
- `SET configuration_parameter { TO | = } { value | DEFAULT }`, `SET ... FROM CURRENT`, `RESET param`, `RESET ALL`: per-database session default, applied at new session start, overrides postgresql.conf and postgres command line. Role-specific settings (ALTER ROLE) override database-specific ones.
- Example: `ALTER DATABASE test SET enable_indexscan TO off;`

### ALTER DEFAULT PRIVILEGES  [M1]  (source: sql-alterdefaultprivileges.txt)
- `ALTER DEFAULT PRIVILEGES [ FOR { ROLE | USER } target_role [, ...] ] [ IN SCHEMA schema_name [, ...] ] abbreviated_grant_or_revoke`.
- Object classes + grantable privileges: TABLES (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN); SEQUENCES (USAGE, SELECT, UPDATE); FUNCTIONS|ROUTINES (EXECUTE); TYPES (USAGE); SCHEMAS (USAGE, CREATE); LARGE OBJECTS (SELECT, UPDATE) (large objects new in this list for v18). Tables include views and foreign tables; functions include aggregates and procedures; types include domains. FUNCTIONS == ROUTINES (cannot set separately for functions vs procedures).
- Affects only objects created in the future. At creation time only the default privileges of the *current role* apply — not inherited from roles the current role is a member of.
- Per-schema defaults are ADDED to global defaults: you cannot revoke per-schema something granted globally. Per-schema REVOKE only undoes an earlier per-schema GRANT. Example of a no-op: `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;` To truly remove PUBLIC EXECUTE: `ALTER DEFAULT PRIVILEGES FOR ROLE admin REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;` (global).
- IN SCHEMA not allowed for SCHEMAS and LARGE OBJECTS.
- psql `\ddp` shows them. To drop a role with altered default privileges: reverse the changes or `DROP OWNED BY`.

### ALTER DOMAIN  [M2]  (source: sql-alterdomain.txt)
- Sub-forms: SET DEFAULT expr / DROP DEFAULT (only affects subsequent INSERTs); SET/DROP NOT NULL (SET only if no column using the domain has nulls); ADD domain_constraint [NOT VALID] (`[CONSTRAINT name] { NOT NULL | CHECK (expr) }`; NOT VALID only for CHECK; new/updated rows are always checked even against NOT VALID constraints); DROP CONSTRAINT [IF EXISTS] name [RESTRICT|CASCADE]; RENAME CONSTRAINT; VALIDATE CONSTRAINT; OWNER TO; RENAME TO; SET SCHEMA (moves its constraints too).
- Caveat: ADD CONSTRAINT's check of existing data is "not bulletproof" — cannot see uncommitted concurrent inserts/updates. Safe recipe: ADD ... NOT VALID; commit; wait until all transactions started before that commit finish; then VALIDATE CONSTRAINT.
- ADD CONSTRAINT, VALIDATE CONSTRAINT and SET NOT NULL fail if the domain (or a derived domain) is used in a container-type column (composite, array, range) in any table.

### ALTER EVENT TRIGGER  [M6]  (source: sql-altereventtrigger.txt)
- `DISABLE | ENABLE [ REPLICA | ALWAYS ] | OWNER TO | RENAME TO`. Superuser only. Disabled trigger still known but not executed. Related GUC `session_replication_role`.

### ALTER EXTENSION  [M6]  (source: sql-alterextension.txt)
- `UPDATE [ TO new_version ]` (needs update script(s) from installed version to target; default target = control file's default_version; version may be identifier or string literal); `SET SCHEMA` (extension must be relocatable); `ADD member_object` / `DROP member_object` (mainly for update scripts; ADD makes object droppable only via dropping extension; DROP only disassociates).
- member_object kinds (28): ACCESS METHOD, AGGREGATE, CAST, COLLATION, CONVERSION, DOMAIN, EVENT TRIGGER, FOREIGN DATA WRAPPER, FOREIGN TABLE, FUNCTION, MATERIALIZED VIEW, OPERATOR, OPERATOR CLASS, OPERATOR FAMILY, [PROCEDURAL] LANGUAGE, PROCEDURE, ROUTINE, SCHEMA, SEQUENCE, SERVER, TABLE, TEXT SEARCH CONFIGURATION/DICTIONARY/PARSER/TEMPLATE, TRANSFORM FOR type LANGUAGE lang, TYPE, VIEW.
- Must own the extension; ADD/DROP need ownership of the object too.

### ALTER FOREIGN DATA WRAPPER  [M6]  (source: sql-alterforeigndatawrapper.txt)
- `[ HANDLER fn | NO HANDLER ] [ VALIDATOR fn | NO VALIDATOR ] [ OPTIONS ( [ADD|SET|DROP] option ['value'], ...) ]`, OWNER TO, RENAME TO. Superuser only; only superusers can own FDWs.
- NO HANDLER => foreign tables using it cannot be accessed. Changing VALIDATOR does not re-check pre-existing options of the FDW/servers/user mappings/foreign tables. OPTIONS: ADD assumed if no action given; names unique.

### ALTER FOREIGN TABLE  [M6]  (source: sql-alterforeigntable.txt)
- Actions: ADD/DROP COLUMN, ALTER COLUMN [SET DATA] TYPE, SET/DROP DEFAULT, SET/DROP NOT NULL, SET STATISTICS, SET/RESET (attribute_option), SET STORAGE {PLAIN|EXTERNAL|EXTENDED|MAIN|DEFAULT}, column OPTIONS, ADD table_constraint [NOT VALID], VALIDATE CONSTRAINT, DROP CONSTRAINT, DISABLE/ENABLE [REPLICA|ALWAYS] TRIGGER, SET WITHOUT OIDS (no-op), INHERIT/NO INHERIT, OWNER TO, OPTIONS; plus RENAME [COLUMN], RENAME TO, SET SCHEMA.
- Nothing happens to underlying storage: ADD COLUMN / SET DATA TYPE just change what PG believes. Constraints (only CHECK and NOT NULL supported) are NOT verified — merely declared as assumed true; NOT VALID (CHECK only) = recorded but not assumed; VALIDATE CONSTRAINT just marks valid without checking.
- User's responsibility that definition matches remote side. Can drop the only column (zero-column foreign table; PG extension).

### ALTER FUNCTION / ALTER PROCEDURE / ALTER ROUTINE  [M6]  (source: sql-alterfunction.txt, sql-alterprocedure.txt, sql-alterroutine.txt)
- ALTER FUNCTION actions: `CALLED ON NULL INPUT | RETURNS NULL ON NULL INPUT | STRICT`; `IMMUTABLE | STABLE | VOLATILE`; `[NOT] LEAKPROOF`; `[EXTERNAL] SECURITY INVOKER | DEFINER`; `PARALLEL { UNSAFE | RESTRICTED | SAFE }`; `COST execution_cost`; `ROWS result_rows`; `SUPPORT support_function` (superuser; cannot remove — use CREATE OR REPLACE FUNCTION); `SET param {TO|=} {value|DEFAULT}`, `SET param FROM CURRENT`, `RESET param`, `RESET ALL`. Trailing `RESTRICT` ignored.
- Other forms: RENAME TO, OWNER TO (a SECURITY DEFINER function will subsequently execute as the new owner), SET SCHEMA, `[NO] DEPENDS ON EXTENSION ext` (dependent function is dropped when the extension is dropped even without CASCADE; can depend on multiple extensions, dropped when any one is dropped).
- Example hardening: `ALTER FUNCTION check_password(text) SET search_path = admin, pg_temp;`
- ALTER PROCEDURE actions limited to SECURITY INVOKER/DEFINER and SET/RESET config; same rename/owner/schema/depends forms.
- ALTER ROUTINE: same action list as ALTER FUNCTION, applies to function, aggregate or procedure without having to say which (see sql-alterroutine notes below).

### ALTER GROUP  [M1]  (source: sql-altergroup.txt)
- Obsolete. `ADD USER` / `DROP USER` == GRANT/REVOKE role membership (without ADMIN OPTION / grantor options); `RENAME TO` == ALTER ROLE RENAME.

### ALTER INDEX  [M4]  (source: sql-alterindex.txt)
- Forms: `RENAME TO` (SHARE UPDATE EXCLUSIVE lock; renames the associated UNIQUE/PRIMARY KEY/EXCLUDE constraint as well; no effect on stored data); `SET TABLESPACE` (moves data files; need to own index + CREATE on tablespace); `ALL IN TABLESPACE name [OWNED BY role,...] SET TABLESPACE new [NOWAIT]` (locks all indexes to move then moves each; NOWAIT fails if locks not immediately available; system catalogs not moved); `ATTACH PARTITION index_name` (index on a partition, equivalent definition; attached index cannot be dropped by itself; if already attached the command tries to validate an invalid parent); `[NO] DEPENDS ON EXTENSION`; `SET ( storage_parameter [= value] )` / `RESET (...)` (index contents not modified immediately — may need REINDEX); `ALTER [COLUMN] column_number SET STATISTICS integer` (only for expression index columns, referenced by ordinal; range 0..10000, -1 = revert to default_statistics_target).
- Lock: ACCESS EXCLUSIVE unless noted; with multiple subcommands the strictest applies.
- ALTER INDEX is just an alias for the ALTER TABLE forms that apply to indexes. ALTER INDEX OWNER is ignored with a warning (index owner always = table owner). System catalog indexes cannot be changed.
- Example: `ALTER INDEX distributors SET (fillfactor = 75); REINDEX INDEX distributors;` and `CREATE INDEX coord_idx ON measured (x, y, (z + t)); ALTER INDEX coord_idx ALTER COLUMN 3 SET STATISTICS 1000;`

### ALTER LANGUAGE / ALTER LARGE OBJECT  [M6, M2]  (source: sql-alterlanguage.txt, sql-alterlargeobject.txt)
- ALTER [PROCEDURAL] LANGUAGE: RENAME TO, OWNER TO only (superuser or owner).
- ALTER LARGE OBJECT large_object_oid OWNER TO ...: only functionality; must own + be able to SET ROLE to new owner.

### ALTER MATERIALIZED VIEW  [M6]  (source: sql-altermaterializedview.txt)
- Actions (subset of ALTER TABLE, same meaning): ALTER COLUMN SET STATISTICS / SET (attribute_option) / RESET / SET STORAGE / SET COMPRESSION; CLUSTER ON index; SET WITHOUT CLUSTER; SET ACCESS METHOD; SET TABLESPACE; SET/RESET (storage_parameter); OWNER TO. Also [NO] DEPENDS ON EXTENSION, RENAME [COLUMN], RENAME TO, SET SCHEMA, `ALL IN TABLESPACE ... SET TABLESPACE ... [NOWAIT]`.

### ALTER OPERATOR / OPERATOR CLASS / OPERATOR FAMILY  [M4, M6]  (source: sql-alteroperator.txt, sql-alteropclass.txt, sql-alteropfamily.txt)
- ALTER OPERATOR name ({left_type|NONE}, right_type): OWNER TO, SET SCHEMA, `SET ( RESTRICT = {res_proc|NONE} | JOIN = {join_proc|NONE} | COMMUTATOR = com_op | NEGATOR = neg_op | HASHES | MERGES )`. COMMUTATOR/NEGATOR can only be set if none exists; setting also sets the reverse link on the other operator (must own both). HASHES / MERGES can only be enabled, never disabled.
- ALTER OPERATOR CLASS name USING index_method: RENAME/OWNER/SET SCHEMA only.
- ALTER OPERATOR FAMILY name USING index_method `ADD { OPERATOR strategy_number op (op_type, op_type) [FOR SEARCH | FOR ORDER BY sort_family_name] | FUNCTION support_number [(op_type[,op_type])] fn [(argtypes)] }`, `DROP { OPERATOR strategy_number (op_type[,op_type]) | FUNCTION support_number (op_type[,op_type]) }`, RENAME/OWNER/SET SCHEMA. Superuser only ("an erroneous operator family definition could confuse or even crash the server").
- Members added this way are "loose" in the family (not part of any opclass): compatible with family semantics but not required by any index; loose members can be dropped any time, opclass members cannot be dropped without dropping the class and dependent indexes. Typical: single-type ops in opclasses, cross-type ops loose in the family.
- No consistency/completeness check performed. DROP addresses the "slot" (strategy/support number + types) not the name. FOR SEARCH is default. For btree comparison functions and hash functions op_type may be omitted; for btree sort support, btree equal image, and all GiST/SP-GiST/GIN functions op_type must be given.
- Including a function/operator in an opfamily is tantamount to granting public EXECUTE (index machinery does not check permissions). Operators should not be SQL functions (inlining prevents index matching).
- Example adds int4-vs-int2 cross-type btree operators 1..5 (`<`,`<=`,`=`,`>=`,`>`) + FUNCTION 1 btint42cmp(int4,int2) / btint24cmp(int2,int4) to integer_ops.

### ALTER POLICY  [M6, M1]  (source: sql-alterpolicy.txt)
- `ALTER POLICY name ON table RENAME TO new` or `[TO roles] [USING (expr)] [WITH CHECK (expr)]` — each clause replaced independently; omitted clauses unchanged. Cannot change the command (ALL/SELECT/...) or PERMISSIVE/RESTRICTIVE — must drop and recreate. Must own the table.

### ALTER PUBLICATION  [M7]  (source: sql-alterpublication.txt)
- `ADD publication_object`, `SET publication_object` (replaces whole list), `DROP publication_drop_object`, `SET ( publication_parameter [= value] )`, OWNER TO, RENAME TO.
- publication_object: `TABLE [ONLY] t [*] [(col,...)] [WHERE (expr)]` or `TABLES IN SCHEMA { schema | CURRENT_SCHEMA }`. DROP TABLE form takes no column list / WHERE.
- Adding tables to an already-subscribed publication requires `ALTER SUBSCRIPTION ... REFRESH PUBLICATION` on the subscriber. DROP TABLES IN SCHEMA does not drop tables added individually via FOR TABLE/ADD TABLE.
- Privileges: own publication; ADD TABLE needs table ownership; ADD/SET TABLES IN SCHEMA needs superuser; new owner must have CREATE on database; new owner of FOR ALL TABLES / FOR TABLES IN SCHEMA publication must be superuser.
- Not supported: adding/setting a schema when the publication also publishes a table with a column list, and vice versa. A subscription with several publications publishing the same table with different column lists is not supported.
- WHERE: rows where expr is false or null are not published; parentheses required; evaluated with the replication connection's role.
- Caution: altering `publish_via_partition_root` can cause data loss or duplication at the subscriber (changes identity/schema of published tables; only when a partition root is the replication target). Avoid modifying leaf partitions between ALTER PUBLICATION ... SET and ALTER SUBSCRIPTION ... REFRESH PUBLICATION, and refresh with `copy_data = off`.
- Example: `ALTER PUBLICATION noinsert SET (publish = 'update, delete');`

### ALTER ROLE / ALTER USER  [M1]  (source: sql-alterrole.txt, sql-alteruser.txt)
- Options: SUPERUSER|NOSUPERUSER, CREATEDB|NOCREATEDB, CREATEROLE|NOCREATEROLE, INHERIT|NOINHERIT, LOGIN|NOLOGIN, REPLICATION|NOREPLICATION, BYPASSRLS|NOBYPASSRLS, CONNECTION LIMIT n, [ENCRYPTED] PASSWORD 'pw' | PASSWORD NULL, VALID UNTIL 'timestamp'. No membership options (use GRANT/REVOKE).
- Who may change: superusers anything (except SUPERUSER property of the bootstrap superuser); CREATEROLE roles can change most properties but only for non-superuser, non-replication roles on which they hold ADMIN OPTION; non-superusers cannot change SUPERUSER and can change CREATEDB/REPLICATION/BYPASSRLS only if they have that property; ordinary roles can only change their own password.
- RENAME TO: current session user cannot be renamed; renaming clears an MD5-encrypted password (role name is the MD5 salt).
- `ALTER ROLE { role | ALL } [ IN DATABASE db ] SET param ... | RESET param | RESET ALL`: session default applied only at login (SET ROLE / SET SESSION AUTHORIZATION do not apply them). Precedence (highest first): database-role-specific > role-specific > database-specific > (all-roles) > postgresql.conf/command line. ALL + IN DATABASE == ALTER DATABASE ... SET. Only superusers can change a setting for all roles in all databases.
- Password caution: cleartext sent to server, may be logged; use psql `\password`.
- Examples: `ALTER ROLE worker_bee SET maintenance_work_mem = 100000;` `ALTER ROLE fred IN DATABASE devel SET client_min_messages = DEBUG;` `ALTER ROLE fred VALID UNTIL 'infinity';`

### ALTER ROUTINE / ALTER RULE / ALTER SCHEMA  [M6, M1]  (source: sql-alterroutine.txt, sql-alterrule.txt, sql-alterschema.txt)
- ALTER ROUTINE: works whether target is aggregate, function or procedure. Actions: IMMUTABLE|STABLE|VOLATILE, [NOT] LEAKPROOF, SECURITY INVOKER|DEFINER, PARALLEL {UNSAFE|RESTRICTED|SAFE}, COST, ROWS, SET/RESET config (note: no STRICT / SUPPORT actions here); plus RENAME TO, OWNER TO, SET SCHEMA, [NO] DEPENDS ON EXTENSION. "There is no CREATE ROUTINE command."
- ALTER RULE name ON table RENAME TO new — only action; must own the table/view. The whole rewrite rule system is a PG extension.
- ALTER SCHEMA: RENAME TO (needs CREATE on database; new name cannot begin with `pg_`), OWNER TO (new owner needs CREATE on database).

### ALTER SEQUENCE  [M2, M5]  (source: sql-altersequence.txt)
- `ALTER SEQUENCE [IF EXISTS] name [AS data_type] [INCREMENT [BY] n] [MINVALUE n | NO MINVALUE] [MAXVALUE n | NO MAXVALUE] [[NO] CYCLE] [START [WITH] n] [RESTART [[WITH] n]] [CACHE n] [OWNED BY { table.column | NONE }]`; `SET { LOGGED | UNLOGGED }` (not for temp sequences); OWNER TO; RENAME TO; SET SCHEMA.
- AS data_type: smallint, integer, bigint. Changing type auto-adjusts min/max only if they equalled the old type's min/max (i.e. NO MINVALUE/NO MAXVALUE); else preserved; error if they don't fit.
- NO MINVALUE defaults: 1 (ascending) / type minimum (descending). NO MAXVALUE defaults: type maximum (ascending) / -1 (descending).
- START WITH only changes the *recorded start value* used by future `RESTART`; no effect on current value. `RESTART [WITH n]` ~ `setval(..., is_called = false)`: next nextval returns n. Unlike setval, RESTART is transactional and blocks concurrent transactions from obtaining numbers from the sequence.
- CACHE minimum 1 (= no cache).
- OWNED BY table.col: sequence auto-dropped with column/table; table must have same owner and schema as the sequence; OWNED BY NONE = free-standing.
- Notes: other backends holding preallocated (cached) values keep using them until exhausted before noticing new parameters; current backend affected immediately. Does not affect currval status. ALTER SEQUENCE blocks concurrent nextval, currval, lastval, setval. ALTER TABLE also works on sequences for historical reasons (only equivalent variants).

### ALTER SERVER / ALTER STATISTICS  [M6, M4]  (source: sql-alterserver.txt, sql-alterstatistics.txt)
- ALTER SERVER name [VERSION 'v'] [OPTIONS ([ADD|SET|DROP] opt ['val'],...)], OWNER TO (needs USAGE on the server's FDW), RENAME TO.
- ALTER STATISTICS name OWNER TO | RENAME TO | SET SCHEMA | `SET STATISTICS { new_target | DEFAULT }` — target range 0..10000; DEFAULT reverts to default_statistics_target (-1 is obsolete spelling).

### ALTER SUBSCRIPTION  [M7]  (source: sql-altersubscription.txt)
- Forms: `CONNECTION 'conninfo'`; `SET|ADD|DROP PUBLICATION pub,... [WITH (refresh [= bool], + refresh options)]` (refresh default true; non-existent publications allowed in ADD/SET); `REFRESH PUBLICATION [WITH (copy_data [= bool])]` (default true; previously subscribed tables are not re-copied even if row filter changed); `ENABLE` / `DISABLE` (apply worker started/stopped at end of transaction); `SET (subscription_parameter ...)`; `SKIP (lsn = value)`; OWNER TO; RENAME TO.
- Alterable parameters: slot_name, synchronous_commit, binary, streaming, disable_on_error, password_required, run_as_owner, origin, failover, two_phase. Only superuser can set password_required = false; if a subscription has password_required=false only superusers can modify it. failover and two_phase alterable only while subscription is disabled.
- Privileges: own subscription; rename/owner change need CREATE on database.
- REFRESH removes relations no longer in the publication and their table synchronization slots (error if slots can't be removed remotely; retry or disassociate slot per DROP SUBSCRIPTION).
- Cannot run inside a transaction block: REFRESH PUBLICATION; SET/ADD/DROP PUBLICATION with refresh=true; SET (failover = ...); SET (two_phase = false). REFRESH (explicit or implicit) also not allowed when two_phase is enabled unless copy_data = false; check `pg_subscription.subtwophasestate`.
- When altering slot_name, the slot's own failover/two_phase properties may differ from the subscription's — user must keep them matching.
- two_phase true -> false errors if prepared transactions from the apply worker exist; their GIDs follow pattern `pg_gid_%u_%u` (subscription oid, remote xid); find via `pg_prepared_xacts`; after the change the publisher re-sends those txns at commit.
- SKIP (lsn = pg_lsn): skips all data changes of the remote transaction whose *finish LSN* (commit or prepare LSN) equals the value; used when incoming data violates a constraint and replication is stuck. No effect on already-prepared txns; subtransactions can't be skipped individually; `NONE` resets. LSN stored in `pg_subscription.subskiplsn`, cleared after the skip or after any transaction finishes.
- Boolean parameters: `= value` may be omitted (= TRUE).

### ALTER SYSTEM  [M1, M7]  (source: sql-altersystem.txt)
- `ALTER SYSTEM SET param { TO | = } { value [, ...] | DEFAULT }`, `ALTER SYSTEM RESET param`, `ALTER SYSTEM RESET ALL`.
- Writes to `postgresql.auto.conf` (read in addition to postgresql.conf). DEFAULT/RESET removes the entry; RESET ALL removes all entries.
- Takes effect after next config reload (`pg_reload_conf()`, `pg_ctl reload`, or SIGHUP to the main server process) or next restart for start-only parameters.
- Only superusers and users granted the ALTER SYSTEM privilege on a parameter. Acts directly on the filesystem, cannot be rolled back => not allowed in a transaction block or function.
- Cannot set `data_directory`, `allow_alter_system`, or parameters not allowed in postgresql.conf (preset options). `allow_alter_system = off` disables the command but "is not a security mechanism".
- Example: `ALTER SYSTEM SET wal_level = replica;` / `ALTER SYSTEM RESET wal_level;`

### ALTER TABLE — full sub-form catalogue with lock levels and rewrite behaviour  [M2, M5, M4, M7]  (source: sql-altertable.txt)
**General rule**: "An ACCESS EXCLUSIVE lock is acquired unless explicitly noted. When multiple subcommands are given, the lock acquired will be the strictest one required by any subcommand." All single-table actions except RENAME, SET SCHEMA, ATTACH PARTITION, DETACH PARTITION can be combined in one comma list — combined into a single pass (scan/rewrite) over the table.

Lock-level table (explicitly documented exceptions; everything else = ACCESS EXCLUSIVE):
| Sub-form | Lock |
|---|---|
| ALTER COLUMN SET STATISTICS | SHARE UPDATE EXCLUSIVE |
| ALTER COLUMN SET/RESET (attribute_option) (n_distinct, n_distinct_inherited) | SHARE UPDATE EXCLUSIVE |
| VALIDATE CONSTRAINT | SHARE UPDATE EXCLUSIVE on altered table (+ ROW SHARE on referenced table for FK) |
| CLUSTER ON / SET WITHOUT CLUSTER | SHARE UPDATE EXCLUSIVE |
| SET (storage_parameter) for fillfactor, toast.* and autovacuum* params, and parallel_workers | SHARE UPDATE EXCLUSIVE |
| ADD FOREIGN KEY | SHARE ROW EXCLUSIVE on the table AND on the referenced table |
| DISABLE/ENABLE [REPLICA|ALWAYS] TRIGGER | SHARE ROW EXCLUSIVE |
| ATTACH PARTITION | SHARE UPDATE EXCLUSIVE on parent; ACCESS EXCLUSIVE on table being attached and on the default partition (if any); further locks on all sub-partitions if either is partitioned (avoidable with a CHECK constraint, Sec. 5.12.2.2) |
| DETACH PARTITION (plain) | ACCESS EXCLUSIVE (default rule); SHARE lock on any tables that reference the partitioned table via FK |
| DETACH PARTITION CONCURRENTLY | txn 1: SHARE UPDATE EXCLUSIVE on parent and partition, mark partition as undergoing detach, commit, wait for all other transactions using the partitioned table; txn 2: SHARE UPDATE EXCLUSIVE on parent + ACCESS EXCLUSIVE on partition, complete detach |
| ALTER INDEX ... RENAME (via ALTER INDEX page) | SHARE UPDATE EXCLUSIVE |

Sub-forms:
- `ADD [COLUMN] [IF NOT EXISTS] col type [COLLATE c] [column_constraint ...]` — same syntax as CREATE TABLE.
  - Non-volatile DEFAULT: evaluated once at statement time, stored in table metadata, returned for existing rows on access; applied physically only when the table is later rewritten => "very fast even on large tables"; no rewrite. No default => NULL, no rewrite.
  - REWRITE of table + indexes when adding: a column with a volatile DEFAULT (e.g. clock_timestamp()), a stored generated column, an identity column, or a column of a domain type that has constraints. Adding a virtual generated column never requires a rewrite.
- `DROP [COLUMN] [IF EXISTS] col [RESTRICT|CASCADE]` — indexes and table constraints involving the column are dropped too; multivariate statistics referencing it are removed if they would be left with only a single column; CASCADE needed for outside dependents (FK references, views). Does NOT physically remove the column: makes it invisible; later inserts/updates store NULL for it; space reclaimed over time as rows are updated; force reclaim with any rewriting ALTER TABLE form. Can drop the only column (zero-column table, PG extension).
- `ALTER [COLUMN] col [SET DATA] TYPE type [COLLATE c] [USING expr]` — indexes and simple constraints auto-converted by reparsing the original expression. USING required if no implicit/assignment cast. Column statistics are removed => ANALYZE afterwards (not needed for virtual generated columns: they never have statistics).
  - Normally rewrites table + indexes. Exception: no table rewrite if USING does not change contents and old type is binary coercible to the new type or an unconstrained domain over it. Indexes are still rebuilt unless the system can verify logical equivalence (e.g. collation change forces rebuild; text <-> varchar without collation change needs no index rebuild).
  - USING may reference other columns; it is NOT applied to the column default — if no cast exists, DROP DEFAULT, alter type, then SET DEFAULT (all in one command works). Same for indexes/constraints.
- `ALTER COLUMN col SET DEFAULT expr | DROP DEFAULT` — only affects subsequent INSERT/UPDATE.
- `ALTER COLUMN col { SET | DROP } NOT NULL` — SET requires full table scan, unless NOT VALID is used, or a valid CHECK constraint proves no NULLs (scan skipped). If the column has an invalid not-null constraint, SET NOT NULL validates it. Partition rule: cannot DROP NOT NULL on a partition if marked NOT NULL in parent; children may be stricter than parent, not looser; can drop from ONLY the parent.
- `ALTER COLUMN col SET EXPRESSION AS (expr)` — replaces generation expression; stored generated column data is rewritten; stats removed for stored columns.
- `ALTER COLUMN col DROP EXPRESSION [IF EXISTS]` — stored generated column becomes normal column keeping data; only stored (not virtual) supported.
- `ADD GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY [(sequence_options)]`, `SET GENERATED { ALWAYS | BY DEFAULT }`, `DROP IDENTITY [IF EXISTS]`, `SET sequence_option`, `RESTART [[WITH] n]` — affect only subsequent INSERT/UPDATE; alter the underlying sequence.
- `SET STATISTICS { integer | DEFAULT }` — range 0..10000; DEFAULT => default_statistics_target (-1 obsolete).
- `SET ( attribute_option = value )` / `RESET` — only `n_distinct` and `n_distinct_inherited`: positive => exact number of distinct non-null values; values in [-1, 0) => fraction multiplied by estimated row count (-1 = all distinct, -0.5 = each value appears twice on average). n_distinct_inherited applies to table + inheritance children stats and partitioned-table stats.
- `SET STORAGE { PLAIN | EXTERNAL | EXTENDED | MAIN | DEFAULT }` — PLAIN: inline, uncompressed (required for fixed-length types); MAIN: inline, compressible; EXTERNAL: external, uncompressed (faster substring on very large text/bytea, more space); EXTENDED: external, compressed (default for most types supporting non-PLAIN). Doesn't change existing data — sets strategy for future updates (Sec. 66.2).
- `SET COMPRESSION method` — pglz, lz4 (needs --with-lz4), or `default` (consult `default_toast_compression` at insert time). No rewrite; existing values keep old method; pg_restore rewrites with configured method; INSERT ... SELECT may carry over already-compressed values without recompressing (not necessarily detoasted).
- `ADD table_constraint [NOT VALID]` — NOT VALID allowed only for foreign-key, CHECK and not-null constraints. Normally scans table (CHECK/NOT NULL: scan, no rewrite; a NOT ENFORCED CHECK: no verification). NOT VALID skips the scan; constraint still enforced for new inserts/updates but not assumed to hold until VALIDATE CONSTRAINT.
- `ADD table_constraint_using_index`: `[CONSTRAINT name] { UNIQUE | PRIMARY KEY } USING INDEX index_name [DEFERRABLE...]` — index must be unique, b-tree, default sort ordering, no expression columns, not partial. For PRIMARY KEY, columns not already NOT NULL get SET NOT NULL (full scan); otherwise fast. Index renamed to constraint name if given; index becomes owned by the constraint. Not supported on partitioned tables. Recipe: `CREATE UNIQUE INDEX CONCURRENTLY dist_id_temp_idx ON distributors (dist_id); ALTER TABLE distributors DROP CONSTRAINT distributors_pkey, ADD CONSTRAINT distributors_pkey PRIMARY KEY USING INDEX dist_id_temp_idx;`
- `ALTER CONSTRAINT name [DEFERRABLE | NOT DEFERRABLE] [INITIALLY DEFERRED | INITIALLY IMMEDIATE] [ENFORCED | NOT ENFORCED]` — currently only foreign key constraints. `ALTER CONSTRAINT name [INHERIT | NO INHERIT]` — only not-null constraints; marking inheritable adds equivalent constraint to children; marking non-inheritable leaves children's constraint (marked no longer inherited). (ENFORCED/NOT ENFORCED and INHERIT forms are v18 additions.)
- `VALIDATE CONSTRAINT name` — FK, CHECK or not-null created NOT VALID; scans table; error if constraint is NOT ENFORCED; no-op if already valid.
- `DROP CONSTRAINT [IF EXISTS] name [RESTRICT|CASCADE]` — also drops underlying index.
- `DISABLE TRIGGER [name | ALL | USER]`, `ENABLE TRIGGER ...`, `ENABLE REPLICA TRIGGER name`, `ENABLE ALWAYS TRIGGER name` — disabled trigger still known but not executed; for deferred triggers enable status is checked when the event occurs. USER excludes internally generated constraint triggers (FK, deferrable unique/exclusion); ALL including those needs superuser (integrity not guaranteed if disabled). `session_replication_role`: plain-enabled triggers fire in "origin" (default) or "local"; ENABLE REPLICA only in "replica"; ENABLE ALWAYS always. Hence by default triggers do not fire on (logical) replicas. On partitioned table, clone triggers in partitions updated too unless ONLY.
- `DISABLE/ENABLE [REPLICA|ALWAYS] RULE name` — same semantics; ignored for ON SELECT rules (always applied so views keep working).
- `ENABLE | DISABLE ROW LEVEL SECURITY` — enabled with no policies => default-deny. Policies can exist while RLS disabled (ignored). `FORCE | NO FORCE ROW LEVEL SECURITY` — whether RLS applies to the table owner (default: not applied to owner).
- `CLUSTER ON index` (sets default index for future CLUSTER; no re-cluster), `SET WITHOUT CLUSTER`.
- `SET WITHOUT OIDS` — backward-compat no-op.
- `SET ACCESS METHOD { am | DEFAULT }` — rewrites table using that AM; DEFAULT = `default_table_access_method`. On partitioned table: nothing rewritten, future partitions default to it.
- `SET TABLESPACE ts` — moves table data files; indexes not moved; on partitioned table nothing moves but future partitions use it. `ALL IN TABLESPACE name [OWNED BY roles] SET TABLESPACE new [NOWAIT]` locks all then moves each; system catalogs not moved (information_schema relations are moved).
- `SET { LOGGED | UNLOGGED }` — not for temp tables; also changes persistence of linked sequences (identity/serial); not supported for partitioned tables.
- `SET ( storage_parameter [= value] )` / `RESET (...)` — contents not modified immediately; may need rewrite (VACUUM FULL, CLUSTER, or rewriting ALTER TABLE). Planner-related parameter changes take effect the next time the table is locked.
- `INHERIT parent` — child must already have all parent columns with matching types, and all parent CHECK and NOT NULL constraints (except NO INHERIT ones); UNIQUE/PK/FK not considered. `NO INHERIT parent`.
- `OF type_name` (columns must precisely match composite type; no inheritance) / `NOT OF`.
- `OWNER TO`.
- `REPLICA IDENTITY { DEFAULT | USING INDEX index_name | FULL | NOTHING }` — what old-row info is WAL-logged for UPDATE/DELETE (only matters for logical replication). In most cases an old column value is logged only if it differs from the new; externally stored old values are always logged. DEFAULT: old values of primary key columns (default for non-system tables; no PK => same as NOTHING). USING INDEX: index must be unique, not partial, not deferrable, only NOT NULL columns; if index dropped => NOTHING. FULL: all columns. NOTHING: none (default for system tables).
- `RENAME [COLUMN] a TO b`, `RENAME CONSTRAINT a TO b` (renames underlying index too), `RENAME TO`, `SET SCHEMA` (moves indexes, constraints, owned sequences).
- `ATTACH PARTITION p { FOR VALUES partition_bound_spec | DEFAULT }` — bound spec: `IN (...)` | `FROM (...) TO (...)` with MINVALUE/MAXVALUE | `WITH (MODULUS n, REMAINDER r)`.
  - For each index on the target: a valid equivalent index on the partition is attached (as ALTER INDEX ATTACH PARTITION), else a new one is created; invalid indexes skipped. Foreign table cannot be attached if target has UNIQUE indexes. Row-level user triggers of the target are cloned into the partition.
  - Attached table must have exactly the same columns (no more) and types; all NOT NULL and CHECK constraints of target (not NO INHERIT). FK not considered. UNIQUE/PK created in the partition if missing.
  - Regular table: full scan to validate partition constraint — avoidable by pre-adding a valid CHECK constraint that implies the partition constraint (does not work if a partition key is an expression and the partition does not accept NULLs; for list partition not accepting NULLs also add NOT NULL on the key column). Foreign table: no verification.
  - If a default partition exists it is scanned to ensure no rows belong to the new partition (also avoidable via CHECK; skipped if default partition is a foreign table).
- `DETACH PARTITION p [CONCURRENTLY | FINALIZE]` — partition continues as standalone table; attached indexes detached; clone triggers removed. CONCURRENTLY: two-transaction protocol above; adds a CHECK constraint duplicating the partition constraint to the partition; cannot run in a transaction block; not allowed if the partitioned table has a default partition. FINALIZE completes a canceled/interrupted DETACH CONCURRENTLY. At most one partition per partitioned table may be pending detach.

Notes-section facts:
- Table/index rebuilds can take long and "temporarily require as much as double the disk space".
- NOT VALID + VALIDATE pattern: ADD CONSTRAINT ... NOT VALID doesn't scan and commits immediately; VALIDATE doesn't lock out concurrent updates (other txns already enforce it) — SHARE UPDATE EXCLUSIVE only. Also useful when table has known pre-existing violations to fix at leisure.
- "The rewriting forms of ALTER TABLE are not MVCC-safe. After a table rewrite, the table will appear empty to concurrent transactions, if they are using a snapshot taken before the rewrite occurred." (Sec. 13.6)
- Inheritance: cannot add/rename/change type of a parent column without doing the same to descendants (ALTER TABLE ONLY rejected); CHECK constraint rename must recurse; a parent constraint cannot be marked valid unless valid in descendants. Recursive DROP COLUMN removes a child's column only if not inherited from another parent and never independently defined; ONLY ... DROP COLUMN marks child columns as independently defined; fails on partitioned table.
- Identity actions, CLUSTER, OWNER, TABLESPACE never recurse (act as ONLY). Trigger-state actions recurse to partitions but never to traditional-inheritance children. ADD constraint recurses only for CHECK constraints not marked NO INHERIT.
- System catalog tables cannot be altered.
- Privileges: own the table; CREATE on new schema/tablespace; own parent for INHERIT; own the table being attached; USAGE on data type for ADD COLUMN / TYPE / OF.
- Example of fill-then-change default in one command: `ALTER TABLE transactions ADD COLUMN status varchar(30) DEFAULT 'old', ALTER COLUMN status SET default 'current';`
- Example epoch conversion: `ALTER TABLE foo ALTER COLUMN foo_timestamp SET DATA TYPE timestamp with time zone USING timestamp with time zone 'epoch' + foo_timestamp * interval '1 second';`

### ALTER TABLESPACE  [M4, M1]  (source: sql-altertablespace.txt)
- RENAME TO (cannot begin with `pg_`), OWNER TO, `SET ( tablespace_option = value )`, `RESET (...)`.
- Only tablespace options: `seq_page_cost`, `random_page_cost`, `effective_io_concurrency`, `maintenance_io_concurrency` — override the same-named GUCs for relations in that tablespace (planner page-read cost, number of concurrent I/Os). Use when one tablespace's disk is faster/slower.

### ALTER TEXT SEARCH CONFIGURATION / DICTIONARY / PARSER / TEMPLATE  [M6]  (source: sql-altertsconfig.txt, sql-altertsdictionary.txt, sql-altertsparser.txt, sql-altertstemplate.txt)
- CONFIGURATION: `ADD MAPPING FOR token_type,... WITH dict,...` (error if mapping exists); `ALTER MAPPING FOR token_type,... WITH dict,...` (replaces existing mapping); `ALTER MAPPING REPLACE old WITH new` (all mappings); `ALTER MAPPING FOR token_type,... REPLACE old WITH new`; `DROP MAPPING [IF EXISTS] FOR token_type,...` (tokens of those types are then ignored); RENAME/OWNER/SET SCHEMA. Dictionaries consulted in listed order. Owner only.
- DICTIONARY: `ALTER TEXT SEARCH DICTIONARY name ( option [= value], ... )` — omitting `= value` removes the option (default used). Trick: `ALTER TEXT SEARCH DICTIONARY my_dict ( dummy );` changes nothing but forces existing sessions to re-read the dictionary's configuration files (which they otherwise never do once read). RENAME/OWNER/SET SCHEMA.
- PARSER and TEMPLATE: RENAME TO and SET SCHEMA only; superuser only.

### ALTER TRIGGER  [M6]  (source: sql-altertrigger.txt)
- `ALTER TRIGGER name ON table RENAME TO new` (clone triggers in partitions renamed too); `[NO] DEPENDS ON EXTENSION ext`. Must own the table. Enable/disable is done through ALTER TABLE (so that "all triggers" can be expressed).

### ALTER TYPE  [M2]  (source: sql-altertype.txt)
- OWNER TO, RENAME TO, SET SCHEMA; composite: `RENAME ATTRIBUTE a TO b [CASCADE|RESTRICT]`, actions `ADD ATTRIBUTE name type [COLLATE c]`, `DROP ATTRIBUTE [IF EXISTS] name`, `ALTER ATTRIBUTE name [SET DATA] TYPE type` each `[CASCADE|RESTRICT]` (CASCADE propagates to typed tables of the type and their descendants; RESTRICT, default, refuses if the type is the type of a typed table).
- Enum: `ADD VALUE [IF NOT EXISTS] 'v' [{BEFORE|AFTER} 'neighbor']` (default: appended at end); `RENAME VALUE 'old' TO 'new'` (ordering unchanged).
- Base type: `SET ( property = value )` with properties RECEIVE, SEND, TYPMOD_IN, TYPMOD_OUT, ANALYZE, SUBSCRIPT (each a function name or NONE; superuser) and STORAGE (plain|extended|external|main): plain -> other needs superuser (C functions must be TOAST-ready); other -> plain not allowed at all (TOASTed values may exist). STORAGE change does not touch stored data; only default strategy for future columns. Changes propagate automatically to domains over the type.
- Notes: an enum value added by ADD VALUE inside a transaction block cannot be used until after commit. Comparisons involving an added enum value can be slower (usually only when BEFORE/AFTER put it not at the end; also if the OID counter wrapped around since the enum's creation); regain by drop/recreate the enum or dump/restore.

### ALTER USER / ALTER USER MAPPING / ALTER VIEW  [M1, M6]  (source: sql-alteruser.txt, sql-alterusermapping.txt, sql-alterview.txt)
- ALTER USER is an alias for ALTER ROLE (identical synopsis).
- ALTER USER MAPPING FOR { user | USER | CURRENT_ROLE | CURRENT_USER | SESSION_USER | PUBLIC } SERVER s OPTIONS ([ADD|SET|DROP] ...). Server owner may alter any mapping; a user may alter own mapping if they have USAGE on the server.
- ALTER VIEW [IF EXISTS]: `ALTER [COLUMN] c SET DEFAULT expr | DROP DEFAULT`, OWNER TO, RENAME [COLUMN], RENAME TO, SET SCHEMA, `SET ( view_option [= value] )`, `RESET (...)`. View options: `check_option` (enum: local | cascaded), `security_barrier` (boolean), `security_invoker` (boolean). To change the query use CREATE OR REPLACE VIEW.
- View column default is substituted into INSERT/UPDATE targeting the view *before* rules/triggers, so it takes precedence over underlying table defaults. Demo: `CREATE TABLE base_table (id int, ts timestamptz); CREATE VIEW a_view AS SELECT * FROM base_table; ALTER VIEW a_view ALTER COLUMN ts SET DEFAULT now(); INSERT INTO base_table(id) VALUES(1); -- ts NULL` / `INSERT INTO a_view(id) VALUES(2); -- ts = now`.

### ANALYZE  [M4, M7]  (source: sql-analyze.txt)
- Syntax: `ANALYZE [ ( option [, ...] ) ] [ table_and_columns [, ...] ]`; options `VERBOSE [boolean]`, `SKIP_LOCKED [boolean]`, `BUFFER_USAGE_LIMIT size`; table_and_columns = `[ONLY] table_name [*] [(column,...)]`. Pre-v11 syntax `ANALYZE [VERBOSE] [table_and_columns,...]` still supported.
- Collects statistics into the `pg_statistic` catalog. No table list => every table (regular + partitioned) and materialized view in current database the user may analyze (not foreign tables — those only when explicitly named; FDW may not support ANALYZE => warning, nothing done).
- VERBOSE: progress messages at INFO level.
- SKIP_LOCKED: skip a relation if it can't be locked immediately. May still block when opening the relation's indexes or acquiring sample rows from partitions, inheritance children, and some foreign tables. With a conflicting lock on a partitioned table, all its partitions are skipped.
- BUFFER_USAGE_LIMIT: Buffer Access Strategy ring buffer size; 0 disables the strategy; default from `vacuum_buffer_usage_limit`; min 128 kB, max 16 GB. Size units B, kB, MB, GB, TB (bare number = kilobytes). Larger = faster ANALYZE but may evict useful pages from shared buffers.
- Privilege: MAINTAIN on the table; database owners may analyze all tables in their database except shared catalogs; tables without permission are skipped.
- Lock: "ANALYZE requires only a read lock on the target table, so it can run in parallel with other non-DDL activity."
- search_path is temporarily `pg_catalog, pg_temp` while it runs.
- Sampling: for large tables takes a random sample; stats are approximate and change slightly on each run even with unchanged data (EXPLAIN costs can shift; rarely plans change). Fix non-determinism by raising statistics target.
- Stats content: usually an MCV list and a histogram per column; either may be omitted (e.g. unique column has no common values; type lacks operators).
- Statistics target: `default_statistics_target` (default 100) or per-column `ALTER TABLE ... ALTER COLUMN ... SET STATISTICS`. Target = max number of MCV entries and max number of histogram bins. Target 0 disables stats for that column. The largest target among analyzed columns determines number of rows sampled; time/space grow proportionally.
- n_distinct can be badly estimated from a sample even at max target; override with `ALTER TABLE ... ALTER COLUMN ... SET (n_distinct = ...)`.
- Inheritance: two sets of stats — parent-only rows, and parent+all children (needed for planning the tree as a whole). Autovacuum only considers inserts/updates on the parent itself when deciding to auto-analyze, so inheritance stats go stale unless manually analyzed. By default ANALYZE also recurses to each child; ONLY disables.
- Partitioned tables: stats gathered by sampling rows from all partitions; by default also recursively analyzes each partition; ONLY disables (v18). "The autovacuum daemon does not process partitioned tables, nor does it process inheritance parents if only the children are ever modified" => periodic manual ANALYZE needed.
- Foreign-table children whose FDW lacks ANALYZE support are ignored for inheritance stats.
- Completely empty table: no new stats recorded; existing stats retained.
- Progress: `pg_stat_progress_analyze`.
- Advice: read-mostly DBs: VACUUM and ANALYZE once a day at low-usage time (insufficient under heavy updates).

### BEGIN / COMMIT / ABORT / COMMIT PREPARED  [M5]  (source: sql-begin.txt, sql-commit.txt, sql-commit-prepared.txt)
- `BEGIN [ WORK | TRANSACTION ] [ transaction_mode [, ...] ]`; transaction_mode: `ISOLATION LEVEL { SERIALIZABLE | REPEATABLE READ | READ COMMITTED | READ UNCOMMITTED }`, `READ WRITE | READ ONLY`, `[NOT] DEFERRABLE`. Commas between modes may be omitted (backward compat). Equivalent to executing SET TRANSACTION. START TRANSACTION = same.
- Without BEGIN: "autocommit" — each statement is its own transaction with implicit commit at end (rollback if it failed).
- "Statements are executed more quickly in a transaction block, because transaction start/commit requires significant CPU and disk activity."
- BEGIN inside a transaction block => warning; state unaffected; use SAVEPOINT for nesting.
- BEGIN is a PG extension (SQL standard: START TRANSACTION); DEFERRABLE is a PG extension. BEGIN means something else in embedded SQL.
- `COMMIT [ WORK | TRANSACTION ] [ AND [ NO ] CHAIN ]`: changes become visible to others and "are guaranteed to be durable if a crash occurs". AND CHAIN: new transaction started immediately with the same characteristics. COMMIT outside a transaction: warning only. COMMIT AND CHAIN outside a transaction: error.
- `COMMIT PREPARED transaction_id` (string GID, e.g. `COMMIT PREPARED 'foobar';`): must be the same user that prepared it or a superuser; need not be the same session; cannot be executed inside a transaction block; commits immediately. Prepared txns listed in `pg_prepared_xacts`. For external transaction managers (X/Open XA).

### CALL  [M6]  (source: sql-call.txt)
- `CALL name ( [argument] [, ...] )`. Procedures with output parameters return one result row with those values. Named notation `name => value` allowed. Arguments are required for all params without defaults including OUT params; OUT args are not evaluated — customary to write NULL.
- Needs EXECUTE privilege. Functions are called with SELECT, not CALL.
- "If CALL is executed in a transaction block, then the called procedure cannot execute transaction control statements." Transaction control allowed only when CALL runs in its own transaction. PL/pgSQL handles OUT params in CALL differently (Sec. 41.6.3).

### CHECKPOINT  [M7]  (source: sql-checkpoint.txt)
- Synopsis: `CHECKPOINT` (no options on this 18.7 page).
- Definition: "A checkpoint is a point in the write-ahead log sequence at which all data files have been updated to reflect the information in the log. All data files will be flushed to disk." (details Sec. 28.5)
- Forces an immediate checkpoint without waiting for the regular scheduled one (settings in Sec. 19.5.2). "CHECKPOINT is not intended for use during normal operation."
- During recovery it forces a *restartpoint* instead of writing a new checkpoint.
- Only superusers or roles with privileges of `pg_checkpoint`.

### CLOSE  [M3]  (source: sql-close.txt)
- `CLOSE { name | ALL }`. Non-holdable cursors are implicitly closed at COMMIT/ROLLBACK. Holdable cursor: closed if creating txn rolls back; if it commits, stays open until explicit CLOSE or client disconnect. No OPEN statement — DECLARE opens. View `pg_cursors`. A CLOSE after a savepoint that is later rolled back is NOT rolled back (cursor stays closed). CLOSE ALL is a PG extension.

### CLUSTER  [M2, M4, M7]  (source: sql-cluster.txt)
- `CLUSTER [ ( option [, ...] ) ] [ table_name [ USING index_name ] ]`; only option `VERBOSE [boolean]` (INFO-level progress). Older syntaxes still accepted: `CLUSTER [VERBOSE] [table [USING index]]` (pre-17), `CLUSTER index_name ON table_name` (pre-8.3).
- Physically reorders the table by the index. One-time: later inserts/updates are not kept in order. fillfactor < 100% helps preserve ordering during updates (updated rows stay on same page if space).
- PG remembers the cluster index: `CLUSTER table_name` re-clusters with it; set/clear via `ALTER TABLE ... CLUSTER ON` / `SET WITHOUT CLUSTER`. `CLUSTER` with no table re-clusters all previously clustered tables the user has privileges for — this form cannot run in a transaction block.
- Lock: ACCESS EXCLUSIVE on the table — blocks reads and writes until done.
- Privilege: MAINTAIN on the table.
- Method: either index scan on the index, or (b-tree only) seq scan + sort; chosen by planner cost parameters and statistics.
  - Index-scan method: temporary copy of table in index order + temporary copies of each index => free disk >= table size + index sizes.
  - Seqscan+sort method: plus a temporary sort file => peak temp space up to 2x table size + index sizes. Often faster; disable with `SET enable_sort = off` if space intolerable.
- Set `maintenance_work_mem` reasonably large before clustering. Run ANALYZE afterwards (planner records statistics about table ordering/correlation).
- search_path temporarily `pg_catalog, pg_temp`. Progress view `pg_stat_progress_cluster`.
- Partitioned table: clusters each partition using the partition of the specified partitioned index; index may not be omitted; cannot run in a transaction block.
- Benefit explanation: range queries / multi-row-match index lookups find matching rows on the same heap pages => fewer disk accesses.

### COMMENT  [M1]  (source: sql-comment.txt)
- `COMMENT ON <object kind> name IS { 'text' | NULL }`. 44 object kinds: ACCESS METHOD, AGGREGATE, CAST, COLLATION, COLUMN rel.col, CONSTRAINT c ON table, CONSTRAINT c ON DOMAIN d, CONVERSION, DATABASE, DOMAIN, EXTENSION, EVENT TRIGGER, FOREIGN DATA WRAPPER, FOREIGN TABLE, FUNCTION, INDEX, LARGE OBJECT oid, MATERIALIZED VIEW, OPERATOR, OPERATOR CLASS, OPERATOR FAMILY, POLICY p ON t, [PROCEDURAL] LANGUAGE, PROCEDURE, PUBLICATION, ROLE, ROUTINE, RULE r ON t, SCHEMA, SEQUENCE, SERVER, STATISTICS, SUBSCRIPTION, TABLE, TABLESPACE, TEXT SEARCH CONFIGURATION/DICTIONARY/PARSER/TEMPLATE, TRANSFORM FOR type LANGUAGE lang, TRIGGER t ON table, TYPE, VIEW.
- One comment per object; new replaces old; NULL or '' removes; dropped with the object.
- Lock: SHARE UPDATE EXCLUSIVE on the commented object.
- Only owner may comment (roles: superuser for superuser roles, else CREATEROLE + ADMIN OPTION on target; access methods: superuser).
- Read via psql `\d` family or `obj_description`, `col_description`, `shobj_description`.
- No security on viewing: any connected user sees all comments in the database; comments on shared objects (databases, roles, tablespaces) are stored globally and visible from any database. Don't put secrets in comments.

### COPY  [M3, M2, M5, M7]  (source: sql-copy.txt)
**Syntax**
- `COPY table_name [ (column,...) ] FROM { 'filename' | PROGRAM 'command' | STDIN } [ [WITH] ( option,... ) ] [ WHERE condition ]`
- `COPY { table_name [ (column,...) ] | ( query ) } TO { 'filename' | PROGRAM 'command' | STDOUT } [ [WITH] ( option,... ) ]`
- Legacy syntaxes still accepted: pre-9.0 (`[BINARY] [DELIMITER [AS] 'c'] [NULL [AS] 's'] [CSV [HEADER] [QUOTE ..] [ESCAPE ..] [FORCE NOT NULL cols | FORCE QUOTE {cols|*}]]`, BINARY/CSV as independent keywords) and pre-7.3 (`COPY [BINARY] t FROM/TO ... [[USING] DELIMITERS 'c'] [WITH NULL AS 's']`).
- Command tag: `COPY count` (rows copied). psql does not print the tag for COPY ... TO STDOUT.

**Options (complete)**
| Option | Meaning / default / restrictions |
|---|---|
| FORMAT format_name | `text` (default), `csv`, `binary` |
| FREEZE [boolean] | COPY FROM only. Load rows already frozen (as after VACUUM FREEZE). Only if the table was created or truncated in the current subtransaction, no cursors open, and no older snapshots held by this transaction. Not possible on partitioned or foreign tables. Caveat: all other sessions see the data immediately once loaded — "violates the normal rules of MVCC visibility" |
| DELIMITER 'c' | single one-byte char; default tab (text), comma (csv); not allowed in binary |
| NULL 'string' | default `\N` (text), unquoted empty string (csv); not in binary. COPY FROM stores any matching item as NULL |
| DEFAULT 'string' | COPY FROM only, not binary: wherever the string appears, the column's default value is used |
| HEADER [boolean | MATCH] | header line with column names; on input first line discarded; MATCH (COPY FROM only) requires number and names of header columns to match table's actual column names in order else error; not in binary |
| QUOTE 'c' | csv only; default double-quote; single one-byte char |
| ESCAPE 'c' | csv only; default = QUOTE value (so quote char is doubled); single one-byte char |
| FORCE_QUOTE { (cols) | * } | COPY TO, csv only; quote all non-NULL values in those columns (NULL never quoted) |
| FORCE_NOT_NULL { (cols) | * } | COPY FROM, csv only; do not match values against the null string (empty => zero-length string, not NULL) |
| FORCE_NULL { (cols) | * } | COPY FROM, csv only; match against the null string even if quoted (quoted empty string => NULL). Both FORCE_NULL and FORCE_NOT_NULL on same column: quoted null strings => NULL, unquoted null strings => empty strings |
| ON_ERROR error_action | `stop` (default; fail) or `ignore` (discard the row whose column input conversion failed and continue). ignore only for COPY FROM with text/csv. NOTICE with ignored row count at end if >= 1 discarded |
| REJECT_LIMIT maxerror | positive bigint; requires ON_ERROR=ignore; COPY fails if more errors than this. Unspecified => unlimited errors skipped (v18) |
| ENCODING 'name' | file encoding; default current client encoding (applies even when server reads/writes the file directly) |
| LOG_VERBOSITY verbosity | `default`, `verbose` (per discarded row: NOTICE with input line and column name whose conversion failed), `silent` (v18; no messages about ignored rows). Currently used only with COPY FROM + ON_ERROR ignore |
- `WHERE condition` (COPY FROM): boolean expression; rows not satisfying are not inserted. No subqueries, no generated columns; does not see changes made by the COPY itself (matters for VOLATILE functions).
- Column list omitted => all columns except generated columns. COPY FROM columns not listed get defaults.
- `( query )`: SELECT, VALUES, INSERT, UPDATE, DELETE or MERGE; parentheses required; DML needs RETURNING, and the target must not have a conditional rule, an ALSO rule, or an INSTEAD rule expanding to multiple statements.
- filename: input may be relative (relative to server process working directory = normally the data directory) but output must be absolute. Recommended always absolute.
- PROGRAM: run by the server via the shell; FROM reads its stdout, TO writes to its stdin; avoid untrusted input in the command string; may be restricted by SELinux etc. Example `COPY country TO PROGRAM 'gzip > /usr1/proj/bray/sql/country_data.gz';`

**Behaviour / Notes**
- COPY FROM appends. By default fails on first error.
- Files/programs are accessed by the *server* as the PostgreSQL OS user => allowed only for superusers or members of `pg_read_server_files`, `pg_write_server_files`, `pg_execute_server_program`. psql `\copy` instead runs COPY FROM STDIN / TO STDOUT and reads/writes a client-side file with client permissions.
- Privileges: SELECT on table for COPY TO, INSERT for COPY FROM; column privileges on listed columns suffice.
- COPY TO works with plain tables and populated materialized views; `COPY table TO` copies the same rows as `SELECT * FROM ONLY table`; partitioned tables, inheritance children, views need `COPY (SELECT * FROM table) TO`.
- COPY FROM works with plain, foreign, or partitioned tables, or views with INSTEAD OF INSERT triggers.
- RLS: SELECT policies apply to `COPY table TO`; COPY FROM is not supported for tables with row-level security (use INSERT).
- COPY FROM invokes triggers and check constraints, but NOT rules.
- Identity columns: COPY FROM always writes supplied values (like INSERT ... OVERRIDING SYSTEM VALUE).
- DateStyle affects COPY; set DateStyle to ISO before COPY TO for portability; avoid IntervalStyle = sql_standard (negative intervals may be misread).
- Failure leaves dead rows: "The COPY FROM command physically inserts input rows into the table as it progresses. If the command fails, these rows are left in a deleted state; these rows will not be visible, but still occupy disk space." Use VACUUM to recover.
- Progress view: `pg_stat_progress_copy`.

**Text format**
- One line per row; columns separated by delimiter; values are the type's output-function strings; error if a line has more/fewer columns than expected.
- End-of-data marker `\.` on a line by itself: unnecessary for files (kept for backward compat); psql uses it to terminate COPY FROM STDIN inline data.
- Must be backslash-escaped inside values: backslash, newline, carriage return, and the current delimiter.
- Null string is emitted without added backslashes and matched *before* backslash removal, so `\N` (null) differs from data `\\N`.
- Backslash sequences recognized by COPY FROM: `\b` backspace (8), `\f` form feed (12), `\n` newline (10), `\r` CR (13), `\t` tab (9), `\v` vertical tab (11), `\digits` 1-3 octal digits = byte, `\xdigits` 1-2 hex digits = byte. COPY TO never emits octal/hex sequences but uses the others. Any other backslashed char represents itself. `\.` and the null string are recognized before other backslash processing. Sequences interpreted after encoding conversion; octal/hex bytes must form valid characters in the database encoding.
- Line endings: COPY TO writes `\n` (Windows servers write `\r\n` only to server files; TO STDOUT always `\n`). COPY FROM accepts \n, \r, or \r\n but complains if line endings are not all alike.

**CSV format**
- Value quoted with QUOTE if it contains the delimiter, the QUOTE char, the NULL string, CR or LF; embedded QUOTE/ESCAPE chars are preceded by ESCAPE.
- NULL vs empty string distinguished by quoting: NULL = unquoted null string (default: unquoted empty); empty string value = `""`.
- Backslash not special; `\.` not treated as end-of-data when reading CSV (v18 change: versions before v18 always recognized unquoted `\.` even from a file; COPY TO still quotes a lone `\.` for compatibility). psql still ends inline COPY FROM STDIN at a line of only `\.`.
- All characters significant, including whitespace around quoted values (fixed-width padded CSV causes errors). Quoted values may contain embedded CR/LF, so files are not strictly one line per row. CSV "is more a convention than a standard".

**Binary format** (exact layout — good for a byte-level visualizer)
- Faster than text/csv, less portable across architectures and PG versions, strictly type-specific (smallint data cannot be read into an integer column). All integers in network byte order.
- File header: 15 bytes of fixed fields + variable header extension:
  1. Signature, 11 bytes: `PGCOPY\n\377\r\n\0` (zero byte required; designed to detect non-8-bit-clean transfer / EOL translation).
  2. Flags field, 32-bit integer. Bits 0-15: backwards-compatible issues (reader ignores unknown); bits 16-31: critical issues (reader aborts on unexpected). Only bit 16 defined: 1 = OIDs included (obsolete; OID system columns no longer supported).
  3. Header extension area length, 32-bit integer (bytes of remaining header, excluding itself); currently 0. Readers should skip unknown extension data.
- Tuples: 16-bit integer field count; then per field a 32-bit length word (excluding itself; may be 0) followed by that many bytes; length -1 = NULL with no bytes. No alignment padding between fields. All values in binary format (format code one) — per type `*send`/`*recv` functions (src/backend/utils/adt/). If OIDs included, OID field follows the count word and is not counted.
- File trailer: 16-bit integer word containing -1. Reader should error if a field-count is neither -1 nor the expected number of columns.
- Worked od -c example in the docs: 3-column table (char(2), text, integer NULL): header `P G C O P Y \n 377 \r \n \0` + 4 zero bytes flags + 4 zero bytes ext length; tuple `\0 003` count, `\0\0\0 002 A F`, `\0\0\0 013 AFGHANISTAN`, `377 377 377 377` (NULL); trailer `377 377`.

### CREATE ACCESS METHOD  [M4, M2]  (source: sql-create-access-method.txt)
- `CREATE ACCESS METHOD name TYPE access_method_type HANDLER handler_function`. Types: only TABLE and INDEX. Handler takes one argument of type `internal` and returns `table_am_handler` (TABLE; API Chapter 62) or `index_am_handler` (INDEX; API Chapter 63). Name unique within the database. Superuser only. Example: `CREATE ACCESS METHOD heptree TYPE INDEX HANDLER heptree_handler;`

### CREATE AGGREGATE  [M3, M6, M4]  (source: sql-createaggregate.txt)
- Three syntaxes: normal `CREATE [OR REPLACE] AGGREGATE name ( [argmode] [argname] arg_data_type,... ) ( SFUNC=, STYPE=, ... )`; ordered-set `name ( [direct args] ORDER BY aggregated args ) (...)` (+ `HYPOTHETICAL`); old syntax with `BASETYPE = base_type` (single input only; zero-arg = `"ANY"`; no ordered-set).
- Parameters (any order): `SFUNC` (required), `STYPE` (required), `SSPACE` (approx avg state size in bytes for planner memory estimates; 0/omitted => default per type), `FINALFUNC`, `FINALFUNC_EXTRA`, `FINALFUNC_MODIFY = { READ_ONLY | SHAREABLE | READ_WRITE }` (default READ_ONLY; for ordered-set default READ_WRITE), `COMBINEFUNC`, `SERIALFUNC`, `DESERIALFUNC`, `INITCOND`, moving-aggregate set `MSFUNC`, `MINVFUNC`, `MSTYPE`, `MSSPACE`, `MFINALFUNC`, `MFINALFUNC_EXTRA`, `MFINALFUNC_MODIFY`, `MINITCOND`, `SORTOP`, `PARALLEL = { SAFE | RESTRICTED | UNSAFE }`.
- Model: `sfunc(internal-state, next-data-values) -> next-internal-state`; `ffunc(internal-state) -> aggregate-value`. State variable of type stype; no ffunc => final state returned as is. INITCOND stored as text; absent => state starts NULL.
- Strict sfunc: rows with any null input are skipped; if initial state is NULL, first all-non-null row's first argument *becomes* the state (max-like) — only when STYPE == first arg type; otherwise need non-null INITCOND or non-strict sfunc. Non-strict sfunc is called for every row and handles nulls itself. Strict ffunc not called when final state is NULL (returns NULL).
- sfunc for N-arg aggregate takes N+1 args. Ordered-set: sfunc gets state + aggregated args only; ffunc gets final state + all direct args. FINALFUNC_EXTRA passes extra NULLs for aggregated args (for polymorphic result resolution; ffunc must then not be strict).
- argmode IN or VARIADIC (no OUT); only last arg VARIADIC; zero-arg written `*` (e.g. count(*)).
- OR REPLACE cannot change arg types, result type, number of direct args, or the kind (ordinary / ordered-set / hypothetical-set).
- Partial aggregation needs COMBINEFUNC (two states -> state; may be strict; must NOT be strict when STYPE is internal). STYPE internal additionally needs SERIALFUNC (internal -> bytea) and DESERIALFUNC ((bytea, internal) -> internal) for parallel aggregation. Aggregate itself must be PARALLEL SAFE: default is PARALLEL UNSAFE ("which is the default!"); support functions' markings are not consulted.
- Partial/parallel aggregation is not supported for ordered-set aggregates, and never used for calls with DISTINCT or ORDER BY.
- SORTOP (MIN/MAX-like index optimization): `SELECT agg(col) FROM tab` must equal `SELECT col FROM tab ORDER BY col USING sortop LIMIT 1`; aggregate must ignore nulls and return NULL iff no non-null inputs; only takes effect if the operator is the "less than"/"greater than" strategy member of a B-tree opclass.
- Moving-aggregate mode (window frames with moving start, i.e. frame start other than UNBOUNDED PRECEDING): forward MSFUNC adds values entering the frame, MINVFUNC removes the oldest (always removed in insertion order); inverse fn can assume at least one row remains. Forward fn may not return NULL; inverse returning NULL => "cannot reverse", aggregation recomputed from scratch for that frame start. Without it PG recomputes the whole aggregate each time the frame start moves. Moving frame *end* never needs recalculation (keeps adding) — which is why window use requires a read-only final function.
- FINALFUNC_MODIFY: READ_WRITE prevents use as window function and prevents merging transition states of aggregate calls with same inputs/transfn; SHAREABLE prevents window use but allows state merging.
- Transition functions are allowed to modify their state argument in place (performance).
- VARIADIC limits for ordered-set aggregates: only VARIADIC "any"; if last direct param is VARIADIC "any" there can be only one aggregated param and it must also be VARIADIC "any" (merged into a single item in pg_proc).
- Privileges: USAGE on arg/state/return types, EXECUTE on support functions.

### CREATE CAST  [M2, M4]  (source: sql-createcast.txt)
- `CREATE CAST (source_type AS target_type) { WITH FUNCTION fn[(argtypes)] | WITHOUT FUNCTION | WITH INOUT } [ AS ASSIGNMENT | AS IMPLICIT ]`.
- Contexts: default = explicit only (`CAST(x AS t)` or `x::t`); AS ASSIGNMENT = also implicit when assigning to a column; AS IMPLICIT = any context.
- Binary coercible = "for free", same internal representation, not necessarily symmetric (xml -> text free; text -> xml needs a function). text and varchar are binary coercible both ways ("binary compatible"). WITHOUT FUNCTION requires superuser ("can easily crash the server").
- WITH INOUT = I/O conversion cast: output function of source, then input function of target.
- Resolution example: `SELECT 2 + 4.0;` -> integer + numeric has no operator; integer->numeric is implicit, numeric->integer is not, so parser resolves to `CAST(2 AS numeric) + 4.0`. If both were implicit: ambiguity error. Rule of thumb: implicit only for information-preserving conversions within the same type category (int2->int4 implicit; float8->int4 assignment-only; text->int4 explicit-only).
- Cast function: 1-3 args: (source value, integer typmod of destination or -1, boolean is-explicit). Return type identical/binary-coercible to target. Same source and target type allowed if function has >1 arg = length coercion function. Without a combined entry, coercion to a typmod type takes two steps (convert, then apply modifier).
- Casts to/from a domain have no effect (underlying type's casts are used).
- Automatic I/O conversion casts exist to string types (treated as assignment casts) and from string types (explicit-only) — no need to create casts between user types and text/varchar/char(n).
- Function-style `typename(x)` is just a call of the cast function (convention: name cast functions after the target type). Exceptions: if no function matches but name is a type and pg_cast has a binary-coercible cast -> treated as cast; likewise to/from string types -> I/O conversion cast; except composite -> string cannot use functional syntax.
- Must own source or target type and have USAGE on the other. Catalog: `pg_cast`.

### CREATE COLLATION  [M2]  (source: sql-createcollation.txt)
- `CREATE COLLATION [IF NOT EXISTS] name ( [LOCALE = ,] [LC_COLLATE = ,] [LC_CTYPE = ,] [PROVIDER = ,] [DETERMINISTIC = boolean,] [RULES = ,] [VERSION = ] )` or `CREATE COLLATION [IF NOT EXISTS] name FROM existing_collation`.
- PROVIDER: `builtin`, `icu` (if built with ICU), `libc` (default). libc: LOCALE is shortcut for LC_COLLATE + LC_CTYPE (mutually exclusive with them). builtin: LOCALE required, one of `C`, `C.UTF-8`, `PG_UNICODE_FAST`.
- DETERMINISTIC default true: strings not byte-wise equal are unequal even if logically equal (ties broken byte-wise). Nondeterministic (case/accent-insensitive) only with ICU. RULES: ICU only (e.g. `rules = '&V << w <<< W'`).
- VERSION normally omitted (computed from provider); meant for pg_upgrade.
- Lock: takes SHARE ROW EXCLUSIVE (self-conflicting) on `pg_collation` => only one CREATE COLLATION at a time.
- libc locale must be applicable to current database encoding. Examples: `CREATE COLLATION french (locale = 'fr_FR.utf8');` `CREATE COLLATION german_phonebook (provider = icu, locale = 'de-u-co-phonebk');` `CREATE COLLATION german FROM "de_DE";`

### CREATE CONVERSION  [M2]  (source: sql-createconversion.txt)
- `CREATE [DEFAULT] CONVERSION name FOR source_encoding TO dest_encoding FROM function_name`. DEFAULT conversions are used for automatic client/server encoding conversion (need both directions). Function signature: `conv_proc(integer src_enc_id, integer dest_enc_id, cstring src, internal dest, integer src_len, boolean noError) RETURNS integer` (number of source bytes converted). Neither encoding may be SQL_ASCII (hard-wired behaviour). Needs EXECUTE on function + CREATE on schema.

### CREATE DATABASE  [M1, M7, M2]  (source: sql-createdatabase.txt)
- `CREATE DATABASE name [WITH] [OWNER [=] user] [TEMPLATE [=] template] [ENCODING [=] enc] [STRATEGY [=] strategy] [LOCALE [=] l] [LC_COLLATE [=] l] [LC_CTYPE [=] l] [BUILTIN_LOCALE [=] l] [ICU_LOCALE [=] l] [ICU_RULES [=] r] [LOCALE_PROVIDER [=] p] [COLLATION_VERSION = v] [TABLESPACE [=] ts] [ALLOW_CONNECTIONS [=] bool] [CONNECTION LIMIT [=] n] [IS_TEMPLATE [=] bool] [OID [=] oid]` (any order).
- Requires superuser or CREATEDB. Default: clone `template1`. `TEMPLATE template0` => pristine database (only standard objects; needed when encoding/locale differ from template1).
- STRATEGY: `WAL_LOG` (default) — copied block by block, each block separately WAL-logged; most efficient when template is small. `FILE_COPY` (older) — small WAL record per tablespace representing a whole-directory copy at filesystem level; much less WAL for big templates but forces a checkpoint both before and after creation (possible noticeable performance impact); affected by `file_copy_method` GUC.
- Defaults: ENCODING = template's; LOCALE etc. = template's; LOCALE_PROVIDER (builtin | icu | libc) = template's; builtin locales: C, C.UTF-8, PG_UNICODE_FAST; ALLOW_CONNECTIONS true; CONNECTION LIMIT -1 (no limit); IS_TEMPLATE false; TABLESPACE = template's (becomes default tablespace for objects in the db).
- OID: for pg_upgrade; only pg_upgrade can specify a value < 16384.
- lc_messages, lc_monetary, lc_numeric, lc_time are not fixed per database (use ALTER DATABASE ... SET).
- Notes: cannot run inside a transaction block. Database-level config (ALTER DATABASE SET) and database-level permissions (GRANT) are NOT copied from the template. Copying a non-template1 database: no other sessions may be connected to the template (fails if any exist at start; new connections locked out until done) — "not (yet) intended as a general-purpose COPY DATABASE facility".
- Encoding must be compatible with locale: C/POSIX allows all encodings; other locales exactly one (Windows: UTF-8 works with any locale). Superusers may force SQL_ASCII regardless (deprecated). Encoding and locale must match the template's unless template0 is used (other templates might contain data/indexes invalid under new settings).
- No option for a nondeterministic database default collation (use per-column collations).
- CONNECTION LIMIT enforced only approximately (race when one slot remains: both may fail); not enforced against superusers or background worker processes.
- "could not initialize database directory" errors: permissions on data dir, full disk, filesystem problems. `createdb` is a wrapper.

### CREATE DOMAIN  [M2]  (source: sql-createdomain.txt)
- `CREATE DOMAIN name [AS] data_type [COLLATE collation] [DEFAULT expression] [domain_constraint ...]`, constraint: `[CONSTRAINT name] { NOT NULL | NULL | CHECK (expression) }`. CHECK uses keyword `VALUE`; TRUE or UNKNOWN pass; no subqueries or other variables. Multiple CHECKs tested in alphabetical order by name (since 9.5).
- Default precedence: column default > domain default > underlying type default.
- Pitfall: domain constraints (esp. NOT NULL) are checked only when a value is converted to the domain type. A domain-typed column can still read as NULL (nullable side of outer join; or `INSERT INTO tab (domcol) VALUES ((SELECT domcol FROM tab WHERE false));` succeeds because the empty scalar subquery yields a NULL already considered of domain type). Best practice: let domains allow NULL and put NOT NULL on columns.
- CHECK conditions are assumed immutable; changing a function referenced in a CHECK is not detected (later dump/restore may fail). Fix: drop the constraint (ALTER DOMAIN), change function, re-add the constraint. CHECK expressions should not throw errors.
- Example: `CREATE DOMAIN us_postal_code AS TEXT CHECK( VALUE ~ '^\d{5}$' OR VALUE ~ '^\d{5}-\d{4}$' );`

### CREATE EVENT TRIGGER  [M6]  (source: sql-createeventtrigger.txt)
- `CREATE EVENT TRIGGER name ON event [ WHEN filter_variable IN (filter_value,...) [AND ...] ] EXECUTE { FUNCTION | PROCEDURE } function_name()`. Only filter_variable: `TAG` (command tags e.g. 'DROP FUNCTION'). Function takes no args, returns `event_trigger` (PROCEDURE keyword historical/deprecated; must be a function). Name unique within database. Superuser only.
- Event triggers are disabled in single-user mode and when `event_triggers` GUC is false — escape hatch if a bad trigger blocks even dropping it.
- Example (forbid all DDL): function `abort_any_command()` with `RAISE EXCEPTION 'command % is disabled', tg_tag;` then `CREATE EVENT TRIGGER abort_ddl ON ddl_command_start EXECUTE FUNCTION abort_any_command();`

### CREATE EXTENSION  [M6]  (source: sql-createextension.txt)
- `CREATE EXTENSION [IF NOT EXISTS] extension_name [WITH] [SCHEMA schema_name] [VERSION version] [CASCADE]`.
- Loading = running the extension's script file; additionally records identities of all created objects so DROP EXTENSION can remove them. Details come from `extension_name.control` found via `extension_control_path` (v18 GUC).
- Owner: the user running it owns the extension and normally its objects. Privileges: same as creating the component objects (often superuser) — unless the control file marks it `trusted`: then any user with CREATE on the current database can install; the extension is owned by the caller but contained objects by the bootstrap superuser (caller can drop the extension but not modify individual objects).
- SCHEMA: must already exist; only if extension is relocatable; if the control file specifies `schema`, a conflicting SCHEMA clause errors (ignored when CASCADE is also given). Extension itself is not in any schema (names unique database-wide).
- VERSION: identifier or string literal; default from control file.
- CASCADE: auto-install missing dependencies recursively; SCHEMA applies to all of them; their default versions always used.
- Views: `pg_available_extensions`, `pg_available_extension_versions`.
- Security caution: trojan-horse objects in the search_path during script execution (the target schema or schemas of dependency extensions) can lead to superuser compromise; install un-vetted extensions only into schemas where untrusted users have no CREATE.
- Examples: `CREATE EXTENSION hstore SCHEMA addons;` or `SET search_path = addons; CREATE EXTENSION hstore;`

### CREATE FOREIGN DATA WRAPPER / CREATE FOREIGN TABLE  [M6]  (source: sql-createforeigndatawrapper.txt, sql-createforeigntable.txt)
- `CREATE FOREIGN DATA WRAPPER name [HANDLER fn | NO HANDLER] [VALIDATOR fn | NO VALIDATOR] [OPTIONS (opt 'val',...)]`. Handler: no args, returns `fdw_handler`; without handler, foreign tables can be declared but not accessed. Validator: args (text[] options, oid catalog OID); reports via ereport(ERROR). Superuser only. "Optimization of queries is primitive (and mostly left to the wrapper, too)."
- `CREATE FOREIGN TABLE [IF NOT EXISTS] name ( { col type [OPTIONS(...)] [COLLATE c] [column_constraint...] | table_constraint | LIKE source [like_option...] },... ) [INHERITS (parents)] SERVER server [OPTIONS (...)]` or `... PARTITION OF parent [(...)] { FOR VALUES bound | DEFAULT } SERVER server [OPTIONS(...)]`.
- Column constraints: NOT NULL [NO INHERIT], NULL, CHECK (expr) [NO INHERIT], DEFAULT expr, `GENERATED ALWAYS AS (expr) [STORED | VIRTUAL]`, each `[ENFORCED | NOT ENFORCED]`. Table constraints: NOT NULL col, CHECK. like_option: `{INCLUDING|EXCLUDING} {COMMENTS|CONSTRAINTS|DEFAULTS|GENERATED|STATISTICS|ALL}`.
- Also creates a composite row type of the same name. Needs USAGE on server and column types.
- Constraints on foreign tables are NOT enforced by core PG (nor by most FDWs) — simply assumed true for query optimization; rows violating a declared constraint can cause errors or wrong answers. They should mirror constraints enforced on the remote server.
- Foreign-table partitions: implicit partition constraint is the user's responsibility. Cannot create/attach a foreign table as partition if parent has UNIQUE indexes. An UPDATE changing partition key can move a row from a local partition to a foreign partition (if FDW supports tuple routing) but not from a foreign partition to another partition.
- Generated columns: VIRTUAL computed on read (FDW sees NULL in new rows); STORED computed on write locally and passed to FDW; "VIRTUAL is the default" per this page. Not enforced that remote returns consistent stored-generated values.

### CREATE FUNCTION  [M6, M4]  (source: sql-createfunction.txt)
**Syntax**: `CREATE [OR REPLACE] FUNCTION name ( [ [argmode] [argname] argtype [ { DEFAULT | = } default_expr ] [, ...] ] ) [ RETURNS rettype | RETURNS TABLE ( column_name column_type [, ...] ) ] { LANGUAGE lang_name | TRANSFORM { FOR TYPE type_name } [, ...] | WINDOW | { IMMUTABLE | STABLE | VOLATILE } | [NOT] LEAKPROOF | { CALLED ON NULL INPUT | RETURNS NULL ON NULL INPUT | STRICT } | { [EXTERNAL] SECURITY INVOKER | [EXTERNAL] SECURITY DEFINER } | PARALLEL { UNSAFE | RESTRICTED | SAFE } | COST execution_cost | ROWS result_rows | SUPPORT support_function | SET configuration_parameter { TO value | = value | FROM CURRENT } | AS 'definition' | AS 'obj_file', 'link_symbol' | sql_body } ...`

Attribute table (defaults):
| Attribute | Default | Meaning |
|---|---|---|
| argmode IN/OUT/INOUT/VARIADIC | IN | only OUT args may follow a VARIADIC; OUT/INOUT cannot be combined with RETURNS TABLE |
| LANGUAGE | sql if sql_body given | sql, c, internal, or a PL e.g. plpgsql (quoting the name is deprecated) |
| Volatility | VOLATILE | IMMUTABLE: no DB modification, same result for same args, no lookups; calls with all-constant args can be replaced by the value at plan time. STABLE: no DB modification, consistent within a single table scan, may change across statements (DB lookups, time zone; current_timestamp family is stable). VOLATILE: may change within a scan; no optimization; e.g. random(), currval(), timeofday(); anything with side effects (setval()) must be VOLATILE |
| LEAKPROOF | NOT LEAKPROOF | no side effects, reveals nothing about args except via return value (no arg-dependent errors); lets it run before security_barrier view / RLS conditions; superuser-only to set |
| Null handling | CALLED ON NULL INPUT | STRICT / RETURNS NULL ON NULL INPUT: not executed with any null arg, result NULL. With VARIADIC, strictness tests only that the array as a whole is non-null |
| Security | SECURITY INVOKER | SECURITY DEFINER runs with owner's privileges |
| PARALLEL | UNSAFE | UNSAFE: forces serial plan. RESTRICTED: only in parallel group leader. SAFE: anywhere incl. workers. Label UNSAFE if it modifies DB state, changes transaction state (other than subtransaction for error recovery), accesses sequences (currval), or makes persistent setting changes. Label RESTRICTED if it accesses temp tables, client connection state, cursors, prepared statements, or backend-local state (e.g. setseed). Mislabeling => errors or wrong answers |
| COST | 1 for C and internal functions; 100 for all other languages | units of `cpu_operator_cost`; per returned row for set-returning functions |
| ROWS | 1000 | only for set-returning functions |
| SUPPORT | none | planner support function (Sec. 36.11); superuser |
| SET param | none | set on entry, restored on exit; FROM CURRENT captures value at CREATE time. Inside such a function SET LOCAL for the same variable is confined to the function; a plain SET overrides the clause and persists after exit (unless the txn rolls back) |
| WINDOW | off | window function; only useful for C; cannot be changed by OR REPLACE |
| TRANSFORM FOR TYPE | none | which transforms to apply (see CREATE TRANSFORM) |
- Body forms: `AS 'definition'` (string; dollar quoting recommended, otherwise double quotes/backslashes), `AS 'obj_file', 'link_symbol'` (C; link_symbol defaults to the SQL name; object file loaded once per session — new session to reload), or `sql_body`: `RETURN expression` or `BEGIN ATOMIC stmt; ... END`.
- sql_body vs string body: sql_body only for LANGUAGE SQL; parsed at definition time (string form parsed at execution time) => cannot support polymorphic argument types; tracks dependencies so DROP ... CASCADE works (string form "may leave dangling functions"); SQL-standard form.
- Overloading: same name allowed with distinct input argument types; OUT params ignored for identity (`foo(int)` conflicts with `foo(int, out text)`). Defaults can create call-time ambiguity (`foo(int)` vs `foo(int, int default 42)`: `foo(10)` fails).
- OR REPLACE: cannot change name, argument types, or return type (incl. OUT param types); ownership and permissions retained; all other properties reset to specified/implied values; cannot rename existing input params (can add names to unnamed) nor rename OUT params when more than one. Drop + recreate creates a new entity (breaks dependent rules/views/triggers).
- Type modifiers in arg/return types are discarded: `foo(varchar(10))` == `foo(varchar)`. `table.column%TYPE` allowed for arg/return types. RETURNS may be omitted with OUT/INOUT params (RECORD if multiple). RETURNS TABLE implies SETOF. `void` for no value. All input params after one with a default need defaults.
- Privileges: USAGE on the language, USAGE on arg and return types.
- SECURITY DEFINER safety: set search_path to exclude schemas writable by untrusted users, and put `pg_temp` LAST (temp schema is searched first by default and writable by anyone): `SET search_path = admin, pg_temp`. If the function creates roles as non-superuser also SET `createrole_self_grant`. EXECUTE is granted to PUBLIC by default on new functions — to restrict, create + REVOKE ALL ... FROM PUBLIC + GRANT EXECUTE in one transaction (no exposure window).
- Examples: `CREATE FUNCTION add(a integer, b integer) RETURNS integer LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT RETURN a + b;` `CREATE FUNCTION dup(in int, out f1 int, out f2 text) AS $$ SELECT $1, CAST($1 AS text) || ' is text' $$ LANGUAGE SQL;` `CREATE FUNCTION dup(int) RETURNS TABLE(f1 int, f2 text) ...` (returns a set, not one record).

### CREATE GROUP  [M1]  (source: sql-creategroup.txt)
- Alias for CREATE ROLE (same option list incl. IN ROLE, IN GROUP, ROLE, ADMIN, USER, SYSID).

### CREATE INDEX  [M4, M5, M2]  (source: sql-createindex.txt)
**Syntax**: `CREATE [UNIQUE] INDEX [CONCURRENTLY] [ [IF NOT EXISTS] name ] ON [ONLY] table_name [USING method] ( { column_name | ( expression ) } [COLLATE collation] [opclass [ ( opclass_parameter = value [, ...] ) ]] [ASC | DESC] [NULLS { FIRST | LAST }] [, ...] ) [INCLUDE ( column_name [, ...] )] [NULLS [NOT] DISTINCT] [WITH ( storage_parameter [= value] [, ...] )] [TABLESPACE tablespace_name] [WHERE predicate]`
- Target: table or materialized view. Methods: `btree` (default), `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed (e.g. `bloom`). `USING rtree` is interpreted as `USING gist`.
- Expression indexes: expression in parentheses (may be omitted for a plain function call), e.g. `CREATE INDEX ON films ((lower(title)));` (auto name typically `films_lower_idx`). Partial index: `WHERE predicate` — only columns of the underlying table (any columns), no subqueries, no aggregates. All functions/operators in index definitions must be IMMUTABLE.
- UNIQUE: checked at build and on every insert/update. Only B-tree supports unique indexes. `NULLS [NOT] DISTINCT`: default NULLS DISTINCT (multiple NULLs allowed).
- INCLUDE (non-key columns): not usable in search quals, ignored for uniqueness/exclusion, enable index-only scans; no opclass needed; expressions not supported; supported by B-tree, GiST, SP-GiST; stored only in leaf tuples, not in upper-level entries. Caveats: oversized index tuples make inserts fail; bloat; "B-tree deduplication is never used with indexes that have a non-key column".
- ASC (default) / DESC; NULLS FIRST is default with DESC, NULLS LAST default otherwise. Only B-tree supports ordered scans; a single-column DESC index is normally useless (backward scan); mixed orderings matter for multicolumn `ORDER BY x ASC, y DESC`.
- Limits: multi-key-column indexes only in B-tree, GiST, GIN, BRIN; up to 32 columns including INCLUDE columns (compile-time changeable).
- Name: no schema qualification (index lives in the table's schema); required with IF NOT EXISTS; otherwise auto-generated from table + column names. TABLESPACE default: `default_tablespace` (or `temp_tablespaces` for temp tables).
- ONLY: don't recurse to partitions (index then marked invalid until all partitions have attached indexes via ALTER INDEX ... ATTACH PARTITION). Default on partitioned table: recurse; attach existing equivalent indexes, create missing ones (auto-named). Future partitions created with PARTITION OF always get a matching index.

**Index storage parameters (WITH)**
| Parameter | AMs | Default | Notes |
|---|---|---|---|
| fillfactor (integer) | B-tree, hash, GiST, SP-GiST | B-tree 90 (range 10-100); others vary | B-tree: leaf pages filled to this % during initial build and when extending the index at the right (new largest keys). Full pages split => fragmentation. 50-90 can smooth page-split rate for insert/update-heavy tables; bottom-up index deletion needs some extra page space. 100 only for completely static tables (else "sudden flood of page splits") |
| deduplicate_items (boolean) | B-tree | ON | Sec. 65.1.4.3. Turning off via ALTER INDEX stops future deduplication but does not convert existing posting list tuples |
| buffering (enum) | GiST | AUTO | OFF / ON / AUTO (initially off, turned on once index size reaches effective_cache_size). Sorted build, if possible, is used instead unless buffering=ON |
| fastupdate (boolean) | GIN | ON | Sec. 65.4.4.1 pending list. Turning off via ALTER INDEX doesn't flush existing entries — VACUUM the table or call `gin_clean_pending_list` |
| gin_pending_list_limit (integer) | GIN | global GUC | per-index override, in kilobytes |
| pages_per_range (integer) | BRIN | 128 | number of table blocks per block range |
| autosummarize (boolean) | BRIN | off | queue a summarization run for the previous page range when an insertion is detected on the next one |

**Locking**: standard build "locks out writes (but not reads) on the table until it's done" and uses a single table scan. Regular builds permit other regular builds on the same table simultaneously; schema modification of the table is not allowed during a build. Temp tables: always non-concurrent.

**CREATE INDEX CONCURRENTLY — phases (for an animation)**
1. Transaction 1: index entered into the system catalogs as an "invalid" index.
2. Wait for existing transactions that have modified the table to terminate; Transaction 2: first table scan (builds the index; this is the only scan that can run in parallel).
3. Wait again for existing transactions that have modified the table to terminate; Transaction 3: second table scan (picks up rows missed).
4. Wait for any transactions holding a snapshot predating the second scan to terminate — including transactions used by any phase of concurrent index builds on *other* tables if the indexes involved are partial or have non-simple-column-reference columns.
5. Mark index "valid"; command completes. Even then the index may not be usable by queries as long as transactions predating the start of the build exist.
- Costs: two table scans + waits => more total work, significantly longer. No locks preventing concurrent INSERT/UPDATE/DELETE.
- Failure (deadlock, uniqueness violation, expression error): command fails but leaves an INVALID index — ignored by queries yet still incurring update overhead; psql `\d` shows `"idx" btree (col) INVALID`. Recovery: DROP INDEX and retry, or `REINDEX INDEX CONCURRENTLY`.
- Unique index caveat: uniqueness is already enforced against other transactions when the second scan begins — violations may be reported in other queries before the index is usable, or even if the build eventually fails; an invalid unique index left after a second-scan failure keeps enforcing uniqueness.
- Only one concurrent index build per table at a time. Cannot run inside a transaction block (regular CREATE INDEX can).
- Not supported on partitioned tables: build concurrently on each partition, then create the partitioned index non-concurrently (metadata-only operation).

**Build performance / notes**
- `maintenance_work_mem` governs speed for most AMs. Parallel index build supported by B-tree, GIN, BRIN (GIN parallel build is new in v18): maintenance_work_mem is the budget for the whole operation regardless of worker count; cost model picks worker count; each parallel worker needs at least a 32MB share and the leader a remaining 32MB share; `max_parallel_maintenance_workers` caps workers. Table storage parameter `parallel_workers` (ALTER TABLE) directly sets the worker count requested (bypasses cost model; 0 disables parallel builds) — reset afterwards since it affects all parallel table scans.
- New expression indexes need ANALYZE (or autovacuum analyze) to have statistics; non-expression indexes can use existing column stats immediately.
- search_path temporarily `pg_catalog, pg_temp` during CREATE INDEX.
- "Like any long-running transaction, CREATE INDEX on a table can affect which tuples can be removed by concurrent VACUUM on any other table."
- Opclass: default per type usually enough (e.g. `int4_ops`); multiple opclasses allow different orderings (complex numbers by abs value vs real part).
- Progress: `pg_stat_progress_create_index`.
- Examples: `CREATE UNIQUE INDEX title_idx ON films (title) INCLUDE (director, rating);` `CREATE INDEX title_idx ON films (title) WITH (deduplicate_items = off);` `CREATE INDEX title_idx_german ON films (title COLLATE "de_DE");` `CREATE INDEX title_idx_nulls_low ON films (title NULLS FIRST);` `CREATE UNIQUE INDEX title_idx ON films (title) WITH (fillfactor = 70);` `CREATE INDEX gin_idx ON documents_table USING GIN (locations) WITH (fastupdate = off);` `CREATE INDEX pointloc ON points USING gist (box(location,location));` `CREATE INDEX CONCURRENTLY sales_quantity_index ON sales_table (quantity);`

### CREATE LANGUAGE  [M6]  (source: sql-createlanguage.txt)
- `CREATE [OR REPLACE] [TRUSTED] [PROCEDURAL] LANGUAGE name HANDLER call_handler [INLINE inline_handler] [VALIDATOR valfunction]`; the handler-less form is obsolete and is interpreted as CREATE EXTENSION (old dump compatibility).
- call_handler: compiled language (C, version 1 call convention), no arguments, returns `language_handler`. inline_handler: one `internal` argument (the DO command's internal representation), typically returns void; without it the language has no anonymous code blocks (DO). validator: one `oid` argument (the function being created), reports via ereport(); without it new functions are not checked at creation.
- TRUSTED = language gives no access to data the user would not otherwise have; if omitted only superusers can create functions in it. USAGE is granted to PUBLIC by default for trusted languages.
- Superuser needed to register or change parameters; ownership may then be given to a non-superuser (never give them the underlying C functions: privilege escalation path). OR REPLACE keeps ownership and permissions; existing functions assumed still valid.
- Languages are per-database; install into template1 to have them in all later databases. Catalog `pg_language`; psql `\dL`.
- Minimal sequence: `CREATE FUNCTION plsample_call_handler() RETURNS language_handler AS '$libdir/plsample' LANGUAGE C; CREATE LANGUAGE plsample HANDLER plsample_call_handler;` (normally packaged as `CREATE EXTENSION plsample;`).

### CREATE MATERIALIZED VIEW  [M6]  (source: sql-creatematerializedview.txt)
- `CREATE MATERIALIZED VIEW [IF NOT EXISTS] table_name [(column_name,...)] [USING method] [WITH (storage_parameter [= value],...)] [TABLESPACE ts] AS query [WITH [NO] DATA]`.
- Like CREATE TABLE AS but remembers the query so it can be refreshed with REFRESH MATERIALIZED VIEW. Populated at creation unless WITH NO DATA, in which case it is flagged unscannable and cannot be queried until refreshed.
- No temporary materialized views. USING = a TABLE access method (default `default_table_access_method`). All CREATE TABLE storage parameters are supported. TABLESPACE default from `default_tablespace`.
- query: SELECT, TABLE or VALUES; runs as a security-restricted operation (functions that create temporary tables fail); search_path temporarily `pg_catalog, pg_temp`.
- Needs CREATE on the schema. PostgreSQL extension.

### CREATE OPERATOR  [M4, M6]  (source: sql-createoperator.txt)
- `CREATE OPERATOR name ( {FUNCTION|PROCEDURE} = function_name [, LEFTARG = t] [, RIGHTARG = t] [, COMMUTATOR = op] [, NEGATOR = op] [, RESTRICT = res_proc] [, JOIN = join_proc] [, HASHES] [, MERGES] )`.
- Name: up to NAMEDATALEN-1 (63 by default) characters from `+ - * / < > = ~ ! @ # % ^ & | ` ?`. Rules: `--` and `/*` cannot appear; a multi-character name cannot end in `+` or `-` unless it also contains one of `~ ! @ # % ^ & | ` ?` (`@-` allowed, `*-` not); `=>` is reserved; `!=` is mapped to `<>` on input.
- Binary operators need LEFTARG and RIGHTARG; prefix operators only RIGHTARG. PROCEDURE keyword is historical; must be a function.
- Schema-qualified operator in optional clauses: `COMMUTATOR = OPERATOR(myschema.===)`.
- Commutator pairs, three ways: omit COMMUTATOR in the first and give it in the second (system back-fills the first); give it in both (system creates a dummy catalog entry holding only name, operand types and owner, filled in later; using the dummy errors); or define both without and use ALTER OPERATOR on either. Must own both. Negator pairs work the same way.
- Precedence cannot be specified (parser precedence is hard-wired). Obsolete options SORT1, SORT2, LTCMP, GTCMP are ignored except that they implicitly set MERGES.
- Privileges: USAGE on argument and return types, EXECUTE on the function.

### CREATE OPERATOR CLASS / CREATE OPERATOR FAMILY  [M4]  (source: sql-createopclass.txt, sql-createopfamily.txt)
- `CREATE OPERATOR CLASS name [DEFAULT] FOR TYPE data_type USING index_method [FAMILY family_name] AS { OPERATOR strategy_number operator_name [(op_type, op_type)] [FOR SEARCH | FOR ORDER BY sort_family_name] | FUNCTION support_number [(op_type [, op_type])] function_name (argument_type,...) | STORAGE storage_type } [, ...]`.
- An operator class says which operators fill which strategies and which support functions the index method uses for a data type. At most one DEFAULT class per data type and index method. Without FAMILY the class goes into a family of the same name (created if missing). Same class name allowed in a schema only for different index methods.
- STORAGE: type actually stored in the index; only GiST, GIN, SP-GiST and BRIN allow it to differ from the column type; with data_type anyarray, storage_type may be anyelement.
- FOR SEARCH is the default; FOR ORDER BY names a btree operator family giving the sort order.
- Superuser only ("could confuse or even crash the server"). No check that the class is complete or self-consistent.
- Including a function or operator is tantamount to granting public EXECUTE. Operators should not be defined by SQL functions (inlining stops the optimizer matching the index).
- Example `gist__int_ops DEFAULT FOR TYPE _int4 USING gist`: OPERATOR 3 `&&`, 6 `= (anyarray, anyarray)`, 7 `@>`, 8 `<@`, 20 `@@ (_int4, query_int)`; FUNCTION 1 g_int_consistent, 2 g_int_union, 3 g_int_compress, 4 g_int_decompress, 5 g_int_penalty, 6 g_int_picksplit, 7 g_int_same.
- `CREATE OPERATOR FAMILY name USING index_method`: creates an empty family; populate with CREATE OPERATOR CLASS and, for loose cross-type members, ALTER OPERATOR FAMILY. Superuser only.

### CREATE POLICY (row-level security)  [M6, M1, M3]  (source: sql-createpolicy.txt)
- `CREATE POLICY name ON table_name [AS { PERMISSIVE | RESTRICTIVE }] [FOR { ALL | SELECT | INSERT | UPDATE | DELETE }] [TO { role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER } [, ...]] [USING (using_expression)] [WITH CHECK (check_expression)]`.
- Defaults: PERMISSIVE, FOR ALL, TO PUBLIC. Policy names are per table. Policies apply only once `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is set; RLS enabled with no applicable policy = "default deny" (no rows visible or updatable).
- USING is checked against existing rows: true = visible; false or null = not visible, normally silently. WITH CHECK is checked against the proposed new row of INSERT/UPDATE: false or null = error, whole command aborted. Neither may contain aggregate or window functions.
- For ALL and UPDATE policies with no WITH CHECK, the USING expression is used for both.
- Order of enforcement for INSERT/UPDATE/MERGE: after BEFORE triggers fire (a BEFORE ROW trigger can change the row and so the outcome), before any data modification, and before any other constraints.
- Per-command rules: SELECT policy has no WITH CHECK; INSERT policy has no USING; DELETE policy has no WITH CHECK; UPDATE policy has both and also applies to SELECT FOR UPDATE, SELECT FOR SHARE, ON CONFLICT DO UPDATE and MERGE UPDATE actions. No separate MERGE policy.
- RETURNING needs SELECT rights: new or updated rows failing the SELECT policies raise an error (never silently dropped). INSERT ... ON CONFLICT checks INSERT WITH CHECK for every proposed row whether or not it is inserted. In ON CONFLICT DO UPDATE and MERGE UPDATE, an existing row failing USING raises an error instead of being skipped. A MERGE DELETE action errors on a visible row that fails the DELETE policy.
- UPDATE and DELETE that read columns (WHERE, RETURNING, SET right-hand side) also need SELECT/ALL policies to pass.

Table 301, policies applied by command type ("filter" = row silently ignored, "check" = error):
| Command | SELECT/ALL USING | INSERT/ALL WITH CHECK | UPDATE/ALL USING | UPDATE/ALL WITH CHECK | DELETE/ALL USING |
|---|---|---|---|---|---|
| SELECT / COPY ... TO | Filter existing row | - | - | - | - |
| SELECT FOR UPDATE/SHARE | Filter existing row | - | Filter existing row | - | - |
| INSERT | Check new row [a] | Check new row | - | - | - |
| UPDATE | Filter existing row [a] & check new row [a] | - | Filter existing row | Check new row | - |
| DELETE | Filter existing row [a] | - | - | - | Filter existing row |
| INSERT ... ON CONFLICT | Check new row [b][c] | Check new row [c] | - | - | - |
| ON CONFLICT DO UPDATE | Check existing & new rows [d] | - | Check existing row | Check new row [d] | - |
| MERGE | Filter source & target rows | - | - | - | - |
| MERGE ... THEN INSERT | Check new row [a] | Check new row | - | - | - |
| MERGE ... THEN UPDATE | Check new row | - | Check existing row | Check new row | - |
| MERGE ... THEN DELETE | - | - | - | - | Check existing row |
[a] only if read access to the existing or new row is required (WHERE or RETURNING referring to the relation's columns). [b] if an arbiter index or constraint is specified. [c] proposed row checked whether or not a conflict occurs. [d] new row of the auxiliary UPDATE, which may differ from the INSERT's new row.

- Combining: policies of different command types are ANDed (an UPDATE needs both SELECT and UPDATE permission). Within one type: all PERMISSIVE expressions ORed, all RESTRICTIVE ANDed, the two results ANDed. No PERMISSIVE policy = access denied, so restrictive-only tables expose nothing. ALL policies count as the type being applied.
- Not applied to internal referential-integrity checks or constraint validation, so existence can leak (duplicate-key failure on a hidden row; FK insert succeeding against a hidden referenced row). Mitigate with policies that block such writes, or surrogate keys.
- Policy quals run before user quals, except LEAKPROOF functions and operators, which may run first.
- Expressions run with the rights of the querying user, who needs access to referenced tables and functions. Through a view, the view owner's rights and policies apply unless the view is `security_invoker`.
- Must own the table. PostgreSQL extension.


### CREATE PROCEDURE  [M6, M5]  (source: sql-createprocedure.txt)
- `CREATE [OR REPLACE] PROCEDURE name ( [ [argmode] [argname] argtype [ { DEFAULT | = } default_expr ] [, ...] ] ) { LANGUAGE lang_name | TRANSFORM { FOR TYPE type_name } [, ...] | [EXTERNAL] SECURITY INVOKER | [EXTERNAL] SECURITY DEFINER | SET configuration_parameter { TO value | = value | FROM CURRENT } | AS 'definition' | AS 'obj_file', 'link_symbol' | sql_body } ...`
- Differences from CREATE FUNCTION: no RETURNS clause, no volatility / STRICT / LEAKPROOF / PARALLEL / COST / ROWS / SUPPORT / WINDOW attributes. argmode IN (default), OUT, INOUT, VARIADIC. sql_body must be a `BEGIN ATOMIC ... END` block (no `RETURN expr` form).
- Name must not clash with any procedure OR function with the same input argument types in the schema (they share the namespace; overloading by argument types allowed).
- OR REPLACE cannot change name or argument types; ownership and permissions are kept; other properties reset to the specified/implied values. Must own it (membership in owning role counts).
- **Transaction control restrictions:** "A SECURITY DEFINER procedure cannot execute transaction control statements (for example, COMMIT and ROLLBACK, depending on the language)." Likewise "If a SET clause is attached to a procedure, then that procedure cannot execute transaction control statements." (Plus from CALL: none allowed if CALL itself runs inside a transaction block.)
- SET clause semantics identical to functions (restore on exit; SET LOCAL inside is confined; plain SET overrides and persists).
- sql_body parsed at definition time (dependency tracking, no polymorphic args); string body parsed at execution.
- Privileges: USAGE on the language and on argument types. Invoked with CALL.
- Example: `CREATE PROCEDURE insert_data(a integer, b integer) LANGUAGE SQL BEGIN ATOMIC INSERT INTO tbl VALUES (a); INSERT INTO tbl VALUES (b); END;` then `CALL insert_data(1, 2);`

### CREATE PUBLICATION  [M7]  (source: sql-createpublication.txt)
- `CREATE PUBLICATION name [ FOR ALL TABLES | FOR publication_object [, ...] ] [ WITH ( publication_parameter [= value] [, ...] ) ]`; publication_object: `TABLE [ONLY] table_name [*] [ (column_name,...) ] [ WHERE ( expression ) ] [, ...]` or `TABLES IN SCHEMA { schema_name | CURRENT_SCHEMA } [, ...]`.
- A publication = a group of tables whose data changes are to be replicated via logical replication. Creating one "does not start replication"; it defines grouping and filtering for future subscribers. Without FOR clauses it starts empty.
- FOR TABLE: without ONLY, descendants are included. Partitioned table: all existing and future partitions are implicitly part of it (never added explicitly); operations performed directly on a partition are published via publications of its ancestors.
- Eligible relations: only persistent base tables and partitioned tables. NOT temporary tables, unlogged tables, foreign tables, materialized views, regular views (also skipped when included via schema).
- FOR ALL TABLES / FOR TABLES IN SCHEMA include tables created in the future; both need superuser. Column list + TABLES IN SCHEMA in the same publication not supported (either direction).
- Row filter WHERE: rows evaluating false/null not published; parentheses required; no effect on TRUNCATE; evaluated with the replication connection's role. Restrictions: no user-defined functions, operators, types, collations, no non-immutable built-in functions, no system columns. For UPDATE/DELETE to be published the filter may only reference REPLICA IDENTITY columns (INSERT-only: any column). Redundant if the table's schema is also published via TABLES IN SCHEMA.
- Column list: only named columns replicated (may include stored generated columns); omitted => all non-generated columns including future ones. Must include REPLICA IDENTITY columns for UPDATE/DELETE to be published (no restriction for insert-only). No effect on TRUNCATE.
- Parameters:
| Parameter | Type | Default | Meaning |
|---|---|---|---|
| publish | string | 'insert, update, delete, truncate' | which DML ops are published; does not affect initial table synchronization |
| publish_generated_columns | enum none / stored | none | replicate stored generated columns (v18). Subscribers older than 18 won't copy generated columns in initial sync |
| publish_via_partition_root | boolean | false | true: changes published with identity and schema of the root partitioned table (lets you replicate into a non-partitioned table or different partition layout); row filters and column lists then taken from the root; TRUNCATE directly on partitions not replicated. If any subscribed publication sets it true for a table, root identity is used |
- Tables published for UPDATE/DELETE must have REPLICA IDENTITY, otherwise those operations are disallowed on them (error at DML time). Generated columns in REPLICA IDENTITY must be published (column list or publish_generated_columns) for UPDATE/DELETE.
- What gets published: INSERT ... ON CONFLICT -> resulting INSERT or UPDATE or nothing; MERGE -> per-row INSERT/UPDATE/DELETE; COPY FROM -> INSERTs; DDL never. ATTACHing a table into a tree whose root is published with publish_via_partition_root=true does not replicate its existing contents.
- Privileges: CREATE on current database; ownership of each added table.
- Examples: `CREATE PUBLICATION active_departments FOR TABLE departments WHERE (active IS TRUE);` `CREATE PUBLICATION insert_only FOR TABLE mydata WITH (publish = 'insert');` `CREATE PUBLICATION users_filtered FOR TABLE users (user_id, firstname);` `CREATE PUBLICATION production_publication FOR TABLE users, departments, TABLES IN SCHEMA production;`

### CREATE ROLE / CREATE USER  [M1]  (source: sql-createrole.txt)
- `CREATE ROLE name [ [WITH] option [...] ]`; options: SUPERUSER|NOSUPERUSER, CREATEDB|NOCREATEDB, CREATEROLE|NOCREATEROLE, INHERIT|NOINHERIT, LOGIN|NOLOGIN, REPLICATION|NOREPLICATION, BYPASSRLS|NOBYPASSRLS, CONNECTION LIMIT n, [ENCRYPTED] PASSWORD 'pw' | PASSWORD NULL, VALID UNTIL 'ts', IN ROLE roles, ROLE roles, ADMIN roles, SYSID uid (ignored). Deprecated: `USER roles` (= ROLE), `IN GROUP roles` (= IN ROLE).
- Roles are cluster-wide (valid in all databases). Requires CREATEROLE or superuser.
| Attribute | Default | Notes |
|---|---|---|
| SUPERUSER | NOSUPERUSER | overrides all access restrictions; only a superuser can create one |
| CREATEDB | NOCREATEDB | only superuser or CREATEDB roles may grant it |
| CREATEROLE | NOCREATEROLE | create/alter/drop/comment/security-label other roles |
| INHERIT | INHERIT | since v16 this is only the default inheritance status for memberships (IN ROLE now, ROLE later, GRANT default); before 16 it was a role-level attribute governing all runtime checks |
| LOGIN | NOLOGIN (but CREATE USER implies LOGIN) | can be initial session authorization name |
| REPLICATION | NOREPLICATION | needed for replication-mode connections and creating/dropping replication slots; "very highly privileged"; only superuser or REPLICATION roles may grant |
| BYPASSRLS | NOBYPASSRLS | bypass every RLS policy; only superuser or BYPASSRLS roles may grant. pg_dump sets row_security off by default (errors if user lacks rights); superusers and table owners always bypass RLS |
| CONNECTION LIMIT | -1 (no limit) | counts only normal connections, not prepared transactions or background workers; approximate (race); never enforced for superusers |
| PASSWORD | null (password auth always fails) | empty string also = null (since v10; avoid). Always stored encrypted per `password_encryption`; ENCRYPTED keyword no-op; pre-encrypted MD5/SCRAM strings stored as-is (dump/restore). MD5 support deprecated, to be removed |
| VALID UNTIL | forever | expiry of the password only, not the role; not enforced for non-password auth methods |
- Membership clauses: IN ROLE -> new role becomes member of existing roles with SET enabled, ADMIN disabled, INHERIT unless NOINHERIT. ROLE -> listed roles become members of the new role ("group"), SET enabled, INHERIT if the member has role-level INHERIT, ADMIN disabled. ADMIN -> like ROLE but with ADMIN option (can grant membership onward). Grantor of these memberships = the executing role. GRANT/REVOKE preferred for later membership changes.
- Role attributes (CREATEDB etc.) are never inherited through membership; but with the SET option a member can `SET ROLE` to the privileged role.
- Password caution: cleartext over the wire and possibly logged; `createuser` transmits encrypted; psql `\password`.
- Examples: `CREATE ROLE jonathan LOGIN;` `CREATE USER davide WITH PASSWORD 'jw8s0F4';` `CREATE ROLE miriam WITH LOGIN PASSWORD 'jw8s0F4' VALID UNTIL '2005-01-01';` `CREATE ROLE admin WITH CREATEDB CREATEROLE;`
- SQL standard approximation: standard users = NOINHERIT roles; standard roles = INHERIT roles.

### CREATE RULE  [M6, M4]  (source: sql-createrule.txt)
- `CREATE [OR REPLACE] RULE name AS ON event TO table_name [ WHERE condition ] DO [ ALSO | INSTEAD ] { NOTHING | command | ( command ; command ... ) }`; event = SELECT | INSERT | UPDATE | DELETE. Default ALSO. Rule actions may be SELECT, INSERT, UPDATE, DELETE or NOTIFY.
- "a rule is really a command transformation mechanism, or command macro. The transformation happens before the execution of the command starts." For per-physical-row behaviour use a trigger instead. Rules implement views.
- ON SELECT rules only on views; must be named `"_RETURN"`, unconditional INSTEAD, single SELECT action (view = dummy table with no storage). Prefer CREATE OR REPLACE VIEW over redefining `_RETURN`.
- NEW valid in ON INSERT / ON UPDATE; OLD valid in ON UPDATE / ON DELETE. WHERE condition may reference only NEW and OLD; no aggregates.
- Multiple rules on same table + event applied in alphabetical name order.
- INSERT ... ON CONFLICT cannot be used on tables with INSERT or UPDATE rules (use an updatable view).
- Updatable-view-via-rules catch: need an unconditional INSTEAD rule per allowed action, else the system rejects the update (it might hit the dummy table). Pattern: unconditional `DO INSTEAD NOTHING` + conditional non-INSTEAD rules (doesn't support RETURNING). Auto-updatable views and INSTEAD OF triggers are alternatives; automatic update transformation generally outperforms rules.
- RETURNING in rules: only in unconditional INSTEAD rules, at most one RETURNING among all rules for the same event; RETURNING queries on the view rejected if no rule has one; ignored when the triggering command has no RETURNING.
- Circular rules (t1 `_RETURN` selects t2, t2 selects t1) are accepted at creation but error at query time (recursive expansion).
- NOTIFY in a rule action executes unconditionally — e.g. `CREATE RULE notify_me AS ON UPDATE TO mytable DO ALSO NOTIFY mytable;` sends one NOTIFY per UPDATE even if no rows match.
- Must own the table. Entire rewrite system is a PG extension.

### CREATE SCHEMA  [M1]  (source: sql-createschema.txt)
- `CREATE SCHEMA schema_name [AUTHORIZATION role_spec] [schema_element ...]`, `CREATE SCHEMA AUTHORIZATION role_spec [schema_element ...]` (schema named after the user), `CREATE SCHEMA IF NOT EXISTS schema_name [AUTHORIZATION role_spec]`, `CREATE SCHEMA IF NOT EXISTS AUTHORIZATION role_spec`.
- Schema = namespace for tables, types, functions, operators; access by qualification or search_path; unqualified CREATE goes into `current_schema` (front of search_path). Name cannot begin with `pg_`.
- schema_element subcommands accepted: only CREATE TABLE, CREATE VIEW, CREATE INDEX, CREATE SEQUENCE, CREATE TRIGGER, GRANT; written without semicolons; with AUTHORIZATION all created objects owned by that user; forward references not fully handled (may need reordering). Not allowed with IF NOT EXISTS.
- Privileges: CREATE on the current database; owning as another role needs SET ROLE ability. PG allows objects in a schema owned by someone other than the schema owner (unlike the standard).
- Example: `CREATE SCHEMA hollywood CREATE TABLE films (title text, release date, awards text[]) CREATE VIEW winners AS SELECT title, release FROM films WHERE awards IS NOT NULL;`

### CREATE SEQUENCE  [M2, M5]  (source: sql-createsequence.txt)
- `CREATE [ { TEMPORARY | TEMP } | UNLOGGED ] SEQUENCE [IF NOT EXISTS] name [AS data_type] [INCREMENT [BY] increment] [MINVALUE minvalue | NO MINVALUE] [MAXVALUE maxvalue | NO MAXVALUE] [[NO] CYCLE] [START [WITH] start] [CACHE cache] [OWNED BY { table_name.column_name | NONE }]`.
- Creates "a new special single-row table". Inspect with `SELECT * FROM name;` (`last_value` = last value allocated by any session; may be stale). Operated with nextval, currval, setval (Sec. 9.17).
| Option | Default |
|---|---|
| AS | bigint (also smallint, integer); type sets default min/max |
| INCREMENT BY | 1 (negative => descending) |
| MINVALUE | 1 ascending; type minimum descending |
| MAXVALUE | type maximum ascending; -1 descending |
| CYCLE | NO CYCLE (nextval past limit errors); CYCLE wraps to minvalue/maxvalue |
| START WITH | minvalue (ascending) / maxvalue (descending) |
| CACHE | 1 (minimum; no cache) |
| OWNED BY | NONE; table must have same owner and schema |
- TEMPORARY: session-only, dropped at session exit, lives in a special schema (no schema name allowed), hides same-named permanent sequences unless schema-qualified.
- UNLOGGED: changes not WAL-logged; not crash-safe (reset to initial state after crash/unclean shutdown); not replicated to standbys; no significant performance advantage — intended for sequences of unlogged tables' identity/serial columns.
- Range limited to 8-byte integer: -9223372036854775808 to 9223372036854775807.
- **Not gapless**: "nextval and setval calls are never rolled back". Gapless numbering requires an exclusively locked counter table (much more expensive).
- **CACHE > 1 pitfalls**: each session reserves `cache` values per access and bumps last_value; unused cached values are lost at session end (holes); values across sessions are distinct but not ordered (A reserves 1..10 returns 1, B reserves 11..20 returns 11 before A returns 2); last_value reflects latest reservation; setval not noticed by other sessions until they exhaust their cache. With cache 1, nextval values are generated sequentially.
- Example after bulk load: `BEGIN; COPY distributors FROM 'input_file'; SELECT setval('serial', max(id)) FROM distributors; END;`
- Standard uses `NEXT VALUE FOR`; OWNED BY is a PG extension.

### CREATE SERVER  [M6]  (source: sql-createserver.txt)
- `CREATE SERVER [IF NOT EXISTS] server_name [TYPE 'server_type'] [VERSION 'server_version'] FOREIGN DATA WRAPPER fdw_name [OPTIONS (option 'value', ...)]`. Encapsulates connection info for an FDW; per-user details via user mappings. Name unique within database. Needs USAGE on the FDW.
- dblink can use a server name in `dblink_connect` (needs USAGE on server). If the foreign server supports sort pushdown it must have the same sort ordering as the local server.
- Example: `CREATE SERVER myserver FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'foo', dbname 'foodb', port '5432');`

### CREATE STATISTICS (extended statistics)  [M4]  (source: sql-createstatistics.txt)
- Form 1 (univariate expression stats): `CREATE STATISTICS [ [IF NOT EXISTS] name ] ON ( expression ) FROM table_name` — like an expression index's statistics without index maintenance overhead; kinds cannot be specified.
- Form 2 (multivariate): `CREATE STATISTICS [ [IF NOT EXISTS] name ] [ ( statistics_kind [, ...] ) ] ON { column_name | ( expression ) }, { column_name | ( expression ) } [, ...] FROM table_name` — at least two columns/expressions, order not significant; univariate stats are also built automatically for each expression in the list.
- statistics_kind: `ndistinct` (n-distinct for column combinations), `dependencies` (functional dependencies), `mcv` (multi-column most-common-values list). Omitted => all kinds.
- Targets: table, foreign table, or materialized view. Must own the table to create; afterwards the stats object's ownership is independent. Name optional (auto-chosen from table and columns), required with IF NOT EXISTS (which checks only the name). Data is computed by ANALYZE (target via ALTER STATISTICS ... SET STATISTICS). Inheritance/partition handling as for ANALYZE.
- Limitation: "Extended statistics are not currently used by the planner for selectivity estimations made for table joins."
- Doc examples (perfect for the playground):
  - t1: `INSERT INTO t1 SELECT i/100, i/500 FROM generate_series(1,1000000) s(i);` — `WHERE (a = 1) AND (b = 0)` drastically underestimated (independence assumption multiplies selectivities); fix `CREATE STATISTICS s1 (dependencies) ON a, b FROM t1; ANALYZE t1;`
  - t2: `INSERT INTO t2 SELECT mod(i,100), mod(i,100) ...`; `CREATE STATISTICS s2 (mcv) ON a, b FROM t2;` improves both the found combination `(a=1 AND b=1)` and gives an upper bound for the absent combination `(a=1 AND b=2)`.
  - t3: timestamp column with minute rows for 2020; without stats, equality and range conditions on expressions are assumed **0.5% selectivity** and expression ndistinct assumed equal to the column's (unique), so filters are underestimated and `GROUP BY date_trunc('month', a), date_trunc('day', a)` group count overestimated; fix `CREATE STATISTICS s3 (ndistinct) ON date_trunc('month', a), date_trunc('day', a) FROM t3;`

### CREATE SUBSCRIPTION  [M7]  (source: sql-createsubscription.txt)
- `CREATE SUBSCRIPTION name CONNECTION 'conninfo' PUBLICATION pub [, ...] [ WITH ( subscription_parameter [= value] [, ...] ) ]`.
- A subscription is a replication connection to the publisher; normally also creates a replication slot on the publisher. The logical replication (apply) worker starts at commit of the creating transaction unless disabled. Requires privileges of `pg_create_subscription` plus CREATE on the current database. conninfo is a libpq connection string.
- Creation-time parameters:
| Parameter | Default | Meaning |
|---|---|---|
| connect (bool) | true | false forces create_slot, enabled, copy_data to false (can't combine with any of them true); no tables subscribed; must manually create slot, enable failover if needed, enable and refresh |
| create_slot (bool) | true | create the slot on the publisher |
| enabled (bool) | true | actively replicate vs just set up |
| slot_name (string) | subscription name | NONE = no slot (then enabled and create_slot must be false). With an existing slot + create_slot=false, keep the slot's failover property consistent with the subscription's |
- Behaviour parameters:
| Parameter | Default | Meaning |
|---|---|---|
| binary (bool) | false | request binary format (also for initial copy); faster but type-specific and less portable; only types with binary send/receive transferred binary; initial sync needs send/receive for all types; publisher < 16 uses text for initial sync |
| copy_data (bool) | true | copy pre-existing data at start; affected by publication WHERE clauses |
| streaming (enum) | parallel | parallel: in-progress txns applied directly by a parallel apply worker if free, else spooled to temp files; on: spooled to temp files, applied after remote commit; off: whole txn decoded on publisher then sent. Parallel caveat: rare deadlock risk if schemas differ (auto-retried); finish LSN may not be logged on error |
| synchronous_commit (enum) | off | overrides synchronous_commit in the apply worker; off is safe (data re-sent on loss) but with synchronous logical replication it can increase publisher COMMIT latency — use local or higher |
| two_phase (bool) | false | send prepared txns at PREPARE TRANSACTION time; state stays "pending" until initial table sync finishes (`pg_subscription.subtwophasestate`) |
| disable_on_error (bool) | false | auto-disable subscription on worker errors |
| password_required (bool) | true | connections must use password auth with password in conninfo; ignored for superuser-owned subscriptions; only superusers may set false |
| run_as_owner (bool) | false | true: all actions as subscription owner; false: each table's actions performed as that table's owner ("generally much more secure") |
| origin (string) | any | none = only changes without an origin (avoid loops in bidirectional setups); any = regardless of origin |
| failover (bool) | false | enable syncing the subscription's slots to standbys so replication can resume after failover |
- Notes: with slot creation (default) cannot run inside a transaction block. Subscribing to the same cluster (e.g. another database in the same cluster) hangs if the slot is created in the same command — create the slot separately with `pg_create_logical_replication_slot(..., 'pgoutput')` and use `create_slot = false`.
- Row filters across several publications for the same table: a row is published if ANY expression is satisfied; if any publication has no WHERE for that operation, or is FOR ALL TABLES / TABLES IN SCHEMA, rows are always published. Subscriber < 15 ignores row filters during initial sync. Initial sync ignores the `publish` parameter, so rows may be copied that DML replication wouldn't send.
- Different column lists for the same table across subscribed publications: not supported. Non-existent publications are allowed (added later).
- `copy_data = true` + `origin = none`: initial data copied directly can't be checked for true origin; a WARNING is logged if the publisher itself has subscriptions; doc gives a query joining `pg_publication_tables`, `pg_class`, `pg_namespace`, `pg_subscription_rel`, `pg_partition_ancestors`, `pg_partition_tree` to find tables with possibly non-local origins.
- Examples: `CREATE SUBSCRIPTION mysub CONNECTION 'host=192.168.1.50 port=5432 user=foo dbname=foodb' PUBLICATION mypublication, insert_only;` and `... WITH (enabled = false);`

### CREATE TABLE  [M2, M5, M7, M1]  (source: sql-createtable.txt)
**Three syntaxes**
- Normal: `CREATE [ [GLOBAL | LOCAL] { TEMPORARY | TEMP } | UNLOGGED ] TABLE [IF NOT EXISTS] table_name ( [ { column_name data_type [STORAGE { PLAIN | EXTERNAL | EXTENDED | MAIN | DEFAULT }] [COMPRESSION method] [COLLATE c] [column_constraint ...] | table_constraint | LIKE source_table [like_option ...] } [, ...] ] ) [INHERITS (parent,...)] [PARTITION BY { RANGE | LIST | HASH } ( { col | (expr) } [COLLATE c] [opclass] [, ...] )] [USING method] [WITH (storage_parameter [= value], ...) | WITHOUT OIDS] [ON COMMIT { PRESERVE ROWS | DELETE ROWS | DROP }] [TABLESPACE ts]`
- Typed: `... TABLE name OF type_name [ ( { col [WITH OPTIONS] [constraints] | table_constraint } ,...) ] ...` — structure from a stand-alone composite type (CREATE TYPE); cannot add columns, can add defaults/constraints/storage params; dependency so cascaded ALTER/DROP on the type propagate.
- Partition: `... TABLE name PARTITION OF parent [ (...) ] { FOR VALUES partition_bound_spec | DEFAULT } [PARTITION BY ...] ...`
- column_constraint: `[CONSTRAINT n] { NOT NULL [NO INHERIT] | NULL | CHECK (expr) [NO INHERIT] | DEFAULT expr | GENERATED ALWAYS AS (expr) [STORED | VIRTUAL] | GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY [(sequence_options)] | UNIQUE [NULLS [NOT] DISTINCT] index_parameters | PRIMARY KEY index_parameters | REFERENCES reftable [(refcol)] [MATCH FULL | MATCH PARTIAL | MATCH SIMPLE] [ON DELETE action] [ON UPDATE action] } [DEFERRABLE | NOT DEFERRABLE] [INITIALLY DEFERRED | INITIALLY IMMEDIATE] [ENFORCED | NOT ENFORCED]`
- table_constraint: CHECK, `NOT NULL column_name [NO INHERIT]`, `UNIQUE [NULLS [NOT] DISTINCT] (cols [, col WITHOUT OVERLAPS])`, `PRIMARY KEY (cols [, col WITHOUT OVERLAPS])`, `EXCLUDE [USING am] (exclude_element WITH operator, ...) index_parameters [WHERE (predicate)]`, `FOREIGN KEY (cols [, PERIOD col]) REFERENCES reftable [(refcols [, PERIOD refcol])] ...`.
- index_parameters: `[INCLUDE (cols)] [WITH (storage_parameter ...)] [USING INDEX TABLESPACE ts]`. referential_action: `NO ACTION | RESTRICT | CASCADE | SET NULL [(cols)] | SET DEFAULT [(cols)]`.
- like_option: `{ INCLUDING | EXCLUDING } { COMMENTS | COMPRESSION | CONSTRAINTS | DEFAULTS | GENERATED | IDENTITY | INDEXES | STATISTICS | STORAGE | ALL }`.
- Also creates a composite row type with the table's name (so no same-named type allowed in the schema). Needs USAGE on all column types (or the OF type).

**Persistence**
- TEMPORARY/TEMP: dropped at session end (or txn end via ON COMMIT); lives in a special schema (no schema name allowed); temp schema is first in default search_path so it hides same-named permanent tables for new plans; its indexes are temporary. **Autovacuum cannot access temp tables** — vacuum/ANALYZE them manually (e.g. ANALYZE after populating). GLOBAL/LOCAL accepted, no effect, deprecated.
- ON COMMIT (temp tables): `PRESERVE ROWS` (default; SQL standard default is DELETE ROWS), `DELETE ROWS` (automatic TRUNCATE at each commit; not cascaded to partitions), `DROP` (dropped at end of current transaction block; drops partitions / inheritance children).
- UNLOGGED: data not written to WAL => "considerably faster", not crash-safe ("automatically truncated after a crash or unclean shutdown"), not replicated to standbys; its indexes unlogged too; identity/serial sequences created with it are unlogged. Not supported for partitioned tables.
- Standard vs PG temp tables: standard defines them once for all sessions; PG requires each session to CREATE its own.

**Column options**
- STORAGE: PLAIN (inline, uncompressed; for fixed-length types), MAIN (inline, compressible), EXTERNAL (out-of-line, uncompressed; faster substring on large text/bytea), EXTENDED (out-of-line, compressed; default for most varlena types), DEFAULT. Copied from parents under INHERITS.
- COMPRESSION: only variable-width types, used only with storage main or extended; pglz or lz4 (with --with-lz4) or `default` (= `default_toast_compression` at insert time). On a partitioned table: no direct effect, inherited by new partitions.
- DEFAULT: variable-free expression; no references to other columns, no subqueries; type must match; absent => NULL.
- CHECK: TRUE or UNKNOWN pass; no subqueries, only current-row columns, `tableoid` is the only system column allowed. Multiple CHECKs tested per row in alphabetical name order, after NOT NULL constraints. NO INHERIT = not propagated to children.
- `GENERATED ALWAYS AS (expr) [STORED | VIRTUAL]`: **VIRTUAL is the default (v18)** — computed on read, no storage; STORED computed on write. Expression may reference other non-generated columns; immutable functions/operators only; no other tables. Virtual generated columns cannot have user-defined types and their expression may use only built-in functions/types (also indirectly via operators/casts).
- `GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY [(sequence_options)]`: implicit sequence; implicitly NOT NULL. INSERT: ALWAYS accepts a user value only with `OVERRIDING SYSTEM VALUE`; BY DEFAULT user value wins. COPY always uses supplied values. UPDATE: ALWAYS rejects any value other than DEFAULT; BY DEFAULT updates normally. sequence_options = CREATE SEQUENCE options plus `SEQUENCE NAME name`, `LOGGED`, `UNLOGGED` (default persistence = table's). Identity is not inherited via INHERITS. Multiple identity columns allowed (PG extension; INSERT has one override clause for all).

**Constraints**
- UNIQUE: rows must differ in at least one column; NULLs not equal unless `NULLS NOT DISTINCT`; creates a unique btree index named like the constraint (GiST if WITHOUT OVERLAPS); redundant unique constraints on the same column set are discarded. INCLUDE payload columns: not enforced but depended on (DROP COLUMN cascades). Partitioned hierarchies: must include all partition key columns of the target and all descendant partitioned tables.
- WITHOUT OVERLAPS (temporal key, v18): last column checked for overlap, not equality; `UNIQUE (id, valid_at WITHOUT OVERLAPS)` behaves like `EXCLUDE USING GIST (id WITH =, valid_at WITH &&)`; column must be range or multirange; empty ranges not permitted; other columns need GiST equality — usually via `btree_gist`.
- PRIMARY KEY: unique + not null; one per table; implies metadata (other tables can rely on it); creates unique btree (or GiST with WITHOUT OVERLAPS) index; same partition restrictions as UNIQUE.
- EXCLUDE: no two rows where all `operator` comparisons return TRUE; operators must be commutative; implemented by an index of the same name; AM must support `amgettuple` (so not GIN); btree/hash pointless => in practice GiST or SP-GiST; WHERE predicate = partial index (parentheses required). Partitioned: must include all partition key columns compared with equality. Example: `CREATE TABLE circles (c circle, EXCLUDE USING gist (c WITH &&));`
- FOREIGN KEY / REFERENCES: omitted refcolumns => referenced PK; refcolumns must be a non-deferrable unique/PK constraint or a non-partial unique index (PG extension). Collatable column pairs must both be deterministic or the same collation. Requires REFERENCES privilege. **Adding an FK takes SHARE ROW EXCLUSIVE on the referenced table.** No FKs between temporary and permanent tables.
  - Match types: MATCH SIMPLE (default; any null column => no match needed), MATCH FULL (all null or none null), MATCH PARTIAL (not implemented).
  - PERIOD (temporal FK, v18): last column range/multirange; referenced rows' combined periods must completely cover the referencing period; referenced table needs PK/UNIQUE WITH WITHOUT OVERLAPS. RESTRICT, CASCADE, SET NULL, SET DEFAULT not supported for temporal FKs.
  - Actions (executed as part of the data-changing command even if the constraint is deferred): NO ACTION (default; error at check time — deferred check if deferred), RESTRICT (error if any referencing row matches, even if the end state would be valid; blocks updates to distinct-but-equal values but not no-op updates), CASCADE, SET NULL [(cols)], SET DEFAULT [(cols)] (column subsets only for ON DELETE; SET DEFAULT needs a matching referenced row). Updates that don't actually change the referenced column do nothing.
  - Tip: index the referencing columns if referenced columns change frequently.
- DEFERRABLE / NOT DEFERRABLE (default NOT DEFERRABLE): only UNIQUE, PRIMARY KEY, EXCLUDE, REFERENCES accept it; NOT NULL and CHECK are never deferrable. Deferrable constraints cannot be ON CONFLICT arbiters. INITIALLY IMMEDIATE (default; checked after each statement) vs INITIALLY DEFERRED (end of transaction); changed with SET CONSTRAINTS.
- Non-deferrable UNIQUE/PK are checked immediately per row (standard says end of statement) — matters for multi-row key updates such as `UPDATE t SET id = id + 1`; get standard behaviour with DEFERRABLE INITIALLY IMMEDIATE (significantly slower).
- ENFORCED (default) / NOT ENFORCED (v18): not checked; app responsible; planner may still assume it where correctness isn't affected; only FK and CHECK constraints.
- Constraint names must be unique per table/domain (laxer than standard), but index-based constraints share the schema-wide relation namespace.

**INHERITS**
- Persistent parent-child relationship: schema changes propagate, child data included in parent scans by default. Parents may be plain or foreign tables.
- Same-named columns from several parents must have matching types and are merged; explicit column must match inherited type and is merged; explicit default overrides inherited; conflicting parent defaults error. Same-named CHECK constraints merged if expressions match, else error; NO INHERIT parent constraints ignored; unnamed CHECKs in the child never merge.
- "Unique constraints and primary keys are not inherited in the current implementation. This makes the combination of inheritance and unique constraints rather dysfunctional."

**Partitioning**
- `PARTITION BY RANGE | LIST | HASH`: range/hash keys up to 32 columns/expressions (compile-time); list key = single column or expression. Range/list need a btree opclass, hash needs a hash opclass implementing support function 2; default opclass used if unspecified, error if none.
- Partitioned table itself is empty; rows routed by key; no matching partition => error.
- PARTITION OF clones the parent's indexes, constraints and user-defined row-level triggers onto the new partition. Bounds must match strategy and not overlap.
- partition_bound_expr: variable-free (no subqueries, window, aggregate or set-returning functions); evaluated once at creation, so even CURRENT_TIMESTAMP works.
- LIST: `FOR VALUES IN (...)`; NULL allowed in at most one list partition; not allowed for range.
- RANGE: FROM inclusive, TO exclusive, row-wise comparison: with `PARTITION BY RANGE (x,y)`, `FROM (1, 2) TO (3, 4)` allows x=1 with y>=2, x=2 with any non-null y, x=3 with y<4. MINVALUE / MAXVALUE = unbounded; once used in a bound, all subsequent columns must use the same value (`(10, MINVALUE, MINVALUE)` not `(10, MINVALUE, 0)`). `FROM (0, MAXVALUE) TO (10, MAXVALUE)` = first column >0 and <=10; `FROM ('a', MINVALUE) TO ('b', MINVALUE)` = first column starts with 'a'. MAXVALUE > 'infinity', so `FROM ('infinity') TO (MAXVALUE)` holds exactly one value.
- HASH: `WITH (MODULUS m, REMAINDER r)`, m positive, 0 <= r < m. Moduli need not be equal but each must be a factor of the next larger modulus — lets you split incrementally (detach one mod-8 partition, create two mod-16 partitions with remainders r and r+8, repopulate).
- DEFAULT partition: not for hash; catches keys fitting no other partition. Adding a new partition scans the default partition to verify no rows belong in the new one (slow if large; skipped if default is a foreign table or has a constraint proving it).
- Partitions must have the same column names/types as parent (changes propagate). CHECK constraints inherited; partitions can add their own (same name+condition merges). Per-partition defaults allowed but "a partition's default value is not applied when inserting a tuple through a partitioned table". TRUNCATE cascades to partitions but can target one.
- **Locks**: CREATE TABLE ... PARTITION OF and DROP TABLE of a partition take ACCESS EXCLUSIVE on the parent; ALTER TABLE ATTACH/DETACH PARTITION use weaker locks.
- USING method: table AM (default `default_table_access_method`); partitions inherit the partitioned table's AM if set. TABLESPACE on a partitioned table becomes default for new partitions. Storage parameters not supported on partitioned tables (set on leaf partitions).

**LIKE**
- Copies column names, types and not-null constraints; fully decoupled afterwards (unlike INHERITS); no merging — duplicate names error. EXCLUDING is default; last spec for a kind wins.
- INCLUDING COMMENTS (columns, check & not-null constraints, indexes, extended stats), COMPRESSION, CONSTRAINTS (CHECK; not-null always copied), DEFAULTS (beware nextval linking tables), GENERATED (expressions + stored/virtual choice), IDENTITY (new separate sequences), INDEXES (indexes, PK, UNIQUE, EXCLUDE with default-rule names), STATISTICS (extended stats), STORAGE, ALL. Works from views, foreign tables, composite types (inapplicable options ignored).

**Table storage parameters (WITH)** — most also have a `toast.` variant for the TOAST table (falls back to table value if unset); not settable on partitioned tables.
| Parameter | Type / default | Notes |
|---|---|---|
| fillfactor | integer 10-100, default 100 | INSERT packs pages only to this %; rest reserved for UPDATEs on the same page => more HOT updates; not for TOAST |
| toast_tuple_target | integer, default ~2040 bytes (>= 4 tuples per 8kB block); range 128 to block size - header (8160) | min tuple length before compress/move out-of-line, and target length; affects External/Main/Extended columns; new tuples only; not for TOAST |
| parallel_workers | integer | workers for parallel scans of this table (also CREATE INDEX); default from relation size; capped by max_worker_processes etc. |
| autovacuum_enabled (+toast.) | boolean | false => no autovacuum except anti-wraparound; global `autovacuum = off` overrides true |
| vacuum_index_cleanup (+toast.) | enum AUTO / ON / OFF, default AUTO | AUTO decides dynamically to skip index scans for very few dead tuples; OFF speeds VACUUM but can bloat indexes; VACUUM INDEX_CLEANUP overrides |
| vacuum_truncate (+toast.) | boolean | per-table vacuum_truncate; VACUUM TRUNCATE option overrides |
| autovacuum_vacuum_threshold (+toast.) | integer | per-table GUC |
| autovacuum_vacuum_max_threshold (+toast.) | integer | per-table GUC (v18) |
| autovacuum_vacuum_scale_factor (+toast.) | float | per-table GUC |
| autovacuum_vacuum_insert_threshold (+toast.) | integer | -1 disables insert vacuums |
| autovacuum_vacuum_insert_scale_factor (+toast.) | float | per-table GUC |
| autovacuum_analyze_threshold | integer | (no toast. variant) |
| autovacuum_analyze_scale_factor | float | (no toast. variant) |
| autovacuum_vacuum_cost_delay (+toast.) | float | per-table GUC |
| autovacuum_vacuum_cost_limit (+toast.) | integer | per-table GUC |
| autovacuum_freeze_min_age (+toast.) | integer | per-table vacuum_freeze_min_age; ignored if > half of system autovacuum_freeze_max_age |
| autovacuum_freeze_max_age (+toast.) | integer | can only be set smaller than system setting |
| autovacuum_freeze_table_age (+toast.) | integer | per-table vacuum_freeze_table_age |
| autovacuum_multixact_freeze_min_age (+toast.) | integer | ignored if > half of system autovacuum_multixact_freeze_max_age |
| autovacuum_multixact_freeze_max_age (+toast.) | integer | can only be set smaller |
| autovacuum_multixact_freeze_table_age (+toast.) | integer | per-table vacuum_multixact_freeze_table_age |
| log_autovacuum_min_duration (+toast.) | integer | per-table GUC |
| vacuum_max_eager_freeze_failure_rate (+toast.) | float | per-table GUC (v18 eager freezing) |
| user_catalog_table | boolean | treat as catalog for logical decoding (Sec. 47.6.2); not for TOAST |
- Legacy: `WITH (OIDS=FALSE)` and `WITHOUT OIDS` accepted; OIDS=TRUE not supported.
- TABLESPACE default: `default_tablespace` (or `temp_tablespaces` for temp). `USING INDEX TABLESPACE` for constraint indexes.

**Notes / limits**
- PK and UNIQUE automatically create indexes (no need to index PK columns explicitly).
- Max 1600 columns per table (effective limit often lower due to tuple length).
- Zero-column tables allowed (`CREATE TABLE foo();`).
- Examples worth reusing: `CREATE TABLE distributors (did integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, name varchar(40) NOT NULL CHECK (name <> ''));` `CREATE TABLE distributors (did integer, name varchar(40), UNIQUE(name) WITH (fillfactor=70)) WITH (fillfactor=70);` `CREATE TYPE employee_type AS (name text, salary numeric); CREATE TABLE employees OF employee_type (PRIMARY KEY (name), salary WITH OPTIONS DEFAULT 1000);` `CREATE TABLE measurement (logdate date not null, peaktemp int, unitsales int) PARTITION BY RANGE (logdate);` `CREATE TABLE measurement_y2016m07 PARTITION OF measurement (unitsales DEFAULT 0) FOR VALUES FROM ('2016-07-01') TO ('2016-08-01');` `CREATE TABLE cities (city_id bigserial not null, name text not null, population bigint) PARTITION BY LIST (left(lower(name), 1));` `CREATE TABLE cities_ab PARTITION OF cities (CONSTRAINT city_id_nonzero CHECK (city_id != 0)) FOR VALUES IN ('a', 'b') PARTITION BY RANGE (population);` `CREATE TABLE orders_p1 PARTITION OF orders FOR VALUES WITH (MODULUS 4, REMAINDER 0);` `CREATE TABLE cities_partdef PARTITION OF cities DEFAULT;` multi-column `FOR VALUES FROM (MINVALUE, MINVALUE) TO (2016, 11)`.

### CREATE TABLE AS  [M3, M2]  (source: sql-createtableas.txt)
- `CREATE [ [GLOBAL | LOCAL] { TEMPORARY | TEMP } | UNLOGGED ] TABLE [IF NOT EXISTS] table_name [(column_name,...)] [USING method] [WITH (storage_parameter ...) | WITHOUT OIDS] [ON COMMIT { PRESERVE ROWS | DELETE ROWS | DROP }] [TABLESPACE ts] AS query [WITH [NO] DATA]`.
- Creates a table whose columns take names and types from the query output (names overridable) and fills it once. It does not track later changes to the source tables (unlike a view, which re-evaluates its query on every use; unlike a matview, it doesn't remember the query).
- query: SELECT, TABLE, VALUES, or an EXECUTE of a prepared SELECT/TABLE/VALUES. WITH NO DATA copies only the structure; the default copies the data.
- IF NOT EXISTS: notice, table left unmodified. Needs CREATE on the schema.
- Preferred over SELECT INTO: same function, a superset of it, and less confusable with other SELECT INTO uses.
- Examples: `CREATE TABLE films2 AS TABLE films;` and `PREPARE recentfilms(date) AS SELECT * FROM films WHERE date_prod > $1; CREATE TEMP TABLE films_recent ON COMMIT DROP AS EXECUTE recentfilms('2002-01-01');`
- Standard differences: parentheses around the subquery are optional in PG, and `WITH [NO] DATA` is optional (required by the standard).

### CREATE TABLESPACE  [M1, M2]  (source: sql-createtablespace.txt)
- `CREATE TABLESPACE name [OWNER { new_owner | CURRENT_ROLE | CURRENT_USER | SESSION_USER }] LOCATION 'directory' [WITH (tablespace_option = value, ...)]`.
- Cluster-wide alternative filesystem location for data files. Name cannot begin with `pg_`. Only superusers can create one, but ownership may go to a non-superuser. The directory must already exist (it is not created), should be empty, must be owned by the PostgreSQL OS user, and must be an absolute path.
- Options: seq_page_cost, random_page_cost, effective_io_concurrency, maintenance_io_concurrency (same as ALTER TABLESPACE).
- Warning: a tablespace cannot be used independently of the cluster that defined it (Sec. 22.6). Cannot run inside a transaction block.
- Usable by CREATE DATABASE, CREATE TABLE, CREATE INDEX and ADD CONSTRAINT. Example: `mkdir /data/dbs; chown postgres:postgres /data/dbs` then `CREATE TABLESPACE dbspace LOCATION '/data/dbs';`

### CREATE TEXT SEARCH CONFIGURATION / DICTIONARY / PARSER / TEMPLATE  [M6]  (source: sql-createtsconfig.txt, sql-createtsdictionary.txt, sql-createtsparser.txt, sql-createtstemplate.txt)
- How the pieces fit: a **parser** splits text into typed tokens; a **template** provides the functions that implement dictionaries; a **dictionary** is a template instance plus options; a **configuration** is a parser plus token-type-to-dictionary mappings.
- `CREATE TEXT SEARCH CONFIGURATION name ( PARSER = parser_name | COPY = source_config )`. PARSER and COPY are mutually exclusive (COPY copies the parser too). Parser-only creation gives no mappings, so all words are ignored until ALTER ... ADD MAPPING.
- `CREATE TEXT SEARCH DICTIONARY name ( TEMPLATE = template [, option = value, ...] )`. Option values must be quoted unless they are simple identifiers or numbers. Example: `CREATE TEXT SEARCH DICTIONARY my_russian (template = snowball, language = russian, stopwords = myrussian);`
- `CREATE TEXT SEARCH PARSER name ( START = fn, GETTOKEN = fn, END = fn, LEXTYPES = fn [, HEADLINE = fn] )`. All functions except HEADLINE are required; argument lists are predetermined, so no types are given. Superuser only.
- `CREATE TEXT SEARCH TEMPLATE name ( [INIT = init_fn,] LEXIZE = lexize_fn )`. LEXIZE is required, INIT optional. Superuser only. Templates exist to isolate the "unsafe" part of dictionary definition, so creating a dictionary is not a privileged operation.

### CREATE TRANSFORM  [M6]  (source: sql-createtransform.txt)
- `CREATE [OR REPLACE] TRANSFORM FOR type_name LANGUAGE lang_name ( FROM SQL WITH FUNCTION from_fn [(argtypes)], TO SQL WITH FUNCTION to_fn [(argtypes)] );`
- Adapts a data type to a procedural language (e.g. hstore as a Python dict in PL/Python, instead of the default text representation). The from-SQL function takes `internal` and returns `internal`, and is applied to function arguments. The to-SQL function takes `internal` and returns the type, and is applied to return values.
- Either function may be omitted (the language default is then used). To forbid one direction, use a function that always errors.
- Privileges: own the type and have USAGE on it, USAGE on the language, and ownership plus EXECUTE on the functions. Functions opt in with `TRANSFORM FOR TYPE` in CREATE FUNCTION. Usually packaged in an extension (several contrib modules provide transforms).
- Example: `CREATE TRANSFORM FOR hstore LANGUAGE plpython3u (FROM SQL WITH FUNCTION hstore_to_plpython(internal), TO SQL WITH FUNCTION plpython_to_hstore(internal));`

### CREATE TRIGGER  [M6, M5, M3]  (source: sql-createtrigger.txt)
**Syntax**: `CREATE [OR REPLACE] [CONSTRAINT] TRIGGER name { BEFORE | AFTER | INSTEAD OF } { event [OR ...] } ON table_name [FROM referenced_table_name] [ NOT DEFERRABLE | [DEFERRABLE] [INITIALLY IMMEDIATE | INITIALLY DEFERRED] ] [REFERENCING { { OLD | NEW } TABLE [AS] transition_relation_name } [...]] [FOR [EACH] { ROW | STATEMENT }] [WHEN ( condition )] EXECUTE { FUNCTION | PROCEDURE } function_name ( arguments )`. Events: `INSERT`, `UPDATE [OF column_name, ...]`, `DELETE`, `TRUNCATE`.
- Targets: tables, views, foreign tables. The trigger name cannot be schema-qualified (it inherits the table's schema) and must be unique per table. OR REPLACE replaces all other properties of the existing trigger.
- **Timing**: BEFORE fires before constraints are checked and before the operation is attempted. AFTER fires after constraints are checked and the operation completed; all changes, including other triggers' effects, are visible. INSTEAD OF fires in place of the operation (views only). BEFORE and INSTEAD OF triggers can skip the operation for the row or change the row being inserted/updated.
- **Granularity**: FOR EACH ROW fires once per modified row (a 10-row DELETE fires 10 times). FOR EACH STATEMENT fires once per operation, even when zero rows are modified. **The default is FOR EACH STATEMENT.**
- **Allowed combinations** (doc table):
| When | Event | Row-level | Statement-level |
|---|---|---|---|
| BEFORE | INSERT/UPDATE/DELETE | Tables and foreign tables | Tables, views, and foreign tables |
| BEFORE | TRUNCATE | - | Tables and foreign tables |
| AFTER | INSERT/UPDATE/DELETE | Tables and foreign tables | Tables, views, and foreign tables |
| AFTER | TRUNCATE | - | Tables and foreign tables |
| INSTEAD OF | INSERT/UPDATE/DELETE | Views | - |
| INSTEAD OF | TRUNCATE | - | - |
- INSTEAD OF triggers must be FOR EACH ROW and allow neither WHEN nor an UPDATE OF column list. BEFORE/AFTER triggers on views must be statement-level. TRUNCATE triggers are statement-only. There are no SELECT triggers.
- Several triggers of the same kind on the same event fire in **alphabetical name order** (the standard says creation order).
- **Constraint triggers** (`CREATE CONSTRAINT TRIGGER`): must be AFTER ROW on plain tables (not foreign tables). Firing can be adjusted with SET CONSTRAINTS (end of statement, or deferred to end of transaction). They are expected to raise an exception on violation. FROM referenced_table and DEFERRABLE/INITIALLY clauses are only valid for constraint triggers. OR REPLACE is not supported for them. Their WHEN is evaluated immediately after the row operation, not at deferred time; if it is false, nothing is queued.
- **Transition relations** (`REFERENCING OLD TABLE AS o NEW TABLE AS n`): row sets of all rows the statement inserted, deleted or modified. Allowed only on AFTER triggers on plain tables (not foreign tables), not on constraint triggers, and without an UPDATE OF column list. Multiple OR events are not allowed when requesting them. OLD TABLE (before-images) only for UPDATE/DELETE; NEW TABLE (after-images) only for UPDATE/INSERT; each at most once. Row-level triggers with transition relations cannot be defined on partitions or inheritance children.
- **UPDATE OF columns**: fires if any listed column is a SET target, or is a generated column depending on a target. Changes made by BEFORE UPDATE triggers are not considered, so a column can change without firing; conversely `SET x = x` fires.
- **WHEN**: no subqueries. Row-level WHEN can use OLD.col / NEW.col (no OLD for INSERT, no NEW for DELETE). In a BEFORE trigger, WHEN is evaluated just before the function would run, against the NEW row as possibly modified by earlier triggers, and cannot examine NEW's system columns such as ctid (not yet set). In an AFTER trigger, WHEN is evaluated right after the row update and decides whether an event is queued at all, which can greatly speed up statements touching many rows.
- Function: takes no arguments and returns `trigger`. Arguments are literal strings (names and numbers are converted to strings), accessed in a language-specific way. The PROCEDURE keyword is deprecated.
- Privileges: TRIGGER on the table and EXECUTE on the function.
- **Partitioned tables**: a row-level trigger is cloned onto every existing and future (created or attached) partition. A conflicting name on a partition errors unless OR REPLACE is used. Detaching removes the clones. Triggers on partitioned tables cannot be INSTEAD OF.
- **Statement vs row firing across hierarchies**: modifying a partitioned or inheritance parent fires statement triggers only on the named table, but row triggers on affected partitions/children. Statement-level transition relations show rows from all affected partitions/children (for inheritance children, only the parent's columns).
- **Views**: statement triggers on a view fire only if the action is handled by a row-level INSTEAD OF trigger. With an INSTEAD rule, triggers of the replacement statements' tables fire. For an auto-updatable view, the base table's statement triggers fire.
- **Mixed events**: INSERT ... ON CONFLICT DO UPDATE can fire both insert and update triggers; each sees only its own event's transition rows. FK actions (ON UPDATE CASCADE, ON DELETE SET NULL) count as part of the originating command (never deferred) and fire triggers on the affected table. An AFTER ROW trigger with transition relations can split FK actions into several steps; statement triggers then fire once per transition-relation set.
- PG deviates from the standard: BEFORE DELETE triggers always fire before the delete, even a cascaded one. BEFORE triggers that modify or skip rows during referential actions can cause constraint violations or data that doesn't honour the FK.
- Pitfall: replacing a trigger in a transaction that has already modified the table is not recommended, because firing decisions already made are not reconsidered.
- Built-in trigger functions exist in Sec. 9.29 (e.g. suppress_redundant_updates_trigger).
- Examples: `CREATE TRIGGER check_update BEFORE UPDATE ON accounts FOR EACH ROW WHEN (OLD.balance IS DISTINCT FROM NEW.balance) EXECUTE FUNCTION check_account_update();` · `CREATE TRIGGER log_update AFTER UPDATE ON accounts FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION log_account_update();` · `CREATE TRIGGER view_insert INSTEAD OF INSERT ON my_view FOR EACH ROW EXECUTE FUNCTION view_insert_row();` · `CREATE TRIGGER transfer_insert AFTER INSERT ON transfer REFERENCING NEW TABLE AS inserted FOR EACH STATEMENT EXECUTE FUNCTION check_transfer_balances_to_zero();`

## Complete inventories

### A. Every SQL command (183) with one-line purpose (source: sql-commands.txt; ★ = page in this slice, detailed above)
| # | Command | Purpose |
|---|---|---|
| 1 | ABORT ★ | abort the current transaction |
| 2 | ALTER AGGREGATE ★ | change the definition of an aggregate function |
| 3 | ALTER COLLATION ★ | change the definition of a collation |
| 4 | ALTER CONVERSION ★ | change the definition of a conversion |
| 5 | ALTER DATABASE ★ | change a database |
| 6 | ALTER DEFAULT PRIVILEGES ★ | define default access privileges |
| 7 | ALTER DOMAIN ★ | change the definition of a domain |
| 8 | ALTER EVENT TRIGGER ★ | change the definition of an event trigger |
| 9 | ALTER EXTENSION ★ | change the definition of an extension |
| 10 | ALTER FOREIGN DATA WRAPPER ★ | change the definition of a foreign-data wrapper |
| 11 | ALTER FOREIGN TABLE ★ | change the definition of a foreign table |
| 12 | ALTER FUNCTION ★ | change the definition of a function |
| 13 | ALTER GROUP ★ | change role name or membership |
| 14 | ALTER INDEX ★ | change the definition of an index |
| 15 | ALTER LANGUAGE ★ | change the definition of a procedural language |
| 16 | ALTER LARGE OBJECT ★ | change the definition of a large object |
| 17 | ALTER MATERIALIZED VIEW ★ | change the definition of a materialized view |
| 18 | ALTER OPERATOR ★ | change the definition of an operator |
| 19 | ALTER OPERATOR CLASS ★ | change the definition of an operator class |
| 20 | ALTER OPERATOR FAMILY ★ | change the definition of an operator family |
| 21 | ALTER POLICY ★ | change the definition of a row-level security policy |
| 22 | ALTER PROCEDURE ★ | change the definition of a procedure |
| 23 | ALTER PUBLICATION ★ | change the definition of a publication |
| 24 | ALTER ROLE ★ | change a database role |
| 25 | ALTER ROUTINE ★ | change the definition of a routine |
| 26 | ALTER RULE ★ | change the definition of a rule |
| 27 | ALTER SCHEMA ★ | change the definition of a schema |
| 28 | ALTER SEQUENCE ★ | change the definition of a sequence generator |
| 29 | ALTER SERVER ★ | change the definition of a foreign server |
| 30 | ALTER STATISTICS ★ | change the definition of an extended statistics object |
| 31 | ALTER SUBSCRIPTION ★ | change the definition of a subscription |
| 32 | ALTER SYSTEM ★ | change a server configuration parameter |
| 33 | ALTER TABLE ★ | change the definition of a table |
| 34 | ALTER TABLESPACE ★ | change the definition of a tablespace |
| 35 | ALTER TEXT SEARCH CONFIGURATION ★ | change the definition of a text search configuration |
| 36 | ALTER TEXT SEARCH DICTIONARY ★ | change the definition of a text search dictionary |
| 37 | ALTER TEXT SEARCH PARSER ★ | change the definition of a text search parser |
| 38 | ALTER TEXT SEARCH TEMPLATE ★ | change the definition of a text search template |
| 39 | ALTER TRIGGER ★ | change the definition of a trigger |
| 40 | ALTER TYPE ★ | change the definition of a type |
| 41 | ALTER USER ★ | change a database role |
| 42 | ALTER USER MAPPING ★ | change the definition of a user mapping |
| 43 | ALTER VIEW ★ | change the definition of a view |
| 44 | ANALYZE ★ | collect statistics about a database |
| 45 | BEGIN ★ | start a transaction block |
| 46 | CALL ★ | invoke a procedure |
| 47 | CHECKPOINT ★ | force a write-ahead log checkpoint |
| 48 | CLOSE ★ | close a cursor |
| 49 | CLUSTER ★ | cluster a table according to an index |
| 50 | COMMENT ★ | define or change the comment of an object |
| 51 | COMMIT ★ | commit the current transaction |
| 52 | COMMIT PREPARED ★ | commit a transaction that was earlier prepared for two-phase commit |
| 53 | COPY ★ | copy data between a file and a table |
| 54 | CREATE ACCESS METHOD ★ | define a new access method |
| 55 | CREATE AGGREGATE ★ | define a new aggregate function |
| 56 | CREATE CAST ★ | define a new cast |
| 57 | CREATE COLLATION ★ | define a new collation |
| 58 | CREATE CONVERSION ★ | define a new encoding conversion |
| 59 | CREATE DATABASE ★ | create a new database |
| 60 | CREATE DOMAIN ★ | define a new domain |
| 61 | CREATE EVENT TRIGGER ★ | define a new event trigger |
| 62 | CREATE EXTENSION ★ | install an extension |
| 63 | CREATE FOREIGN DATA WRAPPER ★ | define a new foreign-data wrapper |
| 64 | CREATE FOREIGN TABLE ★ | define a new foreign table |
| 65 | CREATE FUNCTION ★ | define a new function |
| 66 | CREATE GROUP ★ | define a new database role |
| 67 | CREATE INDEX ★ | define a new index |
| 68 | CREATE LANGUAGE ★ | define a new procedural language |
| 69 | CREATE MATERIALIZED VIEW ★ | define a new materialized view |
| 70 | CREATE OPERATOR ★ | define a new operator |
| 71 | CREATE OPERATOR CLASS ★ | define a new operator class |
| 72 | CREATE OPERATOR FAMILY ★ | define a new operator family |
| 73 | CREATE POLICY ★ | define a new row-level security policy for a table |
| 74 | CREATE PROCEDURE ★ | define a new procedure |
| 75 | CREATE PUBLICATION ★ | define a new publication |
| 76 | CREATE ROLE ★ | define a new database role |
| 77 | CREATE RULE ★ | define a new rewrite rule |
| 78 | CREATE SCHEMA ★ | define a new schema |
| 79 | CREATE SEQUENCE ★ | define a new sequence generator |
| 80 | CREATE SERVER ★ | define a new foreign server |
| 81 | CREATE STATISTICS ★ | define extended statistics |
| 82 | CREATE SUBSCRIPTION ★ | define a new subscription |
| 83 | CREATE TABLE ★ | define a new table |
| 84 | CREATE TABLE AS ★ | define a new table from the results of a query |
| 85 | CREATE TABLESPACE ★ | define a new tablespace |
| 86 | CREATE TEXT SEARCH CONFIGURATION ★ | define a new text search configuration |
| 87 | CREATE TEXT SEARCH DICTIONARY ★ | define a new text search dictionary |
| 88 | CREATE TEXT SEARCH PARSER ★ | define a new text search parser |
| 89 | CREATE TEXT SEARCH TEMPLATE ★ | define a new text search template |
| 90 | CREATE TRANSFORM ★ | define a new transform |
| 91 | CREATE TRIGGER ★ | define a new trigger |
| 92 | CREATE TYPE | define a new data type |
| 93 | CREATE USER | define a new database role |
| 94 | CREATE USER MAPPING | define a new mapping of a user to a foreign server |
| 95 | CREATE VIEW | define a new view |
| 96 | DEALLOCATE | deallocate a prepared statement |
| 97 | DECLARE | define a cursor |
| 98 | DELETE | delete rows of a table |
| 99 | DISCARD | discard session state |
| 100 | DO | execute an anonymous code block |
| 101 | DROP ACCESS METHOD | remove an access method |
| 102 | DROP AGGREGATE | remove an aggregate function |
| 103 | DROP CAST | remove a cast |
| 104 | DROP COLLATION | remove a collation |
| 105 | DROP CONVERSION | remove a conversion |
| 106 | DROP DATABASE | remove a database |
| 107 | DROP DOMAIN | remove a domain |
| 108 | DROP EVENT TRIGGER | remove an event trigger |
| 109 | DROP EXTENSION | remove an extension |
| 110 | DROP FOREIGN DATA WRAPPER | remove a foreign-data wrapper |
| 111 | DROP FOREIGN TABLE | remove a foreign table |
| 112 | DROP FUNCTION | remove a function |
| 113 | DROP GROUP | remove a database role |
| 114 | DROP INDEX | remove an index |
| 115 | DROP LANGUAGE | remove a procedural language |
| 116 | DROP MATERIALIZED VIEW | remove a materialized view |
| 117 | DROP OPERATOR | remove an operator |
| 118 | DROP OPERATOR CLASS | remove an operator class |
| 119 | DROP OPERATOR FAMILY | remove an operator family |
| 120 | DROP OWNED | remove database objects owned by a database role |
| 121 | DROP POLICY | remove a row-level security policy from a table |
| 122 | DROP PROCEDURE | remove a procedure |
| 123 | DROP PUBLICATION | remove a publication |
| 124 | DROP ROLE | remove a database role |
| 125 | DROP ROUTINE | remove a routine |
| 126 | DROP RULE | remove a rewrite rule |
| 127 | DROP SCHEMA | remove a schema |
| 128 | DROP SEQUENCE | remove a sequence |
| 129 | DROP SERVER | remove a foreign server descriptor |
| 130 | DROP STATISTICS | remove extended statistics |
| 131 | DROP SUBSCRIPTION | remove a subscription |
| 132 | DROP TABLE | remove a table |
| 133 | DROP TABLESPACE | remove a tablespace |
| 134 | DROP TEXT SEARCH CONFIGURATION | remove a text search configuration |
| 135 | DROP TEXT SEARCH DICTIONARY | remove a text search dictionary |
| 136 | DROP TEXT SEARCH PARSER | remove a text search parser |
| 137 | DROP TEXT SEARCH TEMPLATE | remove a text search template |
| 138 | DROP TRANSFORM | remove a transform |
| 139 | DROP TRIGGER | remove a trigger |
| 140 | DROP TYPE | remove a data type |
| 141 | DROP USER | remove a database role |
| 142 | DROP USER MAPPING | remove a user mapping for a foreign server |
| 143 | DROP VIEW | remove a view |
| 144 | END | commit the current transaction |
| 145 | EXECUTE | execute a prepared statement |
| 146 | EXPLAIN | show the execution plan of a statement |
| 147 | FETCH | retrieve rows from a query using a cursor |
| 148 | GRANT | define access privileges |
| 149 | IMPORT FOREIGN SCHEMA | import table definitions from a foreign server |
| 150 | INSERT | create new rows in a table |
| 151 | LISTEN | listen for a notification |
| 152 | LOAD | load a shared library file |
| 153 | LOCK | lock a table |
| 154 | MERGE | conditionally insert, update, or delete rows of a table |
| 155 | MOVE | position a cursor |
| 156 | NOTIFY | generate a notification |
| 157 | PREPARE | prepare a statement for execution |
| 158 | PREPARE TRANSACTION | prepare the current transaction for two-phase commit |
| 159 | REASSIGN OWNED | change the ownership of database objects owned by a database role |
| 160 | REFRESH MATERIALIZED VIEW | replace the contents of a materialized view |
| 161 | REINDEX | rebuild indexes |
| 162 | RELEASE SAVEPOINT | release a previously defined savepoint |
| 163 | RESET | restore the value of a run-time parameter to the default value |
| 164 | REVOKE | remove access privileges |
| 165 | ROLLBACK | abort the current transaction |
| 166 | ROLLBACK PREPARED | cancel a transaction that was earlier prepared for two-phase commit |
| 167 | ROLLBACK TO SAVEPOINT | roll back to a savepoint |
| 168 | SAVEPOINT | define a new savepoint within the current transaction |
| 169 | SECURITY LABEL | define or change a security label applied to an object |
| 170 | SELECT | retrieve rows from a table or view |
| 171 | SELECT INTO | define a new table from the results of a query |
| 172 | SET | change a run-time parameter |
| 173 | SET CONSTRAINTS | set constraint check timing for the current transaction |
| 174 | SET ROLE | set the current user identifier of the current session |
| 175 | SET SESSION AUTHORIZATION | set the session user identifier and the current user identifier of the current session |
| 176 | SET TRANSACTION | set the characteristics of the current transaction |
| 177 | SHOW | show the value of a run-time parameter |
| 178 | START TRANSACTION | start a transaction block |
| 179 | TRUNCATE | empty a table or set of tables |
| 180 | UNLISTEN | stop listening for a notification |
| 181 | UPDATE | update rows of a table |
| 182 | VACUUM | garbage-collect and optionally analyze a database |
| 183 | VALUES | compute a set of rows |

### B. Documented lock levels (from pages in this slice)
| Command / sub-form | Lock taken | Source |
|---|---|---|
| ALTER TABLE (default, every sub-form not listed below) | ACCESS EXCLUSIVE | sql-altertable |
| ALTER TABLE ... ALTER COLUMN SET STATISTICS | SHARE UPDATE EXCLUSIVE | sql-altertable |
| ALTER TABLE ... ALTER COLUMN SET/RESET (n_distinct, n_distinct_inherited) | SHARE UPDATE EXCLUSIVE | sql-altertable |
| ALTER TABLE ... SET (fillfactor, toast.*, autovacuum*, parallel_workers) | SHARE UPDATE EXCLUSIVE | sql-altertable |
| ALTER TABLE ... CLUSTER ON / SET WITHOUT CLUSTER | SHARE UPDATE EXCLUSIVE | sql-altertable |
| ALTER TABLE ... VALIDATE CONSTRAINT | SHARE UPDATE EXCLUSIVE (+ ROW SHARE on referenced table for FK) | sql-altertable |
| ALTER TABLE ... ADD FOREIGN KEY | SHARE ROW EXCLUSIVE on both tables | sql-altertable |
| ALTER TABLE ... ENABLE/DISABLE TRIGGER | SHARE ROW EXCLUSIVE | sql-altertable |
| ALTER TABLE ... ATTACH PARTITION | SHARE UPDATE EXCLUSIVE on parent; ACCESS EXCLUSIVE on attached table and default partition | sql-altertable |
| ALTER TABLE ... DETACH PARTITION | ACCESS EXCLUSIVE; SHARE on tables referencing the parent via FK | sql-altertable |
| ALTER TABLE ... DETACH PARTITION CONCURRENTLY | txn1 SHARE UPDATE EXCLUSIVE on parent + partition; txn2 SHARE UPDATE EXCLUSIVE parent + ACCESS EXCLUSIVE partition | sql-altertable |
| ALTER INDEX (default) | ACCESS EXCLUSIVE | sql-alterindex |
| ALTER INDEX ... RENAME | SHARE UPDATE EXCLUSIVE | sql-alterindex |
| ALTER SEQUENCE | blocks concurrent nextval/currval/lastval/setval; RESTART is transactional | sql-altersequence |
| ANALYZE | "only a read lock" (runs alongside non-DDL activity) | sql-analyze |
| CLUSTER | ACCESS EXCLUSIVE (blocks reads and writes) | sql-cluster |
| COMMENT | SHARE UPDATE EXCLUSIVE on the object | sql-comment |
| CREATE COLLATION | SHARE ROW EXCLUSIVE on pg_collation (self-conflicting, so one at a time) | sql-createcollation |
| CREATE INDEX | blocks writes but not reads | sql-createindex |
| CREATE INDEX CONCURRENTLY | no lock blocking INSERT/UPDATE/DELETE; one per table at a time | sql-createindex |
| CREATE TABLE ... PARTITION OF / DROP of a partition | ACCESS EXCLUSIVE on parent | sql-createtable |
| CREATE TABLE ... REFERENCES (adding an FK) | SHARE ROW EXCLUSIVE on referenced table | sql-createtable |
| CREATE DATABASE (copying the template) | no other connections to the template allowed; new ones locked out | sql-createdatabase |

### C. Commands / forms that cannot run inside a transaction block (this slice)
ALTER DATABASE ... SET TABLESPACE; ALTER SUBSCRIPTION ... REFRESH PUBLICATION, ... {SET|ADD|DROP} PUBLICATION with refresh=true, ... SET (failover = ...), ... SET (two_phase = false); ALTER SYSTEM (nor in a function); ALTER TABLE ... DETACH PARTITION CONCURRENTLY; CLUSTER without a table name; CLUSTER on a partitioned table; COMMIT PREPARED; CREATE DATABASE; CREATE INDEX CONCURRENTLY; CREATE SUBSCRIPTION (when it creates a slot, the default); CREATE TABLESPACE. (Related: ALTER TYPE ... ADD VALUE inside a transaction block works, but the value is unusable until commit.)

### D. Superuser-only (or role-gated) commands in this slice
- Superuser: ALTER EVENT TRIGGER, ALTER FOREIGN DATA WRAPPER, ALTER OPERATOR FAMILY, ALTER TEXT SEARCH PARSER, ALTER TEXT SEARCH TEMPLATE, ALTER FUNCTION ... SUPPORT, CREATE ACCESS METHOD, CREATE CAST ... WITHOUT FUNCTION, CREATE EVENT TRIGGER, CREATE FOREIGN DATA WRAPPER, CREATE LANGUAGE, CREATE OPERATOR CLASS, CREATE OPERATOR FAMILY, CREATE TABLESPACE, CREATE TEXT SEARCH PARSER, CREATE TEXT SEARCH TEMPLATE, LEAKPROOF marking, password_required=false on subscriptions, publication FOR ALL TABLES / FOR TABLES IN SCHEMA.
- Predefined roles: CHECKPOINT needs `pg_checkpoint`; COPY to or from server files/programs needs `pg_read_server_files` / `pg_write_server_files` / `pg_execute_server_program`; CREATE SUBSCRIPTION needs `pg_create_subscription` (+ CREATE on the database); ALTER SYSTEM needs superuser or the ALTER SYSTEM privilege on the parameter.
- MAINTAIN privilege: ANALYZE, CLUSTER (database owners may ANALYZE all non-shared tables).

### E. Rewrite / scan matrix for ALTER TABLE (from Notes)
| Change | Table rewrite? | Full scan? | Index rebuild? |
|---|---|---|---|
| ADD COLUMN, no default / non-volatile default | No (default stored in catalog metadata) | No | No |
| ADD COLUMN volatile default, stored generated, identity, constrained-domain type | Yes | - | Yes |
| ADD COLUMN virtual generated | No | No | No |
| ALTER COLUMN TYPE (general) | Yes | - | Yes |
| ALTER COLUMN TYPE, binary-coercible or unconstrained domain, USING doesn't change contents | No | No | Only if not provably equivalent (e.g. collation change); text<->varchar needs none |
| SET EXPRESSION AS on a stored generated column | Yes (data rewritten) | - | - |
| ADD CHECK / SET NOT NULL | No | Yes (skipped if NOT VALID, or for NOT NULL if a valid CHECK proves it) | No |
| ADD FOREIGN KEY | No | Yes, unless NOT VALID | No |
| ADD PRIMARY KEY USING INDEX | No | Only if columns aren't already NOT NULL | No |
| ATTACH PARTITION | No | Yes, unless a CHECK implies the bound; default partition scanned too | Missing indexes created |
| SET ACCESS METHOD | Yes | - | Yes |
| SET TABLESPACE | File copy (indexes not moved) | - | - |
| SET LOGGED / UNLOGGED | Not stated on this page (also flips linked sequences; not for temp or partitioned tables) | - | - |
| SET STORAGE / SET COMPRESSION / SET (fillfactor) | No (applies to future rows only) | No | No |
| DROP COLUMN | No (column hidden; space reclaimed over time) | No | Dependent indexes dropped |

### F. Index storage parameters → see the CREATE INDEX table (fillfactor, deduplicate_items, buffering, fastupdate, gin_pending_list_limit, pages_per_range, autosummarize). Table storage parameters → see the CREATE TABLE table (24 parameters). COPY options → see the COPY table (15 options). Subscription parameters (16) → CREATE SUBSCRIPTION tables. Publication parameters (3) → CREATE PUBLICATION table. Role attributes (10) → CREATE ROLE table. Sequence options (8) → CREATE SEQUENCE table. Tablespace options (4): seq_page_cost, random_page_cost, effective_io_concurrency, maintenance_io_concurrency. View options (3): check_option, security_barrier, security_invoker. Extended-statistics kinds (3): ndistinct, dependencies, mcv. Collation providers (3): builtin, icu, libc; builtin locales: C, C.UTF-8, PG_UNICODE_FAST. Index AMs (6 built in): btree, hash, gist, spgist, gin, brin. Trigger events (4): INSERT, UPDATE [OF], DELETE, TRUNCATE. Rule events (4): SELECT, INSERT, UPDATE, DELETE. Policy commands (5): ALL, SELECT, INSERT, UPDATE, DELETE. FK actions (5): NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT. Match types (3): FULL, PARTIAL (unimplemented), SIMPLE. Replica identity (4): DEFAULT, USING INDEX, FULL, NOTHING. CREATE DATABASE strategies (2): WAL_LOG (default), FILE_COPY. Function volatility (3), parallel safety (3), argument modes (4: IN, OUT, INOUT, VARIADIC).

### G. Progress views named in this slice
pg_stat_progress_analyze (ANALYZE), pg_stat_progress_cluster (CLUSTER), pg_stat_progress_copy (COPY), pg_stat_progress_create_index (CREATE INDEX). Other views and catalogs named: pg_statistic, pg_prepared_xacts, pg_cursors, pg_available_extensions, pg_available_extension_versions, pg_collation, pg_depend, pg_language, pg_cast, pg_subscription (subskiplsn, subtwophasestate), pg_subscription_rel, pg_publication_tables, pg_proc.

## Lesson ideas

### Visualizers
1. **ALTER TABLE lock and rewrite explorer** (M5, M2). Pick a sub-form; show the lock mode taken (tables B and E), which concurrent statements it blocks (SELECT, INSERT, other DDL), and whether the heap is rewritten, scanned or untouched. Animate the "fast default" case: new column value served from catalog metadata instead of rewriting pages.
2. **CREATE INDEX CONCURRENTLY timeline** (M4, M5). Three-transaction swimlane: catalog entry as INVALID, wait for writers, scan 1, wait, scan 2, wait for old snapshots, mark VALID. Overlay concurrent sessions inserting rows to show why the second scan is needed; add a failure branch that leaves an INVALID index which still enforces uniqueness.
3. **DETACH PARTITION CONCURRENTLY two-phase** (M7). Show the lock levels in txn 1 and txn 2, the "pending detach" state, and FINALIZE after an interruption.
4. **COPY binary file hex viewer** (M2). Render the header (11-byte `PGCOPY\n\377\r\n\0`, flags, extension length), tuples (16-bit count, 32-bit lengths, -1 = NULL) and the trailer, using the od -c example from the docs.
5. **RLS policy combiner** (M6). Drag permissive and restrictive policies onto SELECT and UPDATE lanes; build the combined boolean expression (OR within permissive, AND restrictive, AND across command types); highlight Table 301 cells as filter or check.
6. **Trigger firing order** (M6). Timeline of one UPDATE affecting 3 rows: BEFORE STATEMENT, BEFORE ROW ×3 (alphabetical), the row writes, AFTER ROW events queued (skipped when WHEN is false), AFTER STATEMENT with transition tables; then a partitioned-table variant.
7. **Range-partition bound tester** (M7). Type a multi-column key and see which `FROM (...) TO (...)` partition it routes to under row-wise comparison, including MINVALUE/MAXVALUE and 'infinity'.
8. **Sequence cache holes** (M5). Two sessions with CACHE 10 interleaving nextval calls (A gets 1, B gets 11, A gets 2) and the lost values at session end; contrast with a rollback leaving gaps.
9. **ANALYZE sampling jitter** (M4). Rerun ANALYZE on unchanged data and show the MCV list and histogram shifting slightly; then raise the statistics target.

### Playground SQL (PGlite, single session)
- Fast default vs rewrite: `CREATE TABLE t AS SELECT g AS id FROM generate_series(1,100000) g; SELECT pg_relation_filenode('t'); ALTER TABLE t ADD COLUMN c int DEFAULT 5; SELECT pg_relation_filenode('t'); ALTER TABLE t ADD COLUMN d timestamptz DEFAULT clock_timestamp(); SELECT pg_relation_filenode('t');` The filenode changes only after the volatile default.
- No rewrite on binary-coercible type change: `ALTER TABLE t ADD COLUMN s varchar(10); SELECT pg_relation_filenode('t'); ALTER TABLE t ALTER COLUMN s TYPE text; SELECT pg_relation_filenode('t');`
- Locks held by ALTER: `BEGIN; ALTER TABLE t SET (fillfactor = 70); SELECT mode FROM pg_locks WHERE relation = 't'::regclass; ROLLBACK;` (expect ShareUpdateExclusiveLock) versus `BEGIN; ALTER TABLE t ADD COLUMN z int; SELECT mode FROM pg_locks WHERE relation='t'::regclass; ROLLBACK;` (AccessExclusiveLock).
- NOT VALID + VALIDATE: `ALTER TABLE t ADD CONSTRAINT pos CHECK (id > 0) NOT VALID; SELECT convalidated FROM pg_constraint WHERE conname='pos'; ALTER TABLE t VALIDATE CONSTRAINT pos;`
- Fillfactor and HOT: `CREATE TABLE h (id int PRIMARY KEY, v int) WITH (fillfactor = 50); INSERT INTO h SELECT g, 0 FROM generate_series(1,1000) g; UPDATE h SET v = v + 1; SELECT n_tup_hot_upd, n_tup_upd FROM pg_stat_user_tables WHERE relname = 'h';` then repeat with fillfactor 100. With pageinspect: `SELECT lp, t_ctid, t_infomask2 FROM heap_page_items(get_raw_page('h', 0)) LIMIT 5;`
- Index storage params: `CREATE INDEX ON h (v) WITH (deduplicate_items = off); CREATE EXTENSION pg_trgm; CREATE TABLE docs(t text); CREATE INDEX ON docs USING gin (t gin_trgm_ops) WITH (fastupdate = off); CREATE INDEX ON h USING brin (id) WITH (pages_per_range = 16);` and inspect `SELECT reloptions FROM pg_class WHERE relname LIKE 'h_%';`
- Extended statistics (straight from the docs): the t1 dependencies example, and the t2 mcv example comparing EXPLAIN estimates before and after `CREATE STATISTICS`. Inspect via `pg_stats_ext`.
- COPY round-trip with the client-side STDIN/STDOUT path PGlite supports: `COPY (SELECT * FROM h LIMIT 3) TO STDOUT WITH (FORMAT csv, HEADER);` plus ON_ERROR: `CREATE TABLE ci(a int); COPY ci FROM STDIN WITH (ON_ERROR ignore, LOG_VERBOSITY verbose);` fed rows `1`, `x`, `3`.
- Sequence non-transactional: `CREATE SEQUENCE s; BEGIN; SELECT nextval('s'); ROLLBACK; SELECT nextval('s');` returns 2. `SELECT * FROM s;` shows last_value / log_cnt / is_called.
- Partition routing: the doc `measurement` range example plus `cities` list + DEFAULT; then `SELECT tableoid::regclass, * FROM cities;` and `EXPLAIN SELECT * FROM measurement WHERE logdate = '2016-07-15';` to show pruning.
- RLS (as table owner use FORCE): `CREATE TABLE acc(owner text, bal int); ALTER TABLE acc ENABLE ROW LEVEL SECURITY; ALTER TABLE acc FORCE ROW LEVEL SECURITY; CREATE POLICY p ON acc USING (owner = current_user); SELECT * FROM acc;` then add a RESTRICTIVE policy and observe.
- Triggers with transition tables: the doc `transfer_insert` example with a PL/pgSQL function `SELECT sum(amount) FROM inserted`.
- Domain null leak: `CREATE DOMAIN nn AS int NOT NULL; CREATE TABLE dt(c nn); INSERT INTO dt VALUES ((SELECT c FROM dt WHERE false)); SELECT * FROM dt;` inserts a NULL.
- Enum ADD VALUE in a transaction: `CREATE TYPE color AS ENUM ('red'); BEGIN; ALTER TYPE color ADD VALUE 'blue'; SELECT 'blue'::color; ROLLBACK;` errors as documented.
- CLUSTER and correlation: `CREATE TABLE r AS SELECT (random()*1e6)::int AS k FROM generate_series(1,100000); CREATE INDEX ON r(k); ANALYZE r; SELECT correlation FROM pg_stats WHERE tablename='r'; CLUSTER r USING r_k_idx; ANALYZE r;` and query correlation again.

### Pitfalls the docs warn about, with documented fixes
| Pitfall | Documented fix |
|---|---|
| Rewriting ALTER TABLE forms are not MVCC-safe; table appears empty to older snapshots | Avoid running them concurrently with long-lived snapshots (Sec. 13.6) |
| Table/index rebuild needs up to double the disk space | Plan disk space; combine sub-commands into one ALTER so only one pass happens |
| ADD CONSTRAINT scan locks out writes for a long time | ADD ... NOT VALID, commit, then VALIDATE CONSTRAINT (SHARE UPDATE EXCLUSIVE only) |
| Rebuilding a PK blocks updates | CREATE UNIQUE INDEX CONCURRENTLY, then ADD CONSTRAINT ... PRIMARY KEY USING INDEX |
| ALTER DOMAIN ADD CONSTRAINT can't see uncommitted concurrent rows | ADD ... NOT VALID, commit, wait for older transactions, VALIDATE |
| ATTACH PARTITION full scan | Pre-create a valid CHECK constraint matching the partition bound (plus NOT NULL for list keys) |
| DROP COLUMN doesn't free space | A rewriting ALTER TABLE form (or wait for row updates) |
| Collation version mismatch can corrupt indexes | REINDEX dependents, then ALTER COLLATION / DATABASE ... REFRESH (COLLATION) VERSION |
| CIC failure leaves an INVALID index (still costs writes; unique still enforced) | DROP INDEX and retry, or REINDEX INDEX CONCURRENTLY |
| CIC on a partitioned table unsupported | CIC on each partition, then CREATE INDEX on the parent non-concurrently (metadata only) |
| fillfactor 100 on an updated B-tree causes a flood of page splits | Use 100 only for static tables; 50-90 for insert/update-heavy tables |
| Turning off GIN fastupdate leaves pending entries | VACUUM or gin_clean_pending_list() |
| Turning off deduplicate_items doesn't convert existing posting lists | REINDEX |
| Failed COPY FROM leaves dead rows occupying space | VACUUM |
| COPY FREEZE breaks MVCC visibility for other sessions | Only use it for initial loads into a table created or truncated in the same transaction |
| COPY output not portable across DateStyle/IntervalStyle | SET DateStyle = ISO before COPY TO; avoid IntervalStyle sql_standard |
| COPY FROM not supported on RLS tables | Use INSERT |
| ANALYZE stats are non-deterministic | Raise the statistics target |
| n_distinct badly estimated | ALTER TABLE ... ALTER COLUMN ... SET (n_distinct = ...) |
| Autovacuum never analyzes partitioned parents or parents of only-modified children | Schedule manual ANALYZE |
| Temp tables never autovacuumed/analyzed | Manually ANALYZE after populating |
| Correlated columns underestimated | CREATE STATISTICS (dependencies / mcv / ndistinct) |
| CLUSTER ordering decays | Lower fillfactor; re-run CLUSTER periodically (bare CLUSTER re-clusters remembered tables); ANALYZE after |
| SECURITY DEFINER hijack through search_path / pg_temp | SET search_path = trusted_schema, pg_temp; REVOKE EXECUTE FROM PUBLIC in the same transaction as CREATE |
| Untrusted extension scripts (trojan horses in search_path) | Install into schemas without CREATE for untrusted users |
| Domain NOT NULL leaks NULLs via outer joins / empty subqueries | Allow NULL in the domain; put NOT NULL on columns |
| Changing a function used in a CHECK goes unnoticed | Drop the constraint, change the function, re-add the constraint |
| Sequences have gaps (nextval never rolls back; cached values lost) | Use a locked counter table if gapless numbering is required; CACHE 1 for ordered values |
| RLS doesn't cover RI and uniqueness checks (existence leaks) | Restrict writes via policies; use surrogate keys |
| Altering publish_via_partition_root can lose or duplicate data | Don't modify leaf partitions until REFRESH PUBLICATION; refresh with copy_data = off |
| Subscription to the same cluster hangs | Create the slot separately (pg_create_logical_replication_slot, pgoutput) and use create_slot = false |
| Skipping a bad remote transaction | ALTER SUBSCRIPTION ... SKIP (lsn = finish LSN) |
| Event trigger breaks DDL entirely | Restart with event_triggers = off or in single-user mode |
| Circular ON SELECT rules | Error at query time; avoid mutual _RETURN rules |
| NOTIFY in a rule fires even when no rows match | Known limitation; use a trigger instead |
| Replacing a trigger mid-transaction after table modifications | Not recommended (firing decisions already made aren't reconsidered) |
| Non-deferrable UNIQUE checked per row (multi-row key shifts fail) | DEFERRABLE INITIALLY IMMEDIATE (slower) |
| Inheritance doesn't propagate UNIQUE/PK | Use declarative partitioning, or per-child constraints |
| A partition's own default isn't used when inserting through the parent | Define the default on the partitioned table |
| CONNECTION LIMIT approximate; superusers exempt | Don't rely on it for hard limits |
| Cleartext passwords in CREATE/ALTER ROLE get logged | psql \password or createuser |
| ALTER SYSTEM is not a security boundary | allow_alter_system = off only prevents accidents |
| Comments are visible to everyone | Never put secrets in COMMENT |
