# J — Part VI Reference, SQL Commands, second half (CREATE TYPE … VALUES; _order.tsv idx 696-787)

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 696 | sql-createtype.txt | CREATE TYPE: 5 forms (composite, enum, range, base, shell); base-type support functions, INTERNALLENGTH/ALIGNMENT/STORAGE, auto array types |
| 697 | sql-createuser.txt | CREATE USER = alias of CREATE ROLE with LOGIN default |
| 698 | sql-createusermapping.txt | CREATE USER MAPPING: map user/PUBLIC to foreign server with FDW-specific OPTIONS |
| 699 | sql-createview.txt | CREATE VIEW: OR REPLACE rules, RECURSIVE, check_option/security_barrier/security_invoker, auto-updatable view conditions |
| 700 | sql-deallocate.txt | DEALLOCATE [PREPARE] {name|ALL}: drop prepared statements |
| 701 | sql-declare.txt | DECLARE cursor: BINARY, INSENSITIVE, SCROLL, WITH HOLD, portals, FOR UPDATE + WHERE CURRENT OF caveats |
| 702 | sql-delete.txt | DELETE: USING, WHERE CURRENT OF, RETURNING with OLD/NEW (v18), batch delete by ctid |
| 703 | sql-discard.txt | DISCARD ALL/PLANS/SEQUENCES/TEMP: session reset; exact equivalent statement sequence |
| 704 | sql-do.txt | DO: anonymous code block, default language plpgsql, transaction-control restriction |
| 705 | sql-drop-access-method.txt | DROP ACCESS METHOD: superuser only; CASCADE drops opclasses/opfamilies/indexes |
| 706 | sql-dropaggregate.txt | DROP AGGREGATE name(signature): `*` for zero-arg, ORDER BY for ordered-set aggregates |
| 707 | sql-dropcast.txt | DROP CAST (src AS tgt): must own source or target type; CASCADE/RESTRICT no-ops |
| 708 | sql-dropcollation.txt | DROP COLLATION: owner only |
| 709 | sql-dropconversion.txt | DROP CONVERSION: owner only; CASCADE/RESTRICT no-ops |
| 710 | sql-dropdatabase.txt | DROP DATABASE [WITH (FORCE)]: removes catalog entries + directory; not in txn block; not while connected |
| 711 | sql-dropdomain.txt | DROP DOMAIN: owner only; CASCADE drops dependent columns |
| 712 | sql-dropeventtrigger.txt | DROP EVENT TRIGGER: owner only |
| 713 | sql-dropextension.txt | DROP EXTENSION: drops member objects + explicitly dependent routines |
| 714 | sql-dropforeigndatawrapper.txt | DROP FOREIGN DATA WRAPPER: owner; CASCADE drops servers/foreign tables |
| 715 | sql-dropforeigntable.txt | DROP FOREIGN TABLE: owner only |
| 716 | sql-dropfunction.txt | DROP FUNCTION: identity = input arg types; arg list optional if name unique |
| 717 | sql-dropgroup.txt | DROP GROUP = alias for DROP ROLE |
| 718 | sql-dropindex.txt | DROP INDEX [CONCURRENTLY]: ACCESS EXCLUSIVE on table normally; CONCURRENTLY caveats |
| 719 | sql-droplanguage.txt | DROP [PROCEDURAL] LANGUAGE: superuser/owner; prefer DROP EXTENSION since 9.1 |
| 720 | sql-dropmaterializedview.txt | DROP MATERIALIZED VIEW: owner only |
| 721 | sql-dropoperator.txt | DROP OPERATOR name({left|NONE}, right) |
| 722 | sql-dropopclass.txt | DROP OPERATOR CLASS name USING method: doesn't drop operators/functions or the family |
| 723 | sql-dropopfamily.txt | DROP OPERATOR FAMILY name USING method: drops contained opclasses |
| 724 | sql-drop-owned.txt | DROP OWNED BY role: drop objects in current DB + revoke privileges (incl. on shared objects) |
| 725 | sql-droppolicy.txt | DROP POLICY name ON table: last policy removed with RLS enabled → default-deny |
| 726 | sql-dropprocedure.txt | DROP PROCEDURE: lookup rules incl. SQL-standard OUT-arg ambiguity |
| 727 | sql-droppublication.txt | DROP PUBLICATION: owner or superuser; CASCADE/RESTRICT no-ops |
| 728 | sql-droprole.txt | DROP ROLE: requires no references in any DB of cluster; memberships auto-revoked |
| 729 | sql-droproutine.txt | DROP ROUTINE: aggregate, function, or procedure; DROP PROCEDURE lookup rules |
| 730 | sql-droprule.txt | DROP RULE name ON table |
| 731 | sql-dropschema.txt | DROP SCHEMA: owner can drop even objects they don't own; CASCADE may reach other schemas |
| 732 | sql-dropsequence.txt | DROP SEQUENCE: owner or superuser |
| 733 | sql-dropserver.txt | DROP SERVER: owner; CASCADE drops user mappings |
| 734 | sql-dropstatistics.txt | DROP STATISTICS: stats owner, schema owner or superuser; CASCADE/RESTRICT no-ops |
| 735 | sql-dropsubscription.txt | DROP SUBSCRIPTION: drops remote slot; failure procedure (DISABLE, slot_name = NONE) |
| 736 | sql-droptable.txt | DROP TABLE: removes indexes/rules/triggers/constraints; CASCADE for views & inbound FKs |
| 737 | sql-droptablespace.txt | DROP TABLESPACE: must be empty across all DBs; not in txn block |
| 738 | sql-droptsconfig.txt | DROP TEXT SEARCH CONFIGURATION: owner; fails if indexes reference it in to_tsvector |
| 739 | sql-droptsdictionary.txt | DROP TEXT SEARCH DICTIONARY: owner; fails if configs use it |
| 740 | sql-droptsparser.txt | DROP TEXT SEARCH PARSER: superuser |
| 741 | sql-droptstemplate.txt | DROP TEXT SEARCH TEMPLATE: superuser |
| 742 | sql-droptransform.txt | DROP TRANSFORM FOR type LANGUAGE lang: must own type and language |
| 743 | sql-droptrigger.txt | DROP TRIGGER name ON table: table owner; names are per-table (non-standard) |
| 744 | sql-droptype.txt | DROP TYPE: owner only; CASCADE drops columns, functions, operators |
| 745 | sql-dropuser.txt | DROP USER = alternate spelling of DROP ROLE |
| 746 | sql-dropusermapping.txt | DROP USER MAPPING FOR user SERVER server |
| 747 | sql-dropview.txt | DROP VIEW: owner only |
| 748 | sql-end.txt | END [WORK|TRANSACTION] [AND [NO] CHAIN] = COMMIT (PG extension) |
| 749 | sql-execute.txt | EXECUTE name[(params)]: run prepared statement; command tag is that of the statement |
| 750 | sql-explain.txt | EXPLAIN: 12 options (ANALYZE, VERBOSE, COSTS, SETTINGS, GENERIC_PLAN, BUFFERS, SERIALIZE, WAL, TIMING, SUMMARY, MEMORY, FORMAT), cost semantics, examples |
| 751 | sql-fetch.txt | FETCH: 14 direction forms, cursor position rules, cost of ABSOLUTE |
| 752 | sql-grant.txt | GRANT: object privileges per object type; role membership with ADMIN/INHERIT/SET options |
| 753 | sql-importforeignschema.txt | IMPORT FOREIGN SCHEMA: bulk-create foreign tables, LIMIT TO / EXCEPT |
| 754 | sql-insert.txt | INSERT: column defaults, OVERRIDING, ON CONFLICT (arbiter inference, DO NOTHING/DO UPDATE, excluded), RETURNING OLD/NEW |
| 755 | sql-listen.txt | LISTEN channel: takes effect at commit; race-condition rule; not 2PC-compatible |
| 756 | sql-load.txt | LOAD 'filename': load shared library; non-superusers only from $libdir/plugins/ |
| 757 | sql-lock.txt | LOCK TABLE: 8 modes, default ACCESS EXCLUSIVE, NOWAIT, privileges per mode, deadlock advice |
| 758 | sql-merge.txt | MERGE: WHEN MATCHED / NOT MATCHED BY SOURCE / BY TARGET, execution steps, trigger firing, cardinality rule, RETURNING merge_action() |
| 759 | sql-move.txt | MOVE: reposition cursor without returning rows; same directions as FETCH |
| 760 | sql-notify.txt | NOTIFY channel[, payload]: transactional delivery, dedup, ordering, 8000-byte payload, 8GB queue, pg_notify() |
| 761 | sql-prepare.txt | PREPARE: parse/analyze/rewrite at PREPARE, plan at EXECUTE; generic vs custom plan heuristic (5 executions), plan_cache_mode, invalidation |
| 762 | sql-prepare-transaction.txt | PREPARE TRANSACTION 'gid': 2PC phase 1; restrictions, <200-byte id, max_prepared_transactions, VACUUM/wraparound caution |
| 763 | sql-reassign-owned.txt | REASSIGN OWNED BY old TO new: change ownership in current DB + shared objects; doesn't touch privileges |
| 764 | sql-refreshmaterializedview.txt | REFRESH MATERIALIZED VIEW [CONCURRENTLY] [WITH [NO] DATA]: requirements & trade-offs |
| 765 | sql-reindex.txt | REINDEX INDEX/TABLE/SCHEMA/DATABASE/SYSTEM; locks; CONCURRENTLY 6-step algorithm; _ccnew/_ccold invalid indexes; -P recovery |
| 766 | sql-release-savepoint.txt | RELEASE [SAVEPOINT] name: merge subtransaction into parent; nested example |
| 767 | sql-reset.txt | RESET param | ALL: = SET … TO DEFAULT; meaning of "default"; transactional |
| 768 | sql-revoke.txt | REVOKE: GRANT OPTION FOR, CASCADE/RESTRICT of dependent privileges, ADMIN/INHERIT/SET OPTION FOR on memberships |
| 769 | sql-rollback.txt | ROLLBACK [WORK|TRANSACTION] [AND [NO] CHAIN] |
| 770 | sql-rollback-prepared.txt | ROLLBACK PREPARED 'gid': cancel a prepared (2PC) transaction; any session, same user or superuser |
| 771 | sql-rollback-to.txt | ROLLBACK TO [SAVEPOINT] name: savepoint stays valid; cursor non-transactional behaviour |
| 772 | sql-savepoint.txt | SAVEPOINT name: nested savepoints, duplicate-name shadowing |
| 773 | sql-security-label.txt | SECURITY LABEL [FOR provider] ON object IS 'label'|NULL: MAC integration (SELinux/sepgsql) |
| 774 | sql-select.txt | SELECT: full synopsis, processing order, WITH (MATERIALIZED, RECURSIVE, SEARCH/CYCLE), FROM/TABLESAMPLE/LATERAL/joins, GROUP BY/HAVING, WINDOW frames, DISTINCT ON, set ops, ORDER BY, LIMIT/FETCH WITH TIES, locking clause, TABLE |
| 775 | sql-selectinto.txt | SELECT INTO: create table from query result; prefer CREATE TABLE AS |
| 776 | sql-set.txt | SET [SESSION|LOCAL]: transactional semantics, function SET interplay, SCHEMA/NAMES/SEED/TIME ZONE forms |
| 777 | sql-set-constraints.txt | SET CONSTRAINTS ALL|names DEFERRED|IMMEDIATE: retroactive checking; only UNIQUE/PK/FK/EXCLUDE |
| 778 | sql-set-role.txt | SET ROLE / NONE / RESET ROLE: change current user; SET/INHERIT option semantics |
| 779 | sql-set-session-authorization.txt | SET SESSION AUTHORIZATION: change session and current user; superuser-authenticated only |
| 780 | sql-set-transaction.txt | SET TRANSACTION: isolation levels, READ ONLY disallowed commands, DEFERRABLE, SNAPSHOT import rules, GUCs |
| 781 | sql-show.txt | SHOW name|ALL; SERVER_VERSION, SERVER_ENCODING, IS_SUPERUSER |
| 782 | sql-start-transaction.txt | START TRANSACTION [modes] = BEGIN; autocommit model |
| 783 | sql-truncate.txt | TRUNCATE: ACCESS EXCLUSIVE, RESTART IDENTITY, CASCADE, TRUNCATE triggers, not MVCC-safe but transaction-safe |
| 784 | sql-unlisten.txt | UNLISTEN channel|*: remove listen registrations; auto at session end; blocks 2PC |
| 785 | sql-update.txt | UPDATE: SET forms, FROM-join indeterminacy, partition row movement (40001), RETURNING old/new, batching via ctid |
| 786 | sql-vacuum.txt | VACUUM: 14 options, FULL vs plain, visibility-map page skipping, parallel vacuum, not in txn block |
| 787 | sql-values.txt | VALUES: constant tables, column1.. naming, typing rules, DEFAULT only in INSERT |

## Notes by topic

### CREATE TYPE  [M2, M6]  (source: sql-createtype.txt)
- Five forms: (1) composite `CREATE TYPE name AS (attr type [COLLATE c], ...)`; (2) enum `AS ENUM ('label', ...)`; (3) range `AS RANGE (SUBTYPE = t [, SUBTYPE_OPCLASS, COLLATION, CANONICAL, SUBTYPE_DIFF, MULTIRANGE_TYPE_NAME])`; (4) base type `CREATE TYPE name (INPUT=, OUTPUT= [, RECEIVE, SEND, TYPMOD_IN, TYPMOD_OUT, ANALYZE, SUBSCRIPT, INTERNALLENGTH={n|VARIABLE}, PASSEDBYVALUE, ALIGNMENT, STORAGE, LIKE, CATEGORY, PREFERRED, DEFAULT, ELEMENT, DELIMITER, COLLATABLE])`; (5) shell type `CREATE TYPE name` (placeholder with only name + owner; forward reference for I/O and canonical functions).
- Type name must be distinct from any type, domain AND table in the same schema (tables have associated row types). Creator becomes owner.
- Composite: essentially the row type of a table without creating a table; need USAGE on all attribute types. Zero-attribute composite allowed (PG deviation from standard).
- Enum: each label must be < NAMEDATALEN bytes (64 in a standard build → 63 usable). Zero-label enum allowed but unusable until ALTER TYPE adds a label.
- Range: subtype needs a b-tree opclass (default one unless SUBTYPE_OPCLASS). CANONICAL fn: takes range, returns range (needs shell type first, then function, then real CREATE TYPE which replaces the shell). SUBTYPE_DIFF(subtype, subtype) → double precision; optional but makes GiST indexes on the range type far more efficient. Multirange name: if range name contains substring `range` it is replaced with `multirange`, else `_multirange` appended. Need USAGE on subtype.
- Base type: superuser only ("erroneous type definition could confuse or even crash the server"). INPUT and OUTPUT required; functions generally in C.
  - input_function(cstring) or (cstring, oid, integer) — text, type's own OID (array types get the element type OID), typmod of destination column (-1 if unknown). Should be STRICT; non-strict is called with NULL first arg for NULL input (to support domain input fns). output_function(type) → cstring; never called for NULLs.
  - receive_function(internal) or (internal, oid, integer): arg is pointer to a StringInfo buffer; send_function(type) → bytea. Without them the type cannot do binary I/O. Integer types use network byte order externally, native order internally.
  - typmod: modifiers must pack into ONE non-negative integer. TYPMOD_IN gets a cstring array, returns the int stored as the column "typmod"; TYPMOD_OUT returns the cstring to append (e.g. `(30,2)`); if omitted, display is the raw typmod integer in parentheses.
  - ANALYZE fn(internal) → boolean; default ANALYZE uses the type's "equals" and "less-than" operators from the default b-tree opclass. API in src/include/commands/vacuum.h.
  - SUBSCRIPT fn(internal) → internal (pointer to struct of methods; src/include/nodes/subscripting.h; examples arraysubs.c, contrib/hstore/hstore_subs.c). Does not make the type a "true" array (not a candidate for ARRAY[] result).
  - INTERNALLENGTH: positive int for fixed length, VARIABLE (typlen = -1) default assumption. All variable-length types must start with a 4-byte integer total length (varlena header; often encoded — don't access directly).
  - PASSEDBYVALUE: only fixed-length and not larger than Datum (4 bytes on some machines, 8 on others).
  - ALIGNMENT: `char`, `int2`, `int4`, `double` = 1, 2, 4, 8 byte boundaries; default int4; variable-length types need at least 4.
  - STORAGE: `plain` (default; only choice for fixed-length; always inline, never compressed), `extended` (compress first, then move out of line), `external` (out of line allowed, no compression), `main` (compression allowed, out-of-line only as last resort). Non-plain implies the type's functions can handle toasted values; it only sets the DEFAULT strategy for columns (override per column with ALTER TABLE SET STORAGE).
  - LIKE = type copies internallength, passedbyvalue, alignment, storage.
  - CATEGORY: single ASCII char, default 'U' (user-defined); PREFERRED default false; custom categories may use any ASCII char other than an upper-case letter. Parser prefers casts to preferred types within the same category when resolving overloaded functions/operators.
  - DEFAULT (default null), ELEMENT (fixed-length array type), DELIMITER (default comma; associated with the element type, not the array type), COLLATABLE (default false).
- Array types: every user-defined type automatically gets an array type named `_` + element name (truncated to < NAMEDATALEN; repeated until non-colliding); variable length; uses array_in/array_out; tracks owner/schema changes of the element type and is dropped with it. Use `pg_type.typarray` to find it — do NOT rely on the underscore naming convention (deprecated).
- ELEMENT on a fixed-length type lets you subscript its identical fixed-length fields (e.g. `point[0]`, `point[1]`); for historical reasons such subscripts start from ZERO, unlike variable-length arrays (1). Implemented by SUBSCRIPT handler `raw_array_subscript_handler`.
- Notes: creating a base/range type is tantamount to granting PUBLIC execute on the functions it names. Implicit shell-type creation via input function still works only for C functions (deprecated). Since PG16 input functions should return "soft" errors via errsave()/ereturn() (src/backend/utils/fmgr/README).

### CREATE USER / CREATE USER MAPPING  [M1, M6]  (source: sql-createuser.txt, sql-createusermapping.txt)
- CREATE USER is an alias of CREATE ROLE; the ONLY difference: LOGIN is assumed by default (CREATE ROLE assumes NOLOGIN). Options: SUPERUSER, CREATEDB, CREATEROLE, INHERIT, LOGIN, REPLICATION, BYPASSRLS (and NO- forms), CONNECTION LIMIT, [ENCRYPTED] PASSWORD '…' | PASSWORD NULL, VALID UNTIL, IN ROLE, IN GROUP, ROLE, ADMIN, USER, SYSID.
- `CREATE USER MAPPING [IF NOT EXISTS] FOR { user_name | USER | CURRENT_ROLE | CURRENT_USER | PUBLIC } SERVER server_name [OPTIONS (option 'value', ...)]`. PUBLIC mapping is used when no user-specific mapping applies. Server owner can create mappings for anyone; a user can create one for themself if they have USAGE on the server. Options (typically remote user/password) are FDW-specific. Conforms to SQL/MED (ISO/IEC 9075-9).

### CREATE VIEW  [M6, M3]  (source: sql-createview.txt)
- `CREATE [OR REPLACE] [TEMP|TEMPORARY] [RECURSIVE] VIEW name [(cols)] [WITH (view_option [= value], ...)] AS query [WITH [CASCADED|LOCAL] CHECK OPTION]`. View is not materialized: the query runs on every reference.
- OR REPLACE: new query must produce the same columns (same names, order, types) as the existing view, but may ADD columns at the end; the expressions may differ completely. Only the SELECT rule, WITH(...) parameters and CHECK OPTION change; ownership, permissions and non-SELECT rules stay. Must own the view.
- TEMP view: dropped at session end; a view over any temp table is automatically temp. Cannot schema-qualify a temp view.
- RECURSIVE: `CREATE RECURSIVE VIEW v(cols) AS SELECT …` ≡ `CREATE VIEW v AS WITH RECURSIVE v(cols) AS (SELECT …) SELECT cols FROM v`. Column list mandatory. The self-reference inside is NOT schema-qualified (CTE names can't be).
- View options: `check_option` (enum: local|cascaded), `security_barrier` (boolean; for row-level-security-style views), `security_invoker` (boolean; base relations checked with privileges of the view USER instead of the view owner). All changeable with ALTER VIEW.
- CHECK OPTION: INSERT/UPDATE/MERGE through the view are rejected if the new row would not be visible through the view. LOCAL checks only this view's own conditions (not underlying views unless they specify CHECK OPTION themselves); CASCADED (the default when neither is written) checks this view and all underlying base views. Not allowed with RECURSIVE. Only on auto-updatable views without INSTEAD OF triggers / INSTEAD rules; cascaded check does not cascade down into a trigger-updatable view; INSTEAD rules cause all check options to be ignored. MERGE unsupported if the view or base relations have rules.
- Automatically updatable view conditions (ALL must hold): (1) exactly one FROM entry, a table or another updatable view; (2) no WITH, DISTINCT, GROUP BY, HAVING, LIMIT, OFFSET at top level; (3) no UNION/INTERSECT/EXCEPT at top level; (4) select list has no aggregates, window functions, or set-returning functions.
- Columns can be mixed: a column is updatable iff it is a simple reference to an updatable base column; others are read-only (error on assignment). INSERT … ON CONFLICT UPDATE fully supported through such views.
- View WHERE restricts which base rows UPDATE/DELETE/MERGE can touch; but without CHECK OPTION an UPDATE/INSERT can create rows not visible through the view.
- security_barrier: the view's WHERE conditions (and conditions using LEAKPROOF operators) are evaluated before user-supplied conditions; consequence: rows not ultimately returned may still get LOCKED. EXPLAIN shows which conditions are applied at relation level.
- Permissions: default = base relations accessed with view OWNER's permissions (and owner's RLS policies); with security_invoker=true the invoking user's permissions/policies. A security-invoker view nested under a non-invoker view is still checked as the current user. Functions in a view are always run as if called directly by the query (CURRENT_USER in a view returns the invoker) — a non-invoker view is NOT equivalent to a SECURITY DEFINER function. Schema USAGE lookup happens only at create/replace time.
- Pitfall: `CREATE VIEW vista AS SELECT 'Hello World';` → column named `?column?` of type text; write `SELECT text 'Hello World' AS hello`. `SELECT *` in a view is expanded at creation: columns added later to the table are NOT part of the view.
- Non-updatable views can be made writable with INSTEAD OF triggers (preferred) or rules.

### Cursors: DECLARE  [M3, M6]  (source: sql-declare.txt)
- `DECLARE name [BINARY] [ASENSITIVE|INSENSITIVE] [[NO] SCROLL] CURSOR [{WITH|WITHOUT} HOLD] FOR query` (query = SELECT or VALUES).
- All PostgreSQL cursors are insensitive (changes made later in the same transaction are not visible in the cursor); ASENSITIVE/INSENSITIVE are noise words; SENSITIVE unavailable. INSENSITIVE + FOR UPDATE/SHARE is an error.
- Default scroll behaviour is neither SCROLL nor NO SCROLL: backward fetch is allowed only if the plan is simple enough to support it without overhead. SCROLL may add a performance penalty. NO SCROLL forbids backward fetch always. SCROLL cannot be combined with FOR UPDATE/SHARE.
- WITHOUT HOLD (default): cursor lives only in the creating transaction → DECLARE outside a transaction block is an ERROR. WITH HOLD: survives successful commit (removed if the creating transaction aborts); at commit the rows are copied to a temp file or memory area; closed by CLOSE or session end. WITH HOLD not allowed with FOR UPDATE/SHARE.
- BINARY: returns binary format (e.g. integer 1 = 4-byte big-endian field). Obsolete under extended query protocol where the Bind message chooses text/binary per FETCH.
- Volatile functions + scrollable cursor: re-fetching a row may re-execute the function. Fix: NO SCROLL, or declare SCROLL WITH HOLD and commit before reading (forces full materialization → each volatile function runs exactly once per row).
- FOR UPDATE/SHARE cursors: rows locked when first fetched and are the most up-to-date versions. Recommended with `UPDATE/DELETE … WHERE CURRENT OF`: without FOR UPDATE, WHERE CURRENT OF silently has NO effect if the row changed since the cursor was created, and may fail if the query is not "simply updatable" (one table, no grouping, no ORDER BY) depending on plan choice.
- No OPEN statement in the server — a cursor is open when declared (ECPG supports DECLARE/OPEN). Underlying structure is a **portal**; portal name = cursor name; visible in `pg_cursors`.
- Standard says WHERE CURRENT OF changes are visible in an insensitive cursor; PG: not visible.

### DEALLOCATE / DISCARD / DO  [M6, M4]  (source: sql-deallocate.txt, sql-discard.txt, sql-do.txt)
- `DEALLOCATE [PREPARE] { name | ALL }` — PREPARE keyword ignored; prepared statements otherwise live until session end.
- `DISCARD { ALL | PLANS | SEQUENCES | TEMPORARY | TEMP }`. PLANS: drop all cached plans (forces re-planning). SEQUENCES: drop cached currval()/lastval() info and preallocated (cached) sequence values not yet returned by nextval(). TEMP: drop all temp tables of the session. ALL ≡ exactly this sequence: `CLOSE ALL; SET SESSION AUTHORIZATION DEFAULT; RESET ALL; DEALLOCATE ALL; UNLISTEN *; SELECT pg_advisory_unlock_all(); DISCARD PLANS; DISCARD TEMP; DISCARD SEQUENCES;`. DISCARD ALL cannot run inside a transaction block. (Relevant to connection poolers — M7.)
- `DO [LANGUAGE lang_name] code` — transient anonymous function, no parameters, returns void, parsed and executed once; default language plpgsql; LANGUAGE clause may come before or after the code. Needs USAGE on the language (superuser if untrusted). Transaction control statements inside DO only allowed if DO is NOT inside a transaction block.

### DELETE  [M3, M5]  (source: sql-delete.txt)
- `[WITH [RECURSIVE] with_query, ...] DELETE FROM [ONLY] table [*] [[AS] alias] [USING from_item, ...] [WHERE condition | WHERE CURRENT OF cursor] [RETURNING [WITH ({OLD|NEW} AS output_alias, ...)] {* | expr [[AS] name]}, ...]`.
- No WHERE → deletes all rows (TRUNCATE is faster). Without ONLY also deletes from inheriting tables. Alias completely hides the table name.
- USING: join other tables (PG extension); don't repeat the target table unless you want a self-join (then alias needed). Standard alternative: `WHERE col IN (SELECT …)`.
- Privileges: DELETE on the table, SELECT on tables in USING or read in the condition.
- RETURNING (v18 OLD/NEW): unqualified column / `*` / table-qualified → OLD values; `NEW.*` is all NULL for a plain DELETE (non-NULL only if an ON DELETE rule turned it into INSERT/UPDATE). `RETURNING WITH (OLD AS o, NEW AS n) o.*, n.*` renames and hides OLD/NEW.
- Command tag `DELETE count`; count can be less than matching rows if a BEFORE DELETE trigger suppressed deletes; 0 is not an error.
- WHERE CURRENT OF: deletes the row most recently fetched from the cursor; cursor must be a non-grouping query on the target table; cannot combine with a boolean condition.
- No LIMIT for DELETE; batch pattern: `WITH delete_batch AS (SELECT l.ctid FROM user_logs AS l WHERE l.status='archived' ORDER BY l.creation_date FOR UPDATE LIMIT 10000) DELETE FROM user_logs AS dl USING delete_batch AS del WHERE dl.ctid = del.ctid;` — ctid use is only safe because the query is run repeatedly.

### DROP family — common rules  [M1, M6]  (source: sql-drop*.txt, idx 705-747)
- Common grammar: `DROP <kind> [IF EXISTS] name [, ...] [CASCADE | RESTRICT]`. IF EXISTS → no error, a NOTICE is issued instead. RESTRICT is always the default (refuse if any object depends on it). CASCADE drops dependent objects and, in turn, everything depending on those (dependency tracking, Section 5.15).
- Multi-name lists (`name [, ...]`) are a PG extension over the standard (standard: one object per command) for: AGGREGATE, DOMAIN, EXTENSION, FOREIGN DATA WRAPPER, FOREIGN TABLE, FUNCTION, GROUP/ROLE/USER, INDEX, MATERIALIZED VIEW, OPERATOR, PROCEDURE, PUBLICATION, ROUTINE, SCHEMA, SEQUENCE, SERVER, STATISTICS, TABLE, TYPE, VIEW. Single-name only: ACCESS METHOD, CAST, COLLATION, CONVERSION, DATABASE, EVENT TRIGGER, LANGUAGE, OPERATOR CLASS/FAMILY, POLICY, RULE, SUBSCRIPTION, TABLESPACE, TEXT SEARCH *, TRANSFORM, TRIGGER, USER MAPPING.
- CASCADE/RESTRICT accepted but have NO effect (no dependencies exist) for: CAST, CONVERSION, POLICY, PUBLICATION, STATISTICS, SUBSCRIPTION. No CASCADE/RESTRICT at all: DATABASE, ROLE/USER/GROUP, TABLESPACE, USER MAPPING.
- Cannot run inside a transaction block: DROP DATABASE, DROP TABLESPACE, DROP INDEX CONCURRENTLY, DROP SUBSCRIPTION (when associated with a replication slot).
- Who may drop: owner in general. Superuser only: ACCESS METHOD, TEXT SEARCH PARSER, TEXT SEARCH TEMPLATE. Owner or superuser: LANGUAGE, PUBLICATION, SCHEMA, SEQUENCE, TABLESPACE. Table: table owner, schema owner, or superuser. Statistics: stats owner, schema owner, or superuser. CAST: owner of source OR target type. TRANSFORM: must own type AND language. TRIGGER: owner of the table. USER MAPPING: server owner, or the user themself with USAGE on the server.

### DROP — per-command specifics  [M1, M4, M6, M7]
- DROP ACCESS METHOD: CASCADE removes operator classes, operator families and indexes of that AM.
- DROP AGGREGATE `name(aggregate_signature)`: signature = `*` (zero-arg) | `[argmode] [argname] argtype, ...` | `[args] ORDER BY args` (ordered-set). argmode IN or VARIADIC. Names ignored. Example: `DROP AGGREGATE myrank(VARIADIC "any" ORDER BY VARIADIC "any");`.
- DROP DATABASE `name [[WITH] (FORCE)]`: removes catalog entries and deletes the data directory of the DB; cannot be undone; only by DB owner; cannot be connected to the target (connect to `postgres`); fails if anyone else is connected unless FORCE. FORCE terminates existing connections (background workers and those the user could kill with pg_terminate_backend) but does NOT terminate if prepared transactions, active logical replication slots or subscriptions exist in the target DB; fails if connections would remain. `dropdb` wraps it.
- DROP EXTENSION: also drops member objects and routines marked `ALTER ROUTINE … DEPENDS ON EXTENSION`. Fails (RESTRICT) if e.g. a table has a column of the extension's type.
- DROP FUNCTION: identity = name + input arg types (IN, INOUT, VARIADIC); OUT args and arg names ignored. `DROP FUNCTION f;` (no parens) works if the name is unique in schema, for any arg count; `DROP FUNCTION f();` means specifically zero args.
- DROP PROCEDURE / DROP ROUTINE lookup: with no argmode markers the list may be read the SQL-standard way (including OUT arg types, which are then verified) or the PG way (inputs only); both are tried and an error raised if two different procedures match. Recommended: write explicit IN markers. DROP ROUTINE covers aggregates, functions and procedures (there is no CREATE ROUTINE); can fail with ambiguity where the specific command would work. DROP AGGREGATE/DROP FUNCTION do not use the standard-style interpretation.
- DROP INDEX: normal form takes ACCESS EXCLUSIVE lock on the index's TABLE. CONCURRENTLY: does not lock out SELECT/INSERT/UPDATE/DELETE; waits for conflicting transactions to finish. Caveats: only ONE index name; no CASCADE (so an index backing a UNIQUE/PRIMARY KEY constraint cannot be dropped this way); not in a transaction block; not for indexes on partitioned tables. For temp tables DROP INDEX is always non-concurrent.
- DROP LANGUAGE: since 9.1 most PLs are extensions → use DROP EXTENSION.
- DROP OPERATOR `name({left_type|NONE}, right_type)`; e.g. `DROP OPERATOR ~ (none, bit);` for a prefix operator.
- DROP OPERATOR CLASS `name USING index_method`: does not drop the referenced operators/functions; needs CASCADE if indexes use it; does NOT drop its containing operator family even if left empty (even an implicitly created one) — better to DROP OPERATOR FAMILY, which also drops contained opclasses.
- DROP OWNED BY `{name|CURRENT_ROLE|CURRENT_USER|SESSION_USER}, ...`: drops all objects owned by the roles in the CURRENT database only, and revokes privileges granted to them on objects in the current DB and on shared objects (databases, tablespaces, configuration parameters). Databases and tablespaces owned by the role are NOT removed. Must be repeated in each database. CASCADE may recurse into other users' objects. Counterpart: REASSIGN OWNED (ownership only, not privileges).
- DROP POLICY `name ON table`: if the last policy is removed while RLS is still enabled, the default-deny policy applies. Disable with `ALTER TABLE … DISABLE ROW LEVEL SECURITY`.
- DROP ROLE: superuser needed to drop a superuser; otherwise CREATEROLE + ADMIN OPTION on the role. Fails if the role is still referenced in ANY database of the cluster (owned objects, granted privileges) → use REASSIGN OWNED / DROP OWNED first. Memberships (both directions) are revoked automatically. `dropuser` wraps it. DROP USER and DROP GROUP are aliases.
- DROP SCHEMA: the schema owner can drop it with all contained objects even those they don't own. CASCADE might remove objects in other schemas.
- DROP SUBSCRIPTION: normally connects to the publisher and drops the replication slot (and leftover table-sync slots). If the remote is unreachable or the slot can't be dropped, the command FAILS. Fix: `ALTER SUBSCRIPTION … DISABLE;` then `ALTER SUBSCRIPTION … SET (slot_name = NONE);` then DROP; then drop the remote slots manually or they keep reserving WAL and may fill the disk.
- DROP TABLE: always removes the table's indexes, rules, triggers, constraints. CASCADE needed when referenced by a view (view dropped entirely) or by another table's FK (only the FK constraint is removed, not the other table).
- DROP TABLESPACE: must be empty of objects in ALL databases; may also fail if listed in an active session's `temp_tablespaces` with temp files present.
- DROP TEXT SEARCH CONFIGURATION fails if indexes reference it in to_tsvector calls; DICTIONARY fails if configurations use it; PARSER fails if configurations use it; TEMPLATE fails if dictionaries use it (CASCADE drops those).
- DROP TRIGGER `name ON table`: trigger names are local to tables in PG (standard: global, `DROP TRIGGER name`).
- DROP TYPE CASCADE drops dependent table columns, functions, operators. DROP DOMAIN CASCADE drops dependent columns.
- DROP USER MAPPING `FOR {user|USER|CURRENT_ROLE|CURRENT_USER|PUBLIC} SERVER s`.

### END / EXECUTE  [M5, M4]  (source: sql-end.txt, sql-execute.txt)
- `END [WORK|TRANSACTION] [AND [NO] CHAIN]` — PG extension equivalent to COMMIT. AND CHAIN immediately starts a new transaction with the same characteristics (isolation level, read/write, deferrable). END outside a transaction → warning only.
- `EXECUTE name [(parameter, ...)]`: prepared statements are session-local; not overloaded — the name must be unique per session; parameters must be compatible with the types fixed at PREPARE. The command tag returned is that of the prepared statement, not EXECUTE.

### EXPLAIN  [M4]  (source: sql-explain.txt)
- Syntax: `EXPLAIN [ ( option [, ...] ) ] statement`. Legacy (pre-9.0, still supported, options in exactly this order): `EXPLAIN [ANALYZE] [VERBOSE] statement`. Not in the SQL standard.
- Explainable statements: SELECT, INSERT, UPDATE, DELETE, MERGE, VALUES, EXECUTE, DECLARE, CREATE TABLE AS, CREATE MATERIALIZED VIEW AS.
- Cost: estimated in arbitrary units "conventionally mean[ing] disk page fetches". Two numbers: **start-up cost** (before first row can be returned) and **total cost** (to return all rows). Usually total cost matters; in an EXISTS subquery the planner picks the smallest START-UP cost (executor stops after one row); with LIMIT the planner interpolates between the endpoint costs.
- Options (boolean values: TRUE/ON/1, FALSE/OFF/0; omitted value = TRUE):

| Option | Default | Requires ANALYZE? | Exactly what it adds |
|---|---|---|---|
| ANALYZE | FALSE | — | Actually executes the statement; shows actual run times (total elapsed time in each node, in ms) and actual rows returned, other statistics |
| VERBOSE | FALSE | no | Output column list for each node; schema-qualified table and function names; variables always labelled with range-table alias; name of each trigger for which statistics are shown; the query identifier if computed (see `compute_query_id`) |
| COSTS | TRUE | no | Estimated startup and total cost per node, estimated rows, estimated row width |
| SETTINGS | FALSE | no | Planner-affecting configuration parameters whose value differs from the built-in default |
| GENERIC_PLAN | FALSE | CANNOT be used with ANALYZE | Allows `$1`-style placeholders; produces the generic plan independent of parameter values |
| BUFFERS | FALSE alone; **automatically included when ANALYZE is used** (v18) | no | shared blocks hit/read/dirtied/written; local blocks hit/read/dirtied/written; temp blocks read/written; time spent reading/writing data file blocks, local blocks, temp file blocks (ms) if `track_io_timing` is on |
| SERIALIZE | NONE (bare `SERIALIZE` = TEXT) | yes | `{NONE|TEXT|BINARY}`: performs the output conversion (datatype output/send functions, detoasting) and measures its time (unless TIMING OFF) and buffers (if BUFFERS); never actually sends data, so network cost is not measurable |
| WAL | FALSE | yes | number of WAL records, number of full page images (fpi), WAL bytes, number of times WAL buffers became full; text format prints only non-zero values |
| TIMING | TRUE | yes | actual startup time and per-node time; turn OFF to avoid clock-read overhead when only row counts are needed; total statement run time is always measured |
| SUMMARY | on with ANALYZE, off otherwise | no | summary after the plan (e.g. Planning Time, Execution Time). For EXPLAIN EXECUTE, planning time includes fetching the plan from cache and any re-planning |
| MEMORY | FALSE | no | planner memory: precise storage used by planner in-memory structures, and total memory including allocation overhead |
| FORMAT | TEXT | no | TEXT, XML, JSON, YAML — same information, machine-parsable |

- BUFFERS vocabulary: **hit** = read avoided because the block was already in cache; **shared** blocks = regular tables and indexes; **local** blocks = temporary tables and indexes; **temp** blocks = short-term working data for sorts, hashes, Materialize nodes etc.; **dirtied** = previously unmodified blocks changed by this query; **written** = previously-dirtied blocks evicted from cache by THIS backend during the query. Counts on an upper node include all its children. Text format prints only non-zero values.
- Output fields seen in the page's examples: text: `Seq Scan on foo  (cost=0.00..155.00 rows=10000 width=4)`; `Index Scan using fi on foo (cost=0.00..5.98 rows=1 width=4)` + `Index Cond: (i = 4)`; `Aggregate (cost=23.93..23.93 rows=1 width=4)`. ANALYZE (v18 format): `HashAggregate (cost=10.77..10.87 rows=10 width=12) (actual time=0.043..0.044 rows=10.00 loops=1)`, `Group Key: foo`, `Batches: 1  Memory Usage: 24kB`, `Buffers: shared hit=4`, `Index Searches: 1` (v18 line under index scans), `Planning Time: 0.244 ms`, `Execution Time: 0.073 ms`. Note v18 prints actual rows with two decimals (`rows=99.00`).
- JSON keys: "Plan", "Node Type", "Relation Name", "Alias", "Startup Cost", "Total Cost", "Plan Rows", "Plan Width"; YAML adds "Scan Direction": "Forward", "Index Name", "Index Cond".
- IMPORTANT: ANALYZE really executes; SELECT output is discarded but side effects happen. Safe pattern for INSERT/UPDATE/DELETE/MERGE/CREATE TABLE AS/EXECUTE: `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`.
- Notes: pg_statistic must be current (autovacuum does ANALYZE; run manual ANALYZE after big changes). EXPLAIN ANALYZE adds profiling overhead — worst for nodes with tiny per-execution time and on machines with slow time-of-day system calls. Estimates can change after a new ANALYZE even when data did not (random sampling). Plans may differ between releases.
- EXPLAIN EXECUTE shows a "custom" plan for the given parameter values; `EXPLAIN (GENERIC_PLAN) SELECT … WHERE id > $1 AND id < $2` shows the generic plan (rows=500 vs rows=99 in the example: cost 26.79..26.89 vs 10.77..10.87). Parameter types are inferred; cast when not inferable (`$1::integer`).

### FETCH / MOVE (cursor positioning)  [M3, M6]  (source: sql-fetch.txt, sql-move.txt)
- `FETCH [direction] [FROM | IN] cursor_name`. Directions: NEXT (default), PRIOR, FIRST (= ABSOLUTE 1), LAST (= ABSOLUTE -1), ABSOLUTE count (negative = from end; out of range → positioned before first/after last; ABSOLUTE 0 = before first row), RELATIVE count (0 re-fetches current row), count (= FORWARD count), ALL (= FORWARD ALL), FORWARD (= NEXT), FORWARD count, FORWARD ALL, BACKWARD (= PRIOR), BACKWARD count, BACKWARD ALL. Negative count with FORWARD/BACKWARD reverses the sense.
- Position model: before first row | on a row | after last row. New cursor = before first. After fetch = on last row retrieved. Running off the end leaves it after last (or before first when going backward). RELATIVE 0 / FORWARD 0 / BACKWARD 0 re-fetch the current row (no row if before-first/after-last).
- Command tag `FETCH count` (psql shows rows instead).
- SCROLL needed for anything other than FETCH NEXT / FETCH FORWARD positive count (non-SCROLL backward works only for simple plans; NO SCROLL forbids).
- ABSOLUTE is not faster than relative moves — all intermediate rows are traversed; negative ABSOLUTE reads to the end then walks backward. Rewinding with `FETCH ABSOLUTE 0` is fast.
- Extensions: FORWARD/BACKWARD forms, bare count, ALL, IN instead of FROM or omitting both.

### GRANT  [M1]  (source: sql-grant.txt)
- Two variants: privileges on objects; membership in roles.
- Privileges per object type (exact synopsis):
  - TABLE (also views, foreign tables; `ALL TABLES IN SCHEMA`): SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN.
  - Column-level: SELECT, INSERT, UPDATE, REFERENCES `(column, ...)`.
  - SEQUENCE (`ALL SEQUENCES IN SCHEMA`): USAGE, SELECT, UPDATE.
  - DATABASE: CREATE, CONNECT, TEMPORARY (TEMP).
  - DOMAIN: USAGE. FOREIGN DATA WRAPPER: USAGE. FOREIGN SERVER: USAGE. LANGUAGE: USAGE. TYPE: USAGE.
  - FUNCTION | PROCEDURE | ROUTINE (`ALL {FUNCTIONS|PROCEDURES|ROUTINES} IN SCHEMA`): EXECUTE. FUNCTION covers plain, aggregate and window functions but NOT procedures; ROUTINE covers all.
  - LARGE OBJECT loid: SELECT, UPDATE.
  - PARAMETER configuration_parameter: SET, ALTER SYSTEM.
  - SCHEMA: CREATE, USAGE. TABLESPACE: CREATE.
  - Full privilege list: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, CREATE, CONNECT, TEMPORARY, EXECUTE, USAGE, SET, ALTER SYSTEM, MAINTAIN. `ALL [PRIVILEGES]`.
- role_specification: `[GROUP] role_name | PUBLIC | CURRENT_ROLE | CURRENT_USER | SESSION_USER`. PUBLIC = implicit group of all roles including future ones. Effective privileges = direct + via member-of roles + PUBLIC.
- WITH GRANT OPTION lets the grantee re-grant; cannot be given to PUBLIC. GRANTED BY (object form): must be the current user; SQL compatibility only.
- Owner has all privileges and grant options implicitly; the right to DROP/ALTER is inherent in ownership, not grantable. An owner CAN revoke their own ordinary privileges (e.g. make own table read-only) — non-standard.
- Role membership: `GRANT role_name, ... TO role_specification, ... [WITH {ADMIN|INHERIT|SET} {OPTION|TRUE|FALSE}] [GRANTED BY role]`. OPTION is a synonym for TRUE. Defaults: ADMIN = FALSE (may grant/revoke membership; a role does not hold ADMIN on itself); INHERIT = the new member's INHERIT attribute; SET = TRUE (allows `SET ROLE`; indirect membership needs a chain of grants all with SET TRUE). Re-issuing GRANT modifies options of an existing membership; omitted options retain values. Cannot grant membership to PUBLIC; GROUP noise word not allowed here.
- To create an object owned by another role, or `ALTER … OWNER TO` it, you must be able to SET ROLE to that role. A role whose privileges are inherited but which must not be SET ROLE-able should own no SQL objects (Trojan-horse risk via redefining its functions).
- GRANTED BY for memberships: recorded grantor must have ADMIN OPTION on the role (unless bootstrap superuser); grant depends on grantor keeping ADMIN OPTION.
- Notes: column vs table privilege: a user may act on a column if they hold the privilege on the column OR the whole table; revoking a column privilege does not undo a table-level grant. Non-owner GRANT: fails outright if the user has no privileges at all; otherwise grants only privileges for which they hold grant options (warning otherwise). Superuser GRANT/REVOKE is performed as if by the object owner (memberships: as bootstrap superuser). A member of the owning role can grant; recorded as granted by the owning role. Granting on a table does NOT extend to its sequences (including SERIAL sequences).

### IMPORT FOREIGN SCHEMA  [M6]  (source: sql-importforeignschema.txt)
- `IMPORT FOREIGN SCHEMA remote_schema [{LIMIT TO | EXCEPT} (table_name, ...)] FROM SERVER server_name INTO local_schema [OPTIONS (option 'value', ...)]`. Creates foreign tables (owned by the caller) for all tables and views in the remote schema by default; target schema must already exist. Requires USAGE on the foreign server and CREATE on the target schema. OPTIONS are FDW-specific (PG extension).

### INSERT (incl. ON CONFLICT / upsert)  [M3, M5]  (source: sql-insert.txt)
- Syntax: `[WITH [RECURSIVE] with_query, ...] INSERT INTO table_name [AS alias] [(column_name, ...)] [OVERRIDING {SYSTEM|USER} VALUE] { DEFAULT VALUES | VALUES ({expr|DEFAULT}, ...) [, ...] | query } [ON CONFLICT [conflict_target] conflict_action] [RETURNING [WITH ({OLD|NEW} AS output_alias, ...)] {* | output_expression [[AS] output_name]}, ...]`.
- conflict_target: `( {index_column_name | (index_expression)} [COLLATE collation] [opclass] [, ...] ) [WHERE index_predicate]` | `ON CONSTRAINT constraint_name`.
- conflict_action: `DO NOTHING` | `DO UPDATE SET {col = {expr|DEFAULT} | (cols) = [ROW] (exprs) | (cols) = (sub-SELECT)} [, ...] [WHERE condition]`.
- Column list: any order; if omitted = all columns in declared order, or the first N if only N values supplied (the latter disallowed by the standard). Unlisted columns get their default or NULL. Automatic type conversion is attempted. Column name may carry a subfield name or array subscript (other composite fields left NULL).
- Blocking: INSERT into tables WITHOUT unique indexes is never blocked by concurrent activity. With unique indexes it may block when concurrent sessions lock/modify rows matching the unique values being inserted (Section 63.5).
- OVERRIDING SYSTEM VALUE: user-supplied values override identity sequence values. For `GENERATED ALWAYS` identity columns an explicit non-DEFAULT value is an ERROR unless OVERRIDING SYSTEM VALUE or OVERRIDING USER VALUE is given. For `GENERATED BY DEFAULT` it is the normal behaviour (no-op). OVERRIDING USER VALUE: supplied identity values are IGNORED and sequence values used — e.g. `INSERT INTO tbl2 OVERRIDING USER VALUE SELECT * FROM tbl1`. Not allowed with DEFAULT VALUES.
- DEFAULT for a generated column is permitted (just the normal computation); for an identity column takes a new sequence value.
- A WITH inside the `query` takes precedence over the outer INSERT-level WITH for same names (more closely nested).
- ON CONFLICT semantics:
  1. For each row proposed for insertion, either the insert proceeds or — if an arbiter constraint/index named by conflict_target is violated — the conflict_action is taken.
  2. **Unique index inference**: all unique indexes on the table that, without regard to order, contain EXACTLY the conflict_target columns/expressions are chosen as arbiter indexes. With `WHERE index_predicate`, arbiter indexes must additionally be satisfied by it — any index that satisfies the predicate qualifies, so a NON-partial unique index is also inferred. Failed inference → error.
  3. `DO NOTHING`: conflict_target optional; if omitted, conflicts with ALL usable constraints and unique indexes are handled. `DO UPDATE`: conflict_target REQUIRED.
  4. In DO UPDATE's SET and WHERE: existing row via table name (or alias); proposed row via the special table **`excluded`**. Effects of per-row BEFORE INSERT triggers are reflected in `excluded` values. If the target table itself is named `excluded`, use `AS alias`.
  5. DO UPDATE `WHERE condition` is evaluated LAST, after a conflict is identified; rows that fail the condition are NOT updated but ARE still LOCKED, and are not returned by RETURNING.
  6. Arbiters: only NOT DEFERRABLE constraints and unique indexes. Exclusion constraints are NOT supported as arbiters for DO UPDATE (OK for DO NOTHING).
  7. DO UPDATE is "deterministic": the command may not affect any single existing row more than once → **cardinality violation** error if two proposed rows hit the same arbiter value.
  8. On a partitioned table, DO UPDATE cannot change the partition key of a conflicting row so that it would move to another partition (not supported).
  9. Guarantee: "ON CONFLICT DO UPDATE guarantees an atomic INSERT or UPDATE outcome; provided there is no independent error, one of those two outcomes is guaranteed, even under high concurrency" (UPSERT).
  10. In SET do not table-qualify the target column (`SET table_name.col = 1` is invalid).
- Tip: prefer inference over `ON CONSTRAINT name` — inference keeps working when an index is replaced by an equivalent one (e.g. CREATE UNIQUE INDEX CONCURRENTLY then drop the old).
- WARNING: while CREATE INDEX CONCURRENTLY or REINDEX CONCURRENTLY runs on a unique index, INSERT … ON CONFLICT on that table may unexpectedly fail with a unique violation.
- Privileges: INSERT on table (or only listed columns); DO UPDATE additionally needs UPDATE on the updated columns; all ON CONFLICT forms need SELECT on every column read (conflict_target columns, arbiter-constraint columns, columns in DO UPDATE expressions/WHERE, target columns whose `excluded` counterpart is read); RETURNING needs SELECT on all columns it mentions.
- RETURNING: unqualified / table-qualified → NEW values. `OLD.*` is all NULL for plain INSERT; non-NULL for rows updated by ON CONFLICT DO UPDATE (v18: `RETURNING old.did AS old_did, new.did AS new_did`). Only rows actually inserted or updated are returned.
- Command tag: `INSERT oid count`; oid is ALWAYS 0 (WITH OIDS tables no longer supported); count = rows inserted or updated.
- Partitioned target: rows routed to the right partition; inserting directly into a partition errors if a row violates the partition constraint.
- Array column insert: `INSERT INTO tictactoe (game, board[1:3][1:3]) VALUES (1, '{{" "," "," "},…}')`.
- Data-modifying CTE example: `WITH upd AS (UPDATE employees SET sales_count = sales_count + 1 WHERE id = (SELECT sales_person FROM accounts WHERE name = 'Acme Corporation') RETURNING *) INSERT INTO employees_log SELECT *, current_timestamp FROM upd;`.
- Examples: `ON CONFLICT (did) DO UPDATE SET dname = EXCLUDED.dname`; `INSERT INTO distributors AS d … ON CONFLICT (did) DO UPDATE SET dname = EXCLUDED.dname || ' (formerly ' || d.dname || ')' WHERE d.zipcode <> '21201'`; `ON CONFLICT ON CONSTRAINT distributors_pkey DO NOTHING`; `ON CONFLICT (did) WHERE is_active DO NOTHING` (can infer a partial unique index or a regular one).

### LISTEN / NOTIFY / UNLISTEN  [M6, M1]  (source: sql-listen.txt, sql-notify.txt, sql-unlisten.txt)
- `LISTEN channel` (any identifier): registers the session; no-op if already listening. `NOTIFY channel [, payload]`; `UNLISTEN { channel | * }`. Registrations are cleared at session end. Scope = current database. Notifications are visible to ALL users.
- Event delivered to client = channel name + notifying backend's PID + payload (empty string if not given). psql prints: `Asynchronous notification "virtual" with payload "This is the payload" received from server process with PID 8448.` libpq clients must poll `PQnotifies`.
- Transaction interaction:
  1. NOTIFY inside a transaction is delivered only if and when the transaction COMMITS.
  2. A listening session inside a transaction receives events only just after its transaction completes (commit or abort) — events are delivered only BETWEEN transactions → keep transactions short.
  3. LISTEN/UNLISTEN take effect at commit; rolled back → listen set unchanged.
  4. A transaction that executed LISTEN or NOTIFY cannot be PREPAREd for two-phase commit (UNLISTEN likewise).
- Dedup/ordering: identical (channel, payload) within the same transaction → one event; distinct payloads → distinct events; events of different transactions are never folded. Same-transaction events delivered in send order; cross-transaction events in COMMIT order.
- Self-notification: a notifier that also listens receives its own event; compare the event PID with own backend PID to ignore.
- Payload: simple string literal; in default configuration must be shorter than 8000 bytes; for bigger/binary data store in a table and send the key.
- Queue: holds sent-but-unprocessed notifications; **8GB in a standard installation** (GUC `max_notify_queue_pages`). If full, transactions calling NOTIFY FAIL AT COMMIT. No cleanup possible while a session that executed LISTEN sits in a very long transaction; at half full, warnings in the log name the blocking session. `pg_notification_queue_usage()` returns the fraction in use.
- `pg_notify(text, text)` function: for non-constant channel/payload, e.g. `SELECT pg_notify('fo' || 'o', 'pay' || 'load');`.
- LISTEN setup race rule: (1) execute and COMMIT the LISTEN; (2) in a new transaction inspect database state; (3) then rely on notifications. The session receives all events committed after an instant during the LISTEN transaction's commit step; early notifications may duplicate already-seen state (harmless).
- Common pattern: put NOTIFY in a statement-level trigger on the table.
- UNLISTEN: unregistering something not listened for is harmless; `UNLISTEN *` cancels all.

### LOAD  [M6]  (source: sql-load.txt)
- `LOAD 'filename'` loads a shared library into the server's (backend's) address space; no-op if already loaded. C-function libraries auto-load on first call, so LOAD is mainly for libraries that install hooks. Bare name searched via `dynamic_library_path`; extension may be omitted. Non-superusers may only load from `$libdir/plugins/` (filename must begin with exactly that string).

### LOCK  [M5]  (source: sql-lock.txt)
- `LOCK [TABLE] [ONLY] name [*] [, ...] [IN lockmode MODE] [NOWAIT]`; lockmode ∈ ACCESS SHARE | ROW SHARE | ROW EXCLUSIVE | SHARE UPDATE EXCLUSIVE | SHARE | SHARE ROW EXCLUSIVE | EXCLUSIVE | ACCESS EXCLUSIVE.
- **Default mode if omitted: ACCESS EXCLUSIVE** (most restrictive).
- Waits for conflicting locks; NOWAIT → error immediately (transaction aborted) if not acquirable. Lock is held until END OF TRANSACTION; there is no UNLOCK TABLE.
- Outside a transaction block LOCK is an ERROR (it would be released at statement end).
- Without ONLY, the table and all descendant tables are locked. `LOCK TABLE a, b` ≡ `LOCK TABLE a; LOCK TABLE b;` — locked one-by-one in listed order.
- Locking a view locks, recursively and with the same mode, all relations in the view's defining query.
- Automatic locking always uses the least restrictive mode; LOCK is for needing more.
- Use case (READ COMMITTED): `LOCK TABLE t IN SHARE MODE` before querying → conflicts with ROW EXCLUSIVE taken by writers, waits for in-flight writers to finish, then no uncommitted writes are outstanding and none can begin → stable view.
- REPEATABLE READ / SERIALIZABLE: must LOCK before the first SELECT or data-modification statement, because the snapshot is frozen when the first such statement begins; a later LOCK still blocks writers but doesn't guarantee reads match latest committed values.
- If the transaction will also write, use SHARE ROW EXCLUSIVE instead of SHARE (self-conflicting → only one such transaction at a time). Deadlock scenario: two transactions both hold SHARE then both want ROW EXCLUSIVE. A transaction's own locks never conflict with each other.
- Deadlock-avoidance rule: all transactions acquire locks on the same objects in the same order; if multiple modes on one object, take the most restrictive mode FIRST.
- Privileges: MAINTAIN, UPDATE, DELETE or TRUNCATE → any lock mode; INSERT → ROW EXCLUSIVE (or less-conflicting); SELECT → ACCESS SHARE only. For views: privilege on the view; underlying relations checked against view owner (or the locker if security_invoker).
- "ROW" in mode names is a misnomer — all are table-level locks; names indicate the intent to take row-level locks inside the table. ROW EXCLUSIVE is a shareable table lock. All modes have identical semantics for LOCK TABLE except for which modes conflict.
- Examples: SHARE lock on PK table before inserting into FK table; SHARE ROW EXCLUSIVE on PK table before deleting.
- No LOCK TABLE in SQL standard. Except ACCESS SHARE, ACCESS EXCLUSIVE, SHARE UPDATE EXCLUSIVE, the modes/syntax are Oracle-compatible.

### MERGE  [M3, M5]  (source: sql-merge.txt)
- Syntax: `[WITH with_query, ...] MERGE INTO [ONLY] target [*] [[AS] target_alias] USING data_source ON join_condition when_clause [...] [RETURNING [WITH ({OLD|NEW} AS alias, ...)] {* | expr [[AS] name]}, ...]`.
  - data_source: `{ [ONLY] source_table [*] | (source_query) } [[AS] source_alias]` (source may be a table, view, transition table, SELECT or VALUES).
  - when_clause: `WHEN MATCHED [AND condition] THEN {merge_update | merge_delete | DO NOTHING}` | `WHEN NOT MATCHED BY SOURCE [AND condition] THEN {merge_update | merge_delete | DO NOTHING}` | `WHEN NOT MATCHED [BY TARGET] [AND condition] THEN {merge_insert | DO NOTHING}`.
  - merge_insert: `INSERT [(cols)] [OVERRIDING {SYSTEM|USER} VALUE] {VALUES ({expr|DEFAULT}, ...) | DEFAULT VALUES}`; merge_update: `UPDATE SET …` (same three SET forms as UPDATE); merge_delete: `DELETE`.
- WITH RECURSIVE is NOT supported by MERGE. At least one WHEN clause required.
- Core algorithm: join data_source to target → candidate change rows; each row's status (MATCHED / NOT MATCHED BY SOURCE / NOT MATCHED [BY TARGET]) is set ONCE; WHEN clauses evaluated in written order; the FIRST clause evaluating true is executed; at most ONE WHEN clause executes per candidate row.
- Execution steps (Notes):
  1. Fire BEFORE STATEMENT triggers for ALL action types specified, whether or not their WHEN clauses match.
  2. Join source to target (planned normally) producing candidate change rows. For each: (a) evaluate MATCHED / NOT MATCHED BY SOURCE / NOT MATCHED [BY TARGET]; (b) test each WHEN condition in order until one is true; (c) then: BEFORE ROW triggers for the action's event type → perform the action, checking constraints on the target → AFTER ROW triggers. If the target is a view with INSTEAD OF ROW triggers for that event, they perform the action instead.
  3. Fire AFTER STATEMENT triggers for the actions specified, whether or not they occurred.
  - Net: statement triggers fire for every action KIND mentioned; row triggers only for the kind actually executed.
- Action restrictions: no WHERE clause and no table name in actions; all actions refer to the target. INSERT action: one VALUES row only, no sub-selects, can refer only to SOURCE columns. Column names may not repeat. NOT MATCHED BY SOURCE conditions/expressions may refer only to TARGET columns; NOT MATCHED [BY TARGET] only to SOURCE columns; MATCHED to both. Only target's system attributes are accessible. ONLY / `*` do not affect inserts (always into the named table).
- If BOTH `NOT MATCHED BY SOURCE` and `NOT MATCHED [BY TARGET]` are present → a FULL join is performed; requires at least one join_condition subexpression with a hash-joinable operator, or all merge-joinable.
- WARNING: join_condition should contain only target columns that are matched against source rows; subexpressions referencing only target columns can change which action is taken in surprising ways.
- Reachability: a WHEN clause with no AND becomes the final reachable clause of its kind; a later clause of the same kind → error (provably unreachable). If there is no final catch-all, some candidate rows get no action.
- Cardinality: the join should produce at most one candidate row per target row. If a target row joins to more than one source row, only one is applied; a later attempt errors: repeated INSERT → uniqueness violation; repeated UPDATE/DELETE → **cardinality violation** (required by the standard). Also occurs if row triggers modified rows MERGE then modifies. This differs from UPDATE … FROM / DELETE … USING, where second and subsequent attempts are silently ignored.
- DO NOTHING skips the row — useful as an early filter since clauses are ordered.
- Source row order indeterminate; use an ORDER BY in source_query for consistent ordering (may be needed to avoid deadlocks).
- Concurrency: usual isolation rules (Section 13.2); INSERT … ON CONFLICT is the alternative that can UPDATE if a concurrent INSERT occurs — "not interchangeable".
- Privileges: no MERGE privilege; UPDATE on SET columns, INSERT, DELETE as per actions; DO NOTHING needs SELECT on at least one target column; SELECT on all columns read. Checked once at statement start regardless of which WHEN clauses run.
- Unsupported targets: materialized view, foreign table, anything with rules. View target must be auto-updatable (no INSTEAD OF triggers) or have INSTEAD OF triggers for every action type used.
- RETURNING: may use source and target columns and `merge_action()` (returns which action ran). `*` = all source columns then all target columns. Unqualified target column → NEW values for INSERT/UPDATE, OLD values for DELETE; `old.`/`new.` explicit. Example: `RETURNING merge_action(), w.winename, old.stock AS old_stock, new.stock AS new_stock;`.
- Command tag: `MERGE total_count` (inserted + updated + deleted).
- Extensions to standard: WITH clause, BY SOURCE / BY TARGET, DO NOTHING, RETURNING.
- Examples:
  - `MERGE INTO customer_account ca USING recent_transactions t ON t.customer_id = ca.customer_id WHEN MATCHED THEN UPDATE SET balance = balance + transaction_value WHEN NOT MATCHED THEN INSERT (customer_id, balance) VALUES (t.customer_id, t.transaction_value);`
  - `MERGE INTO wines w USING wine_stock_changes s ON s.winename = w.winename WHEN NOT MATCHED AND s.stock_delta > 0 THEN INSERT VALUES(s.winename, s.stock_delta) WHEN MATCHED AND w.stock + s.stock_delta > 0 THEN UPDATE SET stock = w.stock + s.stock_delta WHEN MATCHED THEN DELETE RETURNING merge_action(), w.winename, old.stock AS old_stock, new.stock AS new_stock;`
  - Sync: `… WHEN NOT MATCHED BY TARGET THEN INSERT VALUES(s.winename, s.stock) WHEN MATCHED AND w.stock != s.stock THEN UPDATE SET stock = s.stock WHEN NOT MATCHED BY SOURCE THEN DELETE;`

### MOVE  [M3]  (source: sql-move.txt)
- `MOVE [direction] [FROM|IN] cursor_name` — exactly like FETCH but returns no rows. Tag `MOVE count` = number of rows an equivalent FETCH would have returned. Not in the standard.

### PREPARE / EXECUTE / DEALLOCATE (prepared statements, plan caching)  [M4]  (source: sql-prepare.txt, sql-execute.txt, sql-deallocate.txt)
- `PREPARE name [(data_type, ...)] AS statement` — statement ∈ SELECT, INSERT, UPDATE, DELETE, MERGE, VALUES.
- Pipeline split: at PREPARE the statement is **parsed, analyzed, and rewritten**; at each EXECUTE it is **planned and executed**. Avoids repeated parse analysis while letting the plan depend on parameter values.
- Parameters `$1, $2, …`; type list optional; a parameter with unspecified type or declared `unknown` is inferred from the context where it is first referenced.
- Session-scoped server-side object: gone at session end; not shareable across clients; name unique within session; listed in view `pg_prepared_statements`.
- Biggest win: many similar statements in one session, especially when planning/rewriting is complex (many-table joins, several rules); little win when planning is cheap but execution expensive.
- **Generic vs custom plan**: generic plan = same for all executions (contains `$n` symbols in EXPLAIN); custom plan = planned for the specific parameter values (values substituted in EXPLAIN). No parameters → always generic.
- Default heuristic (`plan_cache_mode = auto`):
  1. The first FIVE executions use custom plans; the average estimated cost of those plans is computed.
  2. Then a generic plan is created and its estimated cost compared with the average custom-plan cost.
  3. Subsequent executions use the generic plan if its cost is "not so much higher than the average custom-plan cost as to make repeated replanning seem preferable".
- Override: `plan_cache_mode = force_generic_plan | force_custom_plan` (useful when the generic plan's cost estimate is badly off).
- Inspect: `EXPLAIN EXECUTE name(parameter_values);` or `EXPLAIN (GENERIC_PLAN) <query with $n>`.
- Invalidation: re-analysis and re-planning are forced whenever objects used in the statement undergo DDL changes or their planner statistics are updated since the last use. If `search_path` changes between uses, the statement is re-parsed with the new search_path (since 9.3). Imperfect equivalence case: an unqualified table reference, then a new same-named table is created in a schema earlier in search_path → no automatic re-parse (no used object changed) until something else forces one.
- Examples: `PREPARE fooplan (int, text, bool, numeric) AS INSERT INTO foo VALUES($1, $2, $3, $4); EXECUTE fooplan(1, 'Hunter Valley', 't', 200.00);` — `PREPARE usrrptplan (int) AS SELECT * FROM users u, logs l WHERE u.usrid=$1 AND u.usrid=l.usrid AND l.date = $2; EXECUTE usrrptplan(1, current_date);` ($2 type inferred).

### Two-phase commit: PREPARE TRANSACTION / COMMIT PREPARED / ROLLBACK PREPARED  [M5, M7]  (source: sql-prepare-transaction.txt, sql-rollback-prepared.txt; COMMIT PREPARED is in the first-half slice)
- `PREPARE TRANSACTION transaction_id` — id is a string literal, **less than 200 bytes**, unique among currently prepared transactions.
- Effect: transaction is dissociated from the session; its state is fully stored on disk; "very high probability that it can be committed successfully, even if a database crash occurs before the commit is requested". For the issuing session it looks like a ROLLBACK: no active transaction, effects no longer visible (until COMMIT PREPARED).
- If PREPARE TRANSACTION fails for any reason it becomes a ROLLBACK.
- `COMMIT PREPARED 'id'` / `ROLLBACK PREPARED 'id'` can be issued from ANY session; must be executed by the same user that ran the original transaction or a superuser; cannot be run inside a transaction block (the prepared transaction is rolled back/committed immediately).
- Must be inside a transaction block (BEGIN).
- NOT allowed if the transaction: used temporary tables or the session's temporary namespace, created WITH HOLD cursors, or executed LISTEN, UNLISTEN, or NOTIFY.
- `SET` (non-LOCAL) effects persist after PREPARE TRANSACTION and are unaffected by later COMMIT/ROLLBACK PREPARED (in this respect it acts like COMMIT).
- View: `pg_prepared_xacts`.
- CAUTION: long-lived prepared transactions hold their locks, prevent VACUUM from reclaiming storage, and in extreme cases can force a shutdown to prevent transaction-ID wraparound. Without an external transaction manager, keep `max_prepared_transactions = 0` to disable.
- Intended only for external transaction managers (e.g. X/Open XA); PG extension.

### REASSIGN OWNED  [M1]  (source: sql-reassign-owned.txt)
- `REASSIGN OWNED BY {old_role|CURRENT_ROLE|CURRENT_USER|SESSION_USER}, ... TO {new_role|CURRENT_ROLE|CURRENT_USER|SESSION_USER}`: changes owner of all objects in the CURRENT database and of all shared objects (databases, tablespaces) owned by the old roles. Must be run in each database. Requires the privileges each individual ALTER … OWNER TO would need, except the target role does NOT need CREATE on the containing schema. Does not touch privileges granted to old roles on objects they don't own, nor default privileges (ALTER DEFAULT PRIVILEGES) — use DROP OWNED for those. Role-removal recipe: REASSIGN OWNED → DROP OWNED → DROP ROLE.

### REFRESH MATERIALIZED VIEW  [M6, M5]  (source: sql-refreshmaterializedview.txt)
- `REFRESH MATERIALIZED VIEW [CONCURRENTLY] name [WITH [NO] DATA]`. Requires MAINTAIN privilege on the matview.
- Completely replaces contents; old contents discarded. WITH DATA (default): runs the backing query → scannable. WITH NO DATA: no data generated, storage freed, matview left **unscannable**.
- CONCURRENTLY: does not lock out concurrent SELECTs on the matview. Non-concurrent refresh affecting many rows uses fewer resources and is faster but can block readers; CONCURRENTLY may be faster when few rows change.
- CONCURRENTLY requirements: (1) at least one UNIQUE index on the matview that uses only column names and includes all rows (not an expression index, no WHERE clause); (2) the matview must already be populated; (3) cannot be combined with WITH NO DATA. Even with CONCURRENTLY only ONE refresh at a time may run against a given matview.
- ORDER BY in the defining query orders the original contents but REFRESH does not guarantee preserving it.
- During REFRESH `search_path` is temporarily `pg_catalog, pg_temp`.

### REINDEX  [M4, M7, M5]  (source: sql-reindex.txt)
- `REINDEX [(option, ...)] {INDEX | TABLE | SCHEMA} [CONCURRENTLY] name` ; `REINDEX [(option, ...)] {DATABASE | SYSTEM} [CONCURRENTLY] [name]`. Options: `CONCURRENTLY [boolean]`, `TABLESPACE new_tablespace`, `VERBOSE [boolean]` (progress report per index at INFO level).
- When to use: (1) index corrupted (software bug / hardware failure); (2) index bloated — many empty or nearly-empty pages (B-tree under uncommon access patterns); (3) changed a storage parameter such as fillfactor and want it fully applied; (4) a CONCURRENTLY index build failed and left an "invalid" index — only `REINDEX INDEX` can do a concurrent build on an invalid index.
- Scope forms:
  - INDEX: one index. Not in a transaction block if it is a partitioned index.
  - TABLE: all indexes of the table, plus its TOAST table's. Not in a transaction block for a partitioned table.
  - SCHEMA: all indexes in the schema (+ TOAST); indexes on shared system catalogs are also processed. Never in a transaction block.
  - DATABASE: all indexes in the CURRENT database EXCEPT system catalogs. Never in a transaction block. Name optional, must match current DB.
  - SYSTEM: all indexes on system catalogs in the current database, including shared catalogs; user-table indexes not processed. Never in a transaction block. Does NOT support CONCURRENTLY.
- Locking (non-concurrent): locks out WRITES but not reads of the parent table; takes **ACCESS EXCLUSIVE on the index being processed**, which blocks reads that try to use that index. Because the planner tries to take ACCESS SHARE on EVERY index of the table regardless of query, REINDEX blocks virtually all queries on the table except some prepared queries with cached plans not using that index. Contrast: DROP INDEX momentarily takes ACCESS EXCLUSIVE on the parent table (blocks reads and writes); the following CREATE INDEX blocks writes not reads, and reads may fall back to expensive seq scans.
- CONCURRENTLY: no locks that prevent concurrent INSERT/UPDATE/DELETE. Requires TWO table scans per index and waits for termination of all existing transactions that could use the index; more total work, significantly longer. Temp tables: always non-concurrent.
- Concurrent reindex steps (each step in a separate transaction; with multiple indexes each step loops over all indexes before the next step):
  1. A new transient index definition is added to `pg_index`. A session-level SHARE UPDATE EXCLUSIVE lock is taken on the indexes being reindexed and their tables (prevents schema modification).
  2. First pass builds each new index; then `pg_index.indisready` → true (ready for inserts; visible to other sessions when the build transaction finishes). Separate transaction per index.
  3. Second pass adds tuples that were added during the first pass. Separate transaction per index.
  4. All constraints referring to the index are repointed to the new index definition and the index names are swapped. `pg_index.indisvalid` → true for the new, false for the old; cache invalidation makes all sessions referencing the old index invalidate it.
  5. Old indexes get `pg_index.indisready` → false (no new tuple insertions) after waiting for running queries that might reference the old index.
  6. Old indexes are dropped. The SHARE UPDATE EXCLUSIVE session locks are released.
- Failure (e.g. uniqueness violation in a unique index): command fails and leaves an INVALID index — ignored for querying but still costs update overhead. psql `\d` shows `"idx_ccnew" btree (col) INVALID`. Suffix `_ccnew` = the transient new index → DROP INDEX it and retry REINDEX CONCURRENTLY. Suffix `_ccold` = original index that could not be dropped → just drop it (rebuild succeeded). A number may be appended (`_ccnew1`, `_ccold2`).
- Regular index builds allow other regular builds on the same table simultaneously, but only ONE concurrent index build per table at a time; no other schema modification meanwhile. Regular REINDEX TABLE/INDEX can run in a transaction block; REINDEX CONCURRENTLY cannot.
- Like any long-running transaction, REINDEX can hold back tuple removal by VACUUM on any other table.
- Indexes for EXCLUSION constraints cannot be reindexed concurrently: error if named directly; skipped when reindexing a table/database concurrently.
- Progress: `pg_stat_progress_create_index`.
- Privileges: MAINTAIN on the table for INDEX/TABLE (partition-level checks skipped when processing partitions of a partitioned parent). SCHEMA/DATABASE: owner of it or privileges of role `pg_maintain` (so non-superusers can rebuild others' indexes). REINDEX DATABASE/SCHEMA/SYSTEM skip shared-catalog indexes unless the user has MAINTAIN on the catalog.
- Partitioned indexes/tables: supported via REINDEX INDEX / TABLE; each partition reindexed in a SEPARATE transaction (hence no transaction block).
- TABLESPACE on partitioned: only leaf partitions' tablespace refs change; partitioned index itself is not updated (use `ALTER TABLE ONLY` so new partitions inherit). With SCHEMA/DATABASE/SYSTEM + TABLESPACE, system relations are skipped with a single WARNING; TOAST indexes are rebuilt but not moved.
- `search_path` is temporarily `pg_catalog, pg_temp` during REINDEX.
- System-catalog index corruption recovery: start the server with `-P` (don't use indexes for system catalog lookups) — either single-user `postgres -P`, then `REINDEX SYSTEM` (if in doubt), or a regular session with `PGOPTIONS="-P"`; e.g. `export PGOPTIONS="-P"; psql broken_db; REINDEX DATABASE broken_db;`.

### SAVEPOINT / RELEASE SAVEPOINT / ROLLBACK TO SAVEPOINT (subtransactions)  [M5]  (source: sql-savepoint.txt, sql-release-savepoint.txt, sql-rollback-to.txt)
- `RELEASE [SAVEPOINT] savepoint_name`: releases the named savepoint AND all active savepoints created after it, freeing resources. Changes since the savepoint that were not rolled back are merged into the transaction or savepoint that was active when the named savepoint was created.
- Releasing an undefined name is an error. Cannot RELEASE when the transaction is in an aborted state — use ROLLBACK TO SAVEPOINT. With duplicate names only the most recently defined unreleased one is released; repeating releases progressively older ones.
- Nested example: `BEGIN; INSERT 1; SAVEPOINT sp1; INSERT 2; SAVEPOINT sp2; INSERT 3; RELEASE SAVEPOINT sp2; INSERT 4 -- error`. After releasing sp2, value 3 belongs to sp1's context. The error loses 2 and 4, and 3 too. Only `ROLLBACK;` (loses 1 as well) or `ROLLBACK TO SAVEPOINT sp1;` (keeps 1, transaction continues) are accepted; all other commands are ignored.
- Standard requires the SAVEPOINT keyword in RELEASE; PG allows omission.

### RESET  [M7]  (source: sql-reset.txt)
- `RESET configuration_parameter` | `RESET ALL` ≡ `SET configuration_parameter TO DEFAULT`. "Default" = the value the parameter would have had if no SET had ever been issued in the current session (compiled-in default, config file, command line, per-database or per-user settings) — NOT "value at session start": if it came from the config file, it resets to what the file says NOW. Transactional like SET (undone by rollback).

### REVOKE  [M1]  (source: sql-revoke.txt)
- Mirrors every GRANT form: `REVOKE [GRANT OPTION FOR] privileges ON object FROM role_specification, ... [GRANTED BY role] [CASCADE | RESTRICT]`; membership form: `REVOKE [{ADMIN | INHERIT | SET} OPTION FOR] role_name, ... FROM role_specification, ... [GRANTED BY role] [CASCADE | RESTRICT]`.
- `GRANT OPTION FOR` revokes only the grant option; otherwise both the privilege and the grant option are revoked.
- Dependent privileges (those granted onward by a holder with grant option): with CASCADE they are revoked recursively; without it (RESTRICT is the PG default; the standard requires one be written) the REVOKE FAILS. Recursion follows only the chain traceable to the revoked user — the others may keep the privilege if also granted via someone else.
- Effective privilege = direct ∪ via membership ∪ PUBLIC: revoking SELECT from PUBLIC does not remove it from roles holding it directly; revoking from a user does not help if PUBLIC still has it.
- Revoking a table privilege automatically revokes the corresponding column privileges on every column. Revoking a privilege on individual columns has NO effect when the role has the table-level privilege.
- Memberships: ADMIN OPTION plays the role of GRANT OPTION; since PG16 dependent grants ARE tracked for memberships so CASCADE matters (before 16 it had no effect). `REVOKE INHERIT OPTION FOR` / `SET OPTION FOR` ≡ setting that option FALSE.
- A user can only revoke privileges they granted directly. A→B (with grant option)→C: A cannot revoke from C directly; A does `REVOKE GRANT OPTION FOR … FROM B CASCADE`. If both A and B granted to C, A's revoke leaves B's grant. `REVOKE ALL PRIVILEGES ON kinds FROM manuel` means "revoke all privileges that I granted".
- Non-owner REVOKE: fails outright with no privileges; otherwise revokes only those for which grant options are held (warnings). Superuser's REVOKE acts as the object owner (as bootstrap superuser for memberships). With multiple membership paths the acting role is unspecified → `SET ROLE` first, or you may revoke something unintended or nothing.

### ROLLBACK  [M5]  (source: sql-rollback.txt)
- `ROLLBACK [WORK | TRANSACTION] [AND [NO] CHAIN]` discards all updates of the current transaction. AND CHAIN starts a new (not aborted) transaction with the same characteristics. Outside a transaction block: warning, no effect; but `ROLLBACK AND CHAIN` outside a block is an ERROR.

### ROLLBACK TO SAVEPOINT / SAVEPOINT details  [M5]  (source: sql-rollback-to.txt, sql-savepoint.txt)
- `SAVEPOINT savepoint_name` — only inside a transaction block; multiple allowed. A savepoint = "special mark inside a transaction that allows all commands executed after it to be rolled back, restoring the transaction state to what it was at the time of the savepoint".
- `ROLLBACK [WORK | TRANSACTION] TO [SAVEPOINT] savepoint_name`: rolls back all commands after the savepoint and "start[s] a new subtransaction at the same transaction level"; the savepoint REMAINS valid (can roll back to it again); implicitly destroys all savepoints established after it. Unknown name → error. AND CHAIN not supported here.
- Duplicate names: PG keeps the old savepoint (standard says destroy it); only the newest is used; releasing the newer makes the older accessible again. Example: 1 / SAVEPOINT s / 2 / SAVEPOINT s / 3 / ROLLBACK TO s (rows 1,2) / RELEASE s / ROLLBACK TO s (row 1 only).
- Classic example: `BEGIN; INSERT 1; SAVEPOINT my_savepoint; INSERT 2; ROLLBACK TO SAVEPOINT my_savepoint; INSERT 3; COMMIT;` → inserts 1 and 3.
- Cursors are partly non-transactional w.r.t. savepoints: (a) a cursor OPENED inside a savepoint is closed when it is rolled back; (b) cursor motion by FETCH/MOVE inside a rolled-back savepoint is NOT undone (example: FETCH 1 → 1; ROLLBACK TO; FETCH 1 → 2); (c) closing a cursor is not undone; (d) other side effects of the cursor's query (volatile functions) ARE rolled back; (e) a cursor whose execution caused the abort is put in a cannot-execute state and is unusable even after ROLLBACK TO.

### SECURITY LABEL  [M1, M6]  (source: sql-security-label.txt)
- `SECURITY LABEL [FOR provider] ON {TABLE | COLUMN t.c | AGGREGATE | DATABASE | DOMAIN | EVENT TRIGGER | FOREIGN TABLE | FUNCTION | LARGE OBJECT oid | MATERIALIZED VIEW | [PROCEDURAL] LANGUAGE | PROCEDURE | PUBLICATION | ROLE | ROUTINE | SCHEMA | SEQUENCE | SUBSCRIPTION | TABLESPACE | TYPE | VIEW} … IS {string_literal | NULL}`. NULL drops the label.
- One label per label provider per object. Providers are loadable modules registering via C function `register_label_provider` (not SQL-callable). Provider decides validity/meaning; PG only stores them. Intended for label-based mandatory access control (MAC) such as SELinux (`sepgsql`), vs discretionary access control (DAC). Must own the object. Provider name may be omitted if exactly one is loaded. Example: `SECURITY LABEL FOR selinux ON TABLE mytable IS 'system_u:object_r:sepgsql_table_t:s0';`. Test module: src/test/modules/dummy_seclabel.

### SELECT — synopsis and logical processing order  [M3, M4]  (source: sql-select.txt)
- Synopsis:
  ```
  [ WITH [ RECURSIVE ] with_query [, ...] ]
  SELECT [ ALL | DISTINCT [ ON ( expression [, ...] ) ] ]
      [ { * | expression [ [ AS ] output_name ] } [, ...] ]
      [ FROM from_item [, ...] ]
      [ WHERE condition ]
      [ GROUP BY [ ALL | DISTINCT ] grouping_element [, ...] ]
      [ HAVING condition ]
      [ WINDOW window_name AS ( window_definition ) [, ...] ]
      [ { UNION | INTERSECT | EXCEPT } [ ALL | DISTINCT ] select ]
      [ ORDER BY expression [ ASC | DESC | USING operator ] [ NULLS { FIRST | LAST } ] [, ...] ]
      [ LIMIT { count | ALL } ]
      [ OFFSET start [ ROW | ROWS ] ]
      [ FETCH { FIRST | NEXT } [ count ] { ROW | ROWS } { ONLY | WITH TIES } ]
      [ FOR { UPDATE | NO KEY UPDATE | SHARE | KEY SHARE } [ OF from_reference [, ...] ] [ NOWAIT | SKIP LOCKED ] [...] ]
  ```
- from_item forms: `[ONLY] table [*] [[AS] alias [(col_alias, ...)]] [TABLESAMPLE method(arg, ...) [REPEATABLE (seed)]]` | `[LATERAL] (select) [[AS] alias [(cols)]]` | `with_query_name [[AS] alias [(cols)]]` | `[LATERAL] function(args) [WITH ORDINALITY] [[AS] alias [(cols)]]` | `[LATERAL] function(args) [AS] alias (column_definition, ...)` | `[LATERAL] function(args) AS (column_definition, ...)` | `[LATERAL] ROWS FROM( function(args) [AS (column_definition, ...)] [, ...] ) [WITH ORDINALITY] [[AS] alias [(cols)]]` | `from_item join_type from_item {ON cond | USING (cols) [AS join_using_alias]}` | `from_item NATURAL join_type from_item` | `from_item CROSS JOIN from_item`.
- grouping_element: `()` | `expression` | `(expression, ...)` | `ROLLUP (...)` | `CUBE (...)` | `GROUPING SETS (grouping_element, ...)`.
- with_query: `name [(cols)] AS [[NOT] MATERIALIZED] (select | values | insert | update | delete | merge) [SEARCH {BREADTH | DEPTH} FIRST BY col, ... SET search_seq_col_name] [CYCLE col, ... SET cycle_mark_col_name [TO cycle_mark_value DEFAULT cycle_mark_default] USING cycle_path_col_name]`.
- `TABLE [ONLY] table_name [*]` ≡ `SELECT * FROM name`.
- **General processing order of SELECT (as documented)**:
  1. All WITH queries are computed (effectively temp tables; a WITH query referenced more than once in FROM is computed only once unless NOT MATERIALIZED).
  2. All FROM elements computed; multiple elements are cross-joined.
  3. WHERE eliminates rows not satisfying the condition.
  4. GROUP BY / aggregates: rows combined into groups, aggregates computed; HAVING eliminates groups. (Output columns may be referenced by name or ordinal in GROUP BY even though nominally computed next.)
  5. Output rows computed from SELECT-list expressions.
  6. SELECT DISTINCT removes duplicates; DISTINCT ON keeps rows unique on the given expressions; ALL (default) keeps everything.
  7. UNION / INTERSECT / EXCEPT combine results (duplicates eliminated unless ALL — DISTINCT is the default HERE although ALL is the default for SELECT itself).
  8. ORDER BY sorts; without it rows come "in whatever order the system finds fastest to produce".
  9. LIMIT (or FETCH FIRST) / OFFSET return a subset.
  10. FOR UPDATE / FOR NO KEY UPDATE / FOR SHARE / FOR KEY SHARE lock the selected rows.
- Privileges: SELECT on each column used; locking clauses additionally require UPDATE privilege (on at least one column of each table so locked).

### SELECT — WITH clause (CTEs)  [M3, M4]
- Each WITH subquery may be SELECT, TABLE, VALUES, INSERT, UPDATE, DELETE, or MERGE. For data-modifying statements it is the RETURNING output (not the modified table) that forms the temp table; without RETURNING the statement still executes but cannot be referenced.
- Names are unqualified; a WITH name hides any real table of the same name in the primary query (schema-qualify to reach the real table).
- RECURSIVE: subquery form must be `non_recursive_term UNION [ALL | DISTINCT] recursive_term`; the self-reference must be on the right-hand side of the UNION; only ONE recursive self-reference per query. Recursive data-modifying statements are not supported (but a recursive SELECT's result can feed a data-modifying statement).
- RECURSIVE also lifts ordering: WITH queries may reference later siblings (no circular references / mutual recursion). Without RECURSIVE, only earlier siblings. Write RECURSIVE once right after WITH; it applies to all queries.
- SEARCH {BREADTH | DEPTH} FIRST BY cols SET search_seq_col: adds a sequence column to the CTE's result to ORDER BY in the outer query. CYCLE cols SET mark_col [TO value DEFAULT default] USING path_col: adds mark_col (set to cycle_mark_value on cycle detection; defaults TRUE/FALSE boolean) and path_col (internal visited-rows tracking); the recursive union stops processing when a cycle is detected. Values must be constants coercible to a common type with an inequality operator. Both clauses only for recursive WITH that is a UNION [ALL] of exactly two SELECTs (no nested UNIONs); SEARCH column appears before CYCLE columns.
- Primary query and all WITH queries are (notionally) executed at the same time → effects of a data-modifying WITH cannot be seen by other parts of the query except via RETURNING. Two data-modifying statements touching the same row → results unspecified.
- Evaluate-once guarantee: WITH queries are normally evaluated once per execution of the primary query even if referenced multiple times; data-modifying statements are executed once and only once, regardless of whether the primary query reads all or any of their output.
- **Materialization rules (v12+)**:
  - Default: a side-effect-free WITH query (plain SELECT with no volatile functions, non-recursive) referenced EXACTLY ONCE in the primary query's FROM is FOLDED (inlined) into the primary query → joint optimization.
  - `MATERIALIZED` prevents folding → acts as an optimization fence.
  - `NOT MATERIALIZED` allows folding even when referenced more than once (duplicate computation, but can win if each use needs only a few rows). Ignored if the CTE is recursive or not side-effect-free.
  - PG before v12 never folded: old queries may rely on WITH as an optimization fence.

### SELECT — FROM clause  [M3]
- Multiple sources → Cartesian product. ONLY restricts to the named table; otherwise descendants included (`*` explicit).
- Alias completely hides the real name (`FROM foo AS f` → must use `f`). Column alias list allowed.
- **TABLESAMPLE sampling_method (argument, ...) [REPEATABLE (seed)]**: sampling happens BEFORE any other filter such as WHERE. Built-in methods: `BERNOULLI` and `SYSTEM` (others can be installed via extensions). Each takes one argument = percentage of the table to sample, 0–100, any real-valued expression. BERNOULLI scans the whole table and selects individual rows independently with that probability. SYSTEM does block-level sampling — each block has that chance; ALL rows of a chosen block are returned; much faster at small percentages but less random (clustering effects). REPEATABLE seed: any non-null floating-point value; same seed + same argument → same sample if the table is unchanged; without it a new random sample per query. Some add-on methods don't accept REPEATABLE.
- Sub-SELECT in FROM must be parenthesized; VALUES can be used. (Alias optional in the synopsis.)
- Function in FROM: composite result → one column per attribute. `WITH ORDINALITY` appends a bigint column numbering rows from 1, named `ordinality` by default.
- `ROWS FROM(f1(...), f2(...))`: concatenates the i-th row of each function side by side; shorter results padded with NULLs; total rows = max.
- Functions returning `record` need a column definition list `AS (name type, ...)`. With ROWS FROM put the definition list inside; ORDINALITY + column definition list requires ROWS FROM.
- join_type: `[INNER] JOIN`, `LEFT [OUTER] JOIN`, `RIGHT [OUTER] JOIN`, `FULL [OUTER] JOIN`; each needs exactly one of ON, USING, NATURAL. `CROSS JOIN` ≡ `INNER JOIN ON (TRUE)`.
- JOINs nest left-to-right absent parentheses and bind more tightly than commas in FROM.
- LEFT OUTER JOIN: all rows passing the join condition, plus one copy of each unmatched left row extended with NULLs. Only the JOIN's own ON condition decides "matched"; outer (WHERE) conditions are applied afterwards. RIGHT = mirrored. FULL = both sides' unmatched rows.
- `USING (a, b)` ≡ `ON left.a = right.a AND left.b = right.b` and outputs only ONE of each pair of columns. `AS join_using_alias` names only the join columns; does not hide the joined tables' names; no column alias list.
- NATURAL = USING over all same-named columns; if none, equivalent to ON TRUE.
- **LATERAL**: lets a sub-SELECT refer to columns of FROM items that appear before it. For function-call FROM items it is a noise word (functions can always refer to earlier items). Evaluation: for each row (or row set) of the items providing the cross-referenced columns, the LATERAL item is evaluated with those values and the results joined to that row. The column source must be INNER or LEFT joined to the LATERAL item — `X RIGHT JOIN LATERAL Y` is syntactically valid but Y may not reference X.

### SELECT — WHERE, GROUP BY, HAVING  [M3]
- WHERE: a row qualifies only if the condition returns true.
- `GROUP BY [ALL | DISTINCT] grouping_element, ...`: an expression can be an input column name, the name or ordinal number of an OUTPUT column, or an arbitrary expression of input columns. On ambiguity a GROUP BY name is interpreted as an INPUT column name.
- GROUPING SETS / ROLLUP / CUBE: the GROUP BY defines several independent grouping sets — equivalent to UNION ALL of subqueries each grouped by one set. `GROUP BY DISTINCT` removes duplicate grouping sets before processing (it does not turn the UNION ALL into UNION DISTINCT).
- Aggregates without GROUP BY → single group of all selected rows. `FILTER` clause on an aggregate limits its input rows.
- With GROUP BY/aggregates, the SELECT list may reference ungrouped columns only inside aggregates, or when functionally dependent on the grouped columns (i.e. the grouped columns, or a subset, are the PRIMARY KEY of the table containing the ungrouped column).
- All aggregates are evaluated BEFORE any "scalar" expressions in HAVING or the SELECT list → a CASE cannot be used to skip an aggregate's evaluation.
- HAVING filters groups after GROUP BY (WHERE filters rows before). HAVING without GROUP BY turns the query into a grouped query with a single group → emits one row if HAVING is true, zero rows otherwise.
- Locking clauses cannot be used with GROUP BY, HAVING, WINDOW, DISTINCT, UNION, INTERSECT, EXCEPT.

### SELECT — WINDOW clause and frames  [M3]
- `WINDOW window_name AS (window_definition), ...`; window_definition: `[existing_window_name] [PARTITION BY expr, ...] [ORDER BY expr [ASC|DESC|USING op] [NULLS {FIRST|LAST}], ...] [frame_clause]`.
- Inheriting from existing_window_name (must be earlier in the WINDOW list): copies PARTITION BY (cannot specify its own), copies ORDER BY if present (may specify its own only if the copied window has none); always uses its own frame clause; the copied window must NOT specify a frame clause.
- PARTITION BY / ORDER BY items are always simple expressions, never an output-column name or number; they may contain aggregate calls (windowing happens after grouping and aggregation).
- frame_clause: `{RANGE | ROWS | GROUPS} frame_start [frame_exclusion]` or `{RANGE | ROWS | GROUPS} BETWEEN frame_start AND frame_end [frame_exclusion]`. frame_start/end ∈ `UNBOUNDED PRECEDING`, `offset PRECEDING`, `CURRENT ROW`, `offset FOLLOWING`, `UNBOUNDED FOLLOWING`. frame_exclusion ∈ `EXCLUDE CURRENT ROW`, `EXCLUDE GROUP`, `EXCLUDE TIES`, `EXCLUDE NO OTHERS`.
- frame_end defaults to CURRENT ROW. Restrictions: frame_start ≠ UNBOUNDED FOLLOWING; frame_end ≠ UNBOUNDED PRECEDING; frame_end may not appear earlier in the list above than frame_start (e.g. `RANGE BETWEEN CURRENT ROW AND offset PRECEDING` is not allowed).
- **Default frame: `RANGE UNBOUNDED PRECEDING`** = `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` = partition start through the current row's LAST PEER (peer = row equal under the window's ORDER BY; with no ORDER BY all rows are peers → whole partition).
- CURRENT ROW: in ROWS mode = the current row itself; in RANGE or GROUPS mode = the current row's first (as start) or last (as end) peer.
- offset meaning: ROWS → integer number of rows before/after; GROUPS → integer number of peer groups before/after the current peer group; RANGE → requires exactly ONE ORDER BY column; frame = rows whose ordering value is within `offset` below (PRECEDING) / above (FOLLOWING) the current row's value; offset type depends on the ordering column (same type for numerics, `interval` for datetime columns). offset must be non-null, non-negative; may be non-constant but cannot contain variables, aggregates or window functions.
- EXCLUDE CURRENT ROW: drop the current row; EXCLUDE GROUP: drop current row and its peers; EXCLUDE TIES: drop the peers but keep the current row; EXCLUDE NO OTHERS: default.
- Pitfall: ROWS mode gives unpredictable results if ORDER BY is not unique; RANGE and GROUPS treat peers alike.
- A WINDOW entry need not be referenced (ignored); window functions can also define windows inline in OVER.

### SELECT — output list and DISTINCT  [M3]
- Output names: `AS name` (AS may be omitted only if the name is not any PostgreSQL keyword — recommended to always write AS or double-quote). Default name = column name for simple references; function/type name in some cases; else `?column?`.
- An output column's name can be used in ORDER BY and GROUP BY but NOT in WHERE or HAVING.
- `*` and `table.*` cannot be renamed with AS.
- Evaluation timing: the standard says output expressions are computed before DISTINCT, ORDER BY, LIMIT. PostgreSQL effectively evaluates output expressions AFTER sorting and limiting when they are not referenced in DISTINCT, ORDER BY or GROUP BY (so volatile/expensive functions aren't run for rows never output). Output expressions containing set-returning functions are evaluated after sorting and BEFORE limiting, so LIMIT cuts off SRF output. (Before 9.6 there were no guarantees.)
- `DISTINCT ON (expr, ...)`: keeps only the first row of each set where the expressions are equal; "first" is unpredictable without ORDER BY. The DISTINCT ON expressions must match the leftmost ORDER BY expressions. Example: `SELECT DISTINCT ON (location) location, time, report FROM weather_reports ORDER BY location, time DESC;` (latest report per location).

### SELECT — set operations  [M3]
- `select UNION [ALL | DISTINCT] select`: operands may not carry ORDER BY, LIMIT or locking clauses unless parenthesized (unparenthesized, those clauses apply to the whole UNION result). Same number of columns, compatible types. UNION ALL is usually significantly quicker (no duplicate elimination).
- INTERSECT ALL: a row with m duplicates on the left and n on the right appears min(m,n) times. EXCEPT ALL: max(m-n, 0) times.
- Precedence: INTERSECT binds more tightly than UNION (`A UNION B INTERSECT C` = `A UNION (B INTERSECT C)`); EXCEPT binds at the same level as UNION; same-level operators evaluate left to right.

### SELECT — ORDER BY, LIMIT / OFFSET / FETCH  [M3, M4]
- `ORDER BY expression [ASC | DESC | USING operator] [NULLS {FIRST | LAST}], ...`. Ties on all expressions → implementation-dependent order.
- Expression = output column name, output column ordinal number, or arbitrary expression of input columns (including columns not in the SELECT list: `SELECT name FROM distributors ORDER BY code;`). ORDER BY on a UNION/INTERSECT/EXCEPT result may use only output column names or numbers, not expressions.
- Ambiguity rule: a simple name matching both an output column and an input column is taken as the OUTPUT column in ORDER BY — the opposite of GROUP BY (input column). Names inside an expression are always input-column names.
- ASC default. `USING op`: op must be a less-than or greater-than member of some B-tree operator family; ASC ≈ `USING <`, DESC ≈ `USING >`.
- NULLs: default NULLS LAST for ASC, NULLS FIRST for DESC ("nulls are larger than non-nulls"). With USING, default depends on whether the operator is less-than or greater-than.
- Options apply only to the expression they follow: `ORDER BY x, y DESC` ≠ `ORDER BY x DESC, y DESC`.
- Strings sort by the column's collation; override with `ORDER BY mycolumn COLLATE "en_US"`.
- `LIMIT {count | ALL}` and `OFFSET start` are independent sub-clauses. OFFSET rows are skipped before counting LIMIT rows. `LIMIT NULL` = LIMIT ALL; `OFFSET NULL` = OFFSET 0.
- SQL:2008 form: `OFFSET start {ROW | ROWS}` and `FETCH {FIRST | NEXT} [count] {ROW | ROWS} {ONLY | WITH TIES}`. count defaults to 1. Non-literal expressions allowed (PG extension) but generally need parentheses. ROW/ROWS and FIRST/NEXT are noise words. PG allows OFFSET and FETCH in either order (standard: OFFSET first).
- `WITH TIES`: also returns additional rows tying for last place per ORDER BY; ORDER BY is MANDATORY; SKIP LOCKED is NOT allowed with it.
- Always pair LIMIT with an ORDER BY that gives a unique order; otherwise the subset is unpredictable. The planner takes LIMIT into account, so different LIMIT/OFFSET values can produce different plans and different row orders → paginating without ORDER BY gives inconsistent pages. Even repeated executions of the same LIMIT query may return different subsets. "This is not a bug."
- LIMIT/OFFSET are PG-specific (also MySQL); FETCH FIRST is standard (also DB2); Oracle's rownum is not available.

### SELECT — the locking clause (FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE, NOWAIT, SKIP LOCKED)  [M5]
- `FOR lock_strength [OF from_reference, ...] [NOWAIT | SKIP LOCKED]`, lock_strength ∈ UPDATE | NO KEY UPDATE | SHARE | KEY SHARE (row-level lock modes, Section 13.3.2). from_reference = a table alias or non-hidden table name in FROM.
- Default: wait for conflicting transactions. **NOWAIT**: error instead of waiting if a selected row cannot be locked immediately. **SKIP LOCKED**: rows that cannot be locked immediately are skipped — "provides an inconsistent view of the data, so this is not suitable for general purpose work, but can be used to avoid lock contention with multiple consumers accessing a queue-like table".
- NOWAIT / SKIP LOCKED apply only to the ROW-level locks: the required **ROW SHARE table-level lock** is still taken in the ordinary (waiting) way. To avoid waiting for the table lock, run `LOCK … NOWAIT` first.
- `OF tables`: only rows from those tables are locked; others just read. No OF list → all tables used in the statement. Applied to a view or sub-query → all tables used in it. Does NOT apply to WITH queries referenced by the primary query (put a locking clause inside the WITH query).
- Multiple locking clauses allowed. A table hit by several clauses is processed as the STRONGEST one; NOWAIT if any clause affecting it says NOWAIT; otherwise SKIP LOCKED if any says so.
- Not usable where returned rows can't be identified with individual table rows: aggregation, GROUP BY, HAVING, WINDOW, DISTINCT, UNION/INTERSECT/EXCEPT (result or inputs).
- Which rows get locked (top level): exactly the rows returned; for joins, the rows contributing to returned join rows. Additionally, rows that satisfied the conditions as of the query SNAPSHOT are locked even though they are not returned if updated after the snapshot and no longer matching. With LIMIT, locking stops once enough rows are returned — BUT rows skipped by OFFSET are locked. In a cursor, only rows actually fetched or stepped past are locked.
- In a sub-SELECT: locked rows are those returned to the outer query, possibly fewer than the subquery alone suggests because outer conditions are pushed down: `SELECT * FROM (SELECT * FROM mytable FOR UPDATE) ss WHERE col1 = 5;` locks only rows with col1 = 5.
- Savepoint interaction: before 9.3 a lock upgraded after a later savepoint was lost on ROLLBACK TO (`SELECT … FOR UPDATE; SAVEPOINT s; UPDATE …; ROLLBACK TO s;`) — fixed in 9.3.
- CAUTION (READ COMMITTED + ORDER BY + locking clause): rows can come back OUT OF ORDER — ORDER BY is applied first, then the command may block on a row lock; when it unblocks, ordering-column values may have changed (rows are in order of the ORIGINAL values). Workaround: `SELECT * FROM (SELECT * FROM mytable FOR UPDATE) ss ORDER BY column1;` — but this locks ALL rows of mytable (not just returned ones), a big cost with LIMIT. Under REPEATABLE READ / SERIALIZABLE this case raises a serialization failure (SQLSTATE '40001') instead.
- Standard only has FOR UPDATE as a DECLARE CURSOR option; everything else here is a PG extension.

### SELECT — TABLE command, examples, compatibility  [M3]
- `TABLE name` ≡ `SELECT * FROM name`; only WITH, UNION, INTERSECT, EXCEPT, ORDER BY, LIMIT, OFFSET, FETCH and FOR locking clauses may be used with it (no WHERE, no aggregation).
- CTE-evaluated-once demo: `WITH t AS (SELECT random() as x FROM generate_series(1, 3)) SELECT * FROM t UNION ALL SELECT * FROM t;` → two identical sets of three random values.
- Recursive example: `WITH RECURSIVE employee_recursive(distance, employee_name, manager_name) AS (SELECT 1, employee_name, manager_name FROM employee WHERE manager_name = 'Mary' UNION ALL SELECT er.distance + 1, e.employee_name, e.manager_name FROM employee_recursive er, employee e WHERE er.employee_name = e.manager_name) SELECT distance, employee_name FROM employee_recursive;` — the recursive part must eventually return no tuples or the query loops forever.
- LATERAL: `SELECT m.name AS mname, pname FROM manufacturers m, LATERAL get_product_names(m.id) pname;` (inner: manufacturers without products vanish) vs `… m LEFT JOIN LATERAL get_product_names(m.id) pname ON true;`.
- `SELECT * FROM unnest(ARRAY['a','b','c','d','e','f']) WITH ORDINALITY;` → columns `unnest`, `ordinality` 1..6. `SELECT * FROM distributors_2(111) AS (f1 int, f2 text);` for a `SETOF record` function.
- PG extensions / deviations: FROM may be omitted (`SELECT 2+2;` → `?column?` 4); empty SELECT list allowed (zero-column result; not with DISTINCT); AS required before an output name matching ANY keyword (standard: only reserved); sub-SELECT alias in FROM optional; parentheses around ONLY table optional, trailing `*` allowed; TABLESAMPLE only on regular tables and materialized views; `FROM func(...) alias` ≈ `FROM LATERAL (SELECT func(...)) alias` (LATERAL implicit); functional dependency recognised only via the table's PRIMARY KEY in GROUP BY; data-modifying WITH; DISTINCT ON; ROWS FROM; [NOT] MATERIALIZED.

### SELECT INTO  [M3]  (source: sql-selectinto.txt)
- `SELECT … INTO [TEMPORARY | TEMP | UNLOGGED] [TABLE] new_table FROM …`: creates a new table and fills it with the query result. No rows go back to the client. Column names and types come from the SELECT output columns.
- The SELECT INTO synopsis is narrower than full SELECT: `GROUP BY expression`, `FETCH … ONLY` (no WITH TIES), and only `FOR {UPDATE | SHARE} [OF table] [NOWAIT]`.
- Recommended alternative: CREATE TABLE AS. It does the same thing and more. SELECT INTO is not available in ECPG or PL/pgSQL, where INTO means "into variables". It also cannot specify `USING method` or `TABLESPACE`, so the new table always gets `default_table_access_method`.
- Example: `SELECT * INTO films_recent FROM films WHERE date_prod >= '2002-01-01';`. In the standard, SELECT INTO means selecting into host variables; using it to create a table is a historical PG usage.

### SET  [M7, M1]  (source: sql-set.txt)
- `SET [SESSION | LOCAL] configuration_parameter {TO | =} {value | 'value' | DEFAULT}` and `SET [SESSION | LOCAL] TIME ZONE {value | 'value' | LOCAL | DEFAULT}`. Affects only the current session.
- Some parameters need superuser or the SET privilege on that parameter (`GRANT SET ON PARAMETER`). Some cannot be changed after server or session start.
- Transactional behaviour:
  1. SET (= SET SESSION) inside a transaction that later aborts is undone by the rollback. After commit it persists until session end unless overridden.
  2. SET LOCAL lasts only until the end of the current transaction, committed or not. Outside a transaction block it gives a warning and has no effect.
  3. SET followed by SET LOCAL in one transaction: the LOCAL value is seen until transaction end; afterwards (if committed) the SET value takes effect.
  4. Rolling back to a savepoint earlier than the command cancels both SET and SET LOCAL.
  5. In a function that has a `SET` option for the same variable (CREATE FUNCTION … SET), SET LOCAL's effect disappears at function exit and the caller's value is restored. A plain SET overrides the function's SET option and persists unless rolled back.
  6. History: in 8.0-8.2, SET LOCAL was also cancelled by releasing an earlier savepoint or by successful exit from a PL/pgSQL exception block. That was changed because it was unintuitive.
- DEFAULT = whatever value the parameter would have had if no SET had been executed in this session.
- Special forms:
  - `SET SCHEMA 'value'` = `SET search_path TO value`; only one schema can be given this way.
  - `SET NAMES 'value'` = `SET client_encoding TO value`.
  - `SET SEED value`: seeds `random()`; allowed range -1 to 1 inclusive. Same effect as `SELECT setseed(value)`.
  - `SET TIME ZONE 'value'` = `SET timezone TO 'value'`. Accepts `'America/Los_Angeles'`, `'Europe/Rome'`, `-7` (7 h west of UTC; positive = east), `INTERVAL '-08:00' HOUR TO MINUTE`, and `LOCAL`/`DEFAULT` (the server's default timezone). Numeric and interval values become POSIX syntax: after `SET TIME ZONE -7`, `SHOW TIME ZONE` reports `<-07>+07`. Time-zone abbreviations are not supported.
- Equivalents: `set_config()`, or `UPDATE pg_settings`.
- Examples: `SET search_path TO my_schema, public;` and `SET datestyle TO postgres, dmy;`.

### SET CONSTRAINTS  [M5, M3]  (source: sql-set-constraints.txt)
- `SET CONSTRAINTS {ALL | name [, ...]} {DEFERRED | IMMEDIATE}`. IMMEDIATE constraints are checked at the end of each statement; DEFERRED ones are checked at transaction commit.
- Every constraint gets one of three characteristics at creation:
  - `DEFERRABLE INITIALLY DEFERRED` and `DEFERRABLE INITIALLY IMMEDIATE` start each transaction in that mode and can be switched with SET CONSTRAINTS.
  - `NOT DEFERRABLE` is always immediate and is unaffected.
- A named list must contain only deferrable constraints. Names may be schema-qualified; otherwise the first schema in search_path with a match is used. Constraint names are unique only per table, so all matches in that schema are affected and later schemas are not searched. `ALL` switches every deferrable constraint.
- Switching DEFERRED → IMMEDIATE applies retroactively: pending checks run during SET CONSTRAINTS itself. If any fails, the command fails and the mode is not changed. This is how to force checking at a chosen point in a transaction.
- Only UNIQUE, PRIMARY KEY, REFERENCES (foreign key) and EXCLUDE constraints are affected. NOT NULL and CHECK are always checked immediately, as each row is inserted or modified (not at end of statement). Non-deferrable unique and exclusion constraints are also checked immediately (per row); the standard suggests end of statement.
- Constraint triggers fire when their associated constraint would be checked, so they follow this setting.
- Outside a transaction block: warning, no effect.

### SET ROLE / SET SESSION AUTHORIZATION  [M1]  (source: sql-set-role.txt, sql-set-session-authorization.txt)
- Identities:
  - **session user**: initially the (possibly authenticated) user the client connected as.
  - **current user**: used for permission checks. Normally equals the session user, but changes temporarily inside SECURITY DEFINER functions and can be changed by SET ROLE.
- `SET [SESSION | LOCAL] ROLE role_name`, `SET ROLE NONE`, `RESET ROLE`:
  - Sets the current user. Permission checks then act as if that role had logged in. Exceptions: SET ROLE itself is checked against the session user, and SET SESSION AUTHORIZATION against the original authenticated user.
  - Requirement: the session user must hold the SET option on the role, directly or through a chain of memberships that all have SET. A superuser session user may choose any role.
  - `SET ROLE NONE`: current user becomes the session user (`session_user`).
  - `RESET ROLE`: current user returns to the connection-time setting (from command-line options, ALTER ROLE or ALTER DATABASE), otherwise to the session user. Any user can run NONE and RESET.
- How SET ROLE changes privileges:
  - With INHERIT TRUE memberships the session user already has all inherited privileges, so SET ROLE effectively narrows them to what the target role has directly or inherits.
  - With INHERIT FALSE but SET TRUE, SET ROLE is the only way to use that role's privileges, and doing so drops the session user's own privileges.
  - With INHERIT FALSE and SET FALSE, the role's privileges cannot be used at all.
- SET ROLE does not apply the role's ALTER ROLE session settings (those apply only at login). It cannot be used inside a SECURITY DEFINER function. It does not change which roles a later SET ROLE may choose.
- Example: after `SET ROLE 'paul'`, `session_user` = peter and `current_user` = paul.
- `SET [SESSION | LOCAL] SESSION AUTHORIZATION user_name | DEFAULT`, `RESET SESSION AUTHORIZATION`:
  - Sets BOTH the session user and the current user, for example to become unprivileged temporarily and later switch back to superuser.
  - Allowed only if the initially authenticated user is a superuser; otherwise only the authenticated user's own name is accepted.
  - DEFAULT and RESET return to the authenticated user and can be run by anyone.
  - Cannot be used inside a SECURITY DEFINER function. It also determines which roles later SET ROLE commands may choose.
  - Example: after `SET SESSION AUTHORIZATION 'paul'`, both `session_user` and `current_user` are paul.
- Both commands are allowed inside a transaction (the standard forbids this). Identifier syntax, the SESSION/LOCAL modifiers and RESET are PG extensions. `DISCARD ALL` runs `SET SESSION AUTHORIZATION DEFAULT`.

### SET TRANSACTION / START TRANSACTION  [M5]  (source: sql-set-transaction.txt, sql-start-transaction.txt)
- Forms:
  - `SET TRANSACTION transaction_mode [, ...]` affects the current transaction only.
  - `SET TRANSACTION SNAPSHOT snapshot_id` imports a snapshot into the current transaction.
  - `SET SESSION CHARACTERISTICS AS TRANSACTION transaction_mode [, ...]` sets the defaults for later transactions; SET TRANSACTION overrides it per transaction.
  - transaction_mode: `ISOLATION LEVEL {SERIALIZABLE | REPEATABLE READ | READ COMMITTED | READ UNCOMMITTED}`, `READ WRITE | READ ONLY`, `[NOT] DEFERRABLE`. Commas between modes are optional in PG (the standard requires them).
- Isolation levels, as documented:
  - **READ COMMITTED (default)**: a statement sees only rows committed before that statement began.
  - **REPEATABLE READ**: all statements see only rows committed before the FIRST query or data-modification statement of the transaction.
  - **SERIALIZABLE**: same snapshot rule as RR. In addition, if a pattern of reads and writes among concurrent serializable transactions could not have happened in any serial (one-at-a-time) order, one of them is rolled back with `serialization_failure`.
  - **READ UNCOMMITTED** is treated as READ COMMITTED.
  - The standard's default is SERIALIZABLE; PG's is normally READ COMMITTED.
- The isolation level cannot be changed after the first query or data-modification statement (SELECT, INSERT, DELETE, UPDATE, MERGE, FETCH, or COPY) has run.
- READ ONLY disallows:
  - INSERT, UPDATE, DELETE, MERGE and COPY FROM, unless the target is a temporary table.
  - All CREATE, ALTER and DROP commands.
  - COMMENT, GRANT, REVOKE, TRUNCATE.
  - EXPLAIN ANALYZE and EXECUTE when the statement they would run is on this list.
  - This is a high-level notion of read-only; it does not prevent all writes to disk.
  - Read/write is the default.
- DEFERRABLE has effect only with SERIALIZABLE + READ ONLY. In that combination the transaction may block when first acquiring its snapshot. Afterwards it runs without normal SERIALIZABLE overhead and cannot cause or suffer a serialization failure. Recommended for long-running reports and backups (PG extension).
- SET TRANSACTION SNAPSHOT, step by step:
  1. The exporting transaction runs `pg_export_snapshot()` and gets an identifier, e.g. `'00000003-0000001B-1'`.
  2. The importing transaction must be at the very start, before any SELECT/INSERT/DELETE/UPDATE/MERGE/FETCH/COPY.
  3. It must already be REPEATABLE READ or SERIALIZABLE. Under READ COMMITTED the snapshot would be discarded at once, because each command takes a new one.
  4. A SERIALIZABLE importer requires a SERIALIZABLE exporter.
  5. A non-read-only serializable transaction cannot import from a read-only transaction.
  6. Example: `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ; SET TRANSACTION SNAPSHOT '00000003-0000001B-1';`.
  - SNAPSHOT cannot be given in BEGIN; the other modes can.
- SET TRANSACTION without a prior BEGIN/START TRANSACTION gives a warning and has no effect.
- Related GUCs:
  - Session defaults: `default_transaction_isolation`, `default_transaction_read_only`, `default_transaction_deferrable`. SET SESSION CHARACTERISTICS is a verbose way to set these, so they can also be set in the config file, via ALTER DATABASE, etc.
  - Current transaction: `transaction_isolation`, `transaction_read_only`, `transaction_deferrable`. Same timing restrictions as SET TRANSACTION; cannot be set in the config file or from anywhere except live SQL.
- `START TRANSACTION [transaction_mode, ...]` is the same as BEGIN. The "autocommit" model: PG behaves as if it issues an implicit COMMIT after every command not inside START TRANSACTION/BEGIN. The standard's implicit-block model is different.

### SHOW  [M7]  (source: sql-show.txt)
- `SHOW name` / `SHOW ALL` (ALL includes descriptions; the doc's example lists 196 rows).
- Parameters come from SET, postgresql.conf, the PGOPTIONS env var (libpq) or postgres command-line flags.
- Show-only parameters:
  - `SERVER_VERSION`.
  - `SERVER_ENCODING`: fixed at database creation.
  - `IS_SUPERUSER`: true if the current role is a superuser.
- Equivalents: `current_setting()` and the `pg_settings` view. Examples: `SHOW DateStyle` → `ISO, MDY`; `SHOW geqo` → `on`.

### TRUNCATE  [M5, M2, M7]  (source: sql-truncate.txt)
- `TRUNCATE [TABLE] [ONLY] name [*] [, ...] [RESTART IDENTITY | CONTINUE IDENTITY] [CASCADE | RESTRICT]`.
- Same effect as an unqualified DELETE on each table, but faster: it does not scan the tables, and it reclaims disk space immediately with no VACUUM needed. Most useful on large tables.
- Requires the TRUNCATE privilege. Without ONLY, descendant tables are truncated too.
- RESTART IDENTITY restarts the sequences owned by the truncated tables' columns. CONTINUE IDENTITY (default) leaves them alone.
- **Locking: ACCESS EXCLUSIVE on each table**, blocking all concurrent operations. With RESTART IDENTITY the restarted sequences are also locked exclusively. If concurrent access is needed, use DELETE.
- Foreign keys:
  - A table referenced by FKs from other tables cannot be truncated unless all those tables are truncated in the same command (checking would require the scans TRUNCATE is meant to avoid).
  - RESTRICT is the default: refuse if any FK references come from unlisted tables.
  - CASCADE automatically adds every referencing table, recursively — "be very careful… you might lose data you did not intend to".
  - Truncating a partition leaves sibling partitions alone, but CASCADE reaches every referencing table and all of its partitions.
- Triggers: ON DELETE triggers are NOT fired; ON TRUNCATE triggers are. All BEFORE TRUNCATE triggers fire before any truncation. All AFTER TRUNCATE triggers fire after the last truncation and after sequences are reset. Tables are processed in order: those listed first, then those added by cascading.
- **Not MVCC-safe**: a concurrent transaction using a snapshot taken BEFORE the truncation will see the table as empty (Section 13.6).
- **Transaction-safe** for data: rolled back if the surrounding transaction does not commit.
- RESTART IDENTITY's implied ALTER SEQUENCE RESTART is also transactional. Caveat: if the restarted sequences are used before a rollback, the sequence effects are undone but `currval()` keeps the last value obtained in the failed transaction.
- Works on foreign tables if the FDW supports it (e.g. postgres_fdw).
- Examples: `TRUNCATE bigtable, fattable RESTART IDENTITY;` and `TRUNCATE othertable CASCADE;`. In SQL:2008 the CONTINUE/RESTART IDENTITY clauses have slightly different meanings.

### UPDATE  [M3, M5, M2]  (source: sql-update.txt)
- Syntax: `[WITH [RECURSIVE] with_query, ...] UPDATE [ONLY] table [*] [[AS] alias] SET { col = {expr | DEFAULT} | (col, ...) = [ROW] ({expr | DEFAULT}, ...) | (col, ...) = (sub-SELECT) } [, ...] [FROM from_item, ...] [WHERE condition | WHERE CURRENT OF cursor] [RETURNING [WITH ({OLD|NEW} AS alias, ...)] {* | expr [[AS] name]}, ...]`.
- Only the columns being changed need to appear in SET; the others keep their values. A target column may carry a subfield or array subscript, but NEVER the table name (`SET table_name.col = 1` is invalid).
- SET expressions see the OLD values of this and other columns. Example: in `SET temp_lo = temp_lo+1, temp_hi = temp_lo+15`, the second assignment uses the old temp_lo.
- DEFAULT: the column's default (NULL if none). An identity column gets a new sequence value; a generated column is simply recomputed.
- Row sub-SELECT: must return at most one row. One row → its values are assigned. Zero rows → the target columns are set to NULL. It may refer to the current row's old values.
- Privileges: UPDATE on the table, or on just the listed columns. SELECT on every column read in expressions or the condition.
- FROM (PG extension): the target is joined to the from_items, and each join output row is one update. A target row should join to at most one row. If it joins to several, only one is used and **which one is not readily predictable** (no error — unlike MERGE). Sub-selects are safer.
  - Example of the difference: `SET (a,b) = (SELECT … WHERE employees.id = accounts.sales_person)` raises an error on multiple matches and sets NULLs when there is no match. The FROM-join form silently picks one match and does not update unmatched rows.
  - Do not repeat the target table in FROM unless you want a self-join (alias required). Other databases that list the target again in FROM have a different meaning; take care when porting.
- WHERE CURRENT OF cursor: updates the row most recently fetched. The cursor must be a non-grouping query on the target table, and the form cannot be combined with a boolean condition.
- RETURNING: unqualified, `*` or table-qualified → NEW values. `old.col` gives pre-update values. Example: `RETURNING temp_lo, temp_hi, prcp, old.prcp AS old_prcp`.
- Command tag `UPDATE count`. It counts matched rows even if their values did not change. It can be lower than the number matched when BEFORE UPDATE triggers suppress rows. 0 is not an error.
- Partitioned tables: if an updated row no longer fits its partition, it is moved to the partition whose constraint it satisfies (implemented as DELETE + INSERT); error if none fits.
  - Concurrency: if session 1 moves a row by updating the partition key while session 2 (which can see the row) UPDATEs or DELETEs it, session 2 gets a serialization failure, SQLSTATE '40001'. Retry. Without row movement, session 2 would instead follow to the new row version.
  - Rows can move from local partitions into a foreign-table partition (if the FDW supports tuple routing), but not out of a foreign-table partition.
  - Moving fails if a foreign key directly references an ancestor of the source partition other than the ancestor named in the UPDATE.
- Large updates cause table bloat, replica lag and lock contention, so batch them, possibly with VACUUM between batches. There is no LIMIT; use a CTE + ctid self-join:
  `WITH exceeded_max_retries AS (SELECT w.ctid FROM work_item AS w WHERE w.status = 'active' AND w.num_retries > 10 ORDER BY w.retry_timestamp FOR UPDATE LIMIT 5000) UPDATE work_item SET status = 'failed' FROM exceeded_max_retries AS emr WHERE work_item.ctid = emr.ctid;`
  - Repeat until no rows remain. ctid is safe here only because the query is re-run, which avoids the problem of changed ctids.
  - ORDER BY sets the priority and prevents deadlocks with other updaters that use the same order.
  - Adding SKIP LOCKED to the CTE stops concurrent batches from colliding. A final UPDATE without SKIP LOCKED or LIMIT is then needed so no rows are missed.
- Savepoint-based upsert example: `SAVEPOINT sp1; INSERT …;` → on unique violation `ROLLBACK TO sp1; UPDATE wines SET stock = stock + 24 WHERE …;`.
- Standard deviation: a parenthesized column-list source must be a row constructor or a sub-SELECT. DEFAULT is allowed in the row-constructor case but not inside a sub-SELECT.

### VACUUM  [M7, M2]  (source: sql-vacuum.txt)
- `VACUUM [(option [, ...])] [table_and_columns [, ...]]`, where table_and_columns = `[ONLY] table_name [*] [(column_name, ...)]`.
- Legacy syntax (pre-9.0, still supported; options must be in exactly this order): `VACUUM [FULL] [FREEZE] [VERBOSE] [ANALYZE] [table_and_columns, ...]`.
- Why it is needed: deleted tuples and tuples made obsolete by UPDATE are not physically removed until VACUUM runs. Vacuum periodically, especially frequently-updated tables.
- With no list, VACUUM processes every table and materialized view in the current database that the user may vacuum. Without ONLY, inheritance children and partitions are included.
- Plain VACUUM:
  - Reclaims space for re-use within the same table; in most cases the space is NOT returned to the OS.
  - Takes no exclusive lock, so it runs alongside normal reads and writes.
  - Can process indexes on multiple CPUs ("parallel vacuum"); disable with `PARALLEL 0`.
- VACUUM FULL:
  - Rewrites the whole table into a new file with no extra space, returning space to the OS.
  - Much slower, takes **ACCESS EXCLUSIVE** on each table, and needs extra disk space for the new copy until it finishes.
  - Not for routine use; suited to tables where most rows were deleted or updated.
- Options (boolean values TRUE/ON/1 or FALSE/OFF/0; omitted = TRUE):

| Option | Default | Effect / caveats |
|---|---|---|
| FULL [bool] | off | Rewrite the table (see above). Requires PROCESS_TOAST. Makes FREEZE redundant. INDEX_CLEANUP and TRUNCATE are ignored with it; PARALLEL is not allowed with it. |
| FREEZE [bool] | off | Aggressive freezing: same as `vacuum_freeze_min_age = 0` and `vacuum_freeze_table_age = 0`. Always happens anyway when the table is rewritten. |
| VERBOSE [bool] | off | Detailed per-table activity report at INFO level. |
| ANALYZE [bool] | off | Also update planner statistics (VACUUM first, then ANALYZE per table). Required if a column list is given. |
| DISABLE_PAGE_SKIPPING [bool] | off | Normally VACUUM uses the visibility map to skip pages: all-frozen pages always, all-visible pages except in an aggressive vacuum, and (except in aggressive vacuum) pages that would require waiting for other sessions. This disables all skipping. Only for when the VM contents are suspect (corruption). |
| SKIP_LOCKED [bool] | off | Skip a relation that cannot be locked immediately. May still block opening its indexes. VACUUM ANALYZE may still block when sampling partitions, inheritance children and some foreign tables. A conflicting lock on a partitioned table skips ALL its partitions. |
| INDEX_CLEANUP {AUTO \| ON \| OFF} | AUTO | AUTO: skip index vacuuming when there are very few dead tuples. ON: always remove dead tuples from indexes when more than zero exist (pre-PG12-style behaviour). OFF: always skip index vacuuming, e.g. to finish fast ahead of imminent XID wraparound; the `vacuum_failsafe_age` failsafe is generally preferred. Regularly skipping causes index bloat and dead line pointers that cannot be removed until index cleanup runs. No effect on tables without indexes; ignored with FULL. The failsafe skips index vacuuming even when ON. |
| PROCESS_MAIN [bool] | true | Process the main relation. Set false to vacuum only the TOAST table. |
| PROCESS_TOAST [bool] | true | Process the TOAST table, if any. Required with FULL. |
| TRUNCATE [bool] | true (unless the `vacuum_truncate` GUC or the table's `vacuum_truncate` reloption is false) | Truncate empty pages at the END of the table and return them to the OS. This requires an ACCESS EXCLUSIVE lock; set false to avoid it. Ignored with FULL. |
| PARALLEL integer | planner-chosen | Run the index vacuum and index cleanup phases with background workers. Workers = number of indexes supporting parallel vacuum, capped by this value and then by `max_parallel_maintenance_workers`. An index qualifies only if it is larger than `min_parallel_index_scan_size`. One worker per index, so parallelism needs at least 2 indexes. Fewer (or zero) workers may be used. Workers start before each phase and exit at its end. Not allowed with FULL; does not affect ANALYZE. |
| SKIP_DATABASE_STATS [bool] | off | Skip the end-of-command update of database-wide oldest-unfrozen-XID statistics. That update can be slow with very many tables, only one can run at a time, and it achieves nothing unless the table holding the oldest XID was vacuumed. Use it in all but the last of a series of VACUUMs. |
| ONLY_DATABASE_STATS [bool] | off | Do nothing except update the database-wide oldest-unfrozen-XID statistics. The table list must be empty, and no other option except VERBOSE is allowed. |
| BUFFER_USAGE_LIMIT size | `vacuum_buffer_usage_limit` | Ring-buffer size for the Buffer Access Strategy. 0 disables the strategy. Range 128 kB to 16 GB. Also used for the ANALYZE stage. Not allowed with FULL unless ANALYZE is also given. Larger is faster but evicts more useful pages from shared_buffers. Units B/kB/MB/GB/TB; a bare number means kB. |

- Notes:
  - Privileges: normally MAINTAIN on the table. Database owners may vacuum all tables in their database except shared catalogs. Tables the user may not vacuum are skipped silently.
  - `search_path` is temporarily `pg_catalog, pg_temp`.
  - **Cannot run inside a transaction block.**
  - GIN indexes: any VACUUM also moves pending-list entries into the main GIN structure.
  - VACUUM causes a substantial increase in I/O. Use cost-based vacuum delay (Section 19.10.2); parallel workers each sleep in proportion to their own work.
  - Progress: `pg_stat_progress_vacuum`, or `pg_stat_progress_cluster` for VACUUM FULL.
  - Autovacuum automates routine vacuuming (Section 24.1).
- Example: `VACUUM (VERBOSE, ANALYZE) onek;`.

### VALUES  [M3]  (source: sql-values.txt)
- `VALUES (expression, ...) [, ...] [ORDER BY sort_expression [ASC | DESC | USING operator], ...] [LIMIT {count | ALL}] [OFFSET start [ROW | ROWS]] [FETCH {FIRST | NEXT} [count] {ROW | ROWS} ONLY]`.
- Computes a "constant table". All rows must have the same number of elements. Column types are resolved with the same rules as UNION (Section 10.5). Allowed anywhere SELECT is.
- Default column names are `column1`, `column2`, … (other databases may differ). ORDER BY may use those names or integer positions.
- `DEFAULT` is allowed only in a VALUES list at the top level of an INSERT.
- `VALUES (1, 'one'), (2, 'two'), (3, 'three');` ≡ `SELECT 1 AS column1, 'one' AS column2 UNION ALL SELECT 2, 'two' UNION ALL SELECT 3, 'three';`.
- In FROM, a table alias is optional and column aliases are good practice: `(VALUES('MGM','Horror'),('UA','Sci-Fi')) AS t (studio, kind)`. The same works in UPDATE … FROM (VALUES …) AS v(depno, target, increase).
- Typing: inside INSERT, values are coerced to the target column types. Elsewhere you may need a cast. If every entry is a quoted literal, casting the first is enough: `WHERE ip_address IN (VALUES('192.168.0.1'::inet), ('192.168.0.10'), ('192.168.1.43'))`. For simple IN tests, the list-of-scalars form is shorter and often more efficient.
- Very large VALUES lists risk out-of-memory failures and poor performance. INSERT … VALUES copes better because the column types are known from the target and need not be inferred by scanning the list.
- LIMIT and OFFSET are PG extensions.

## Complete inventories

### Every SQL command in this slice, with its official one-line purpose (92)

| idx | Command | Purpose (verbatim from the page) |
|---|---|---|
| 696 | CREATE TYPE | define a new data type |
| 697 | CREATE USER | define a new database role |
| 698 | CREATE USER MAPPING | define a new mapping of a user to a foreign server |
| 699 | CREATE VIEW | define a new view |
| 700 | DEALLOCATE | deallocate a prepared statement |
| 701 | DECLARE | define a cursor |
| 702 | DELETE | delete rows of a table |
| 703 | DISCARD | discard session state |
| 704 | DO | execute an anonymous code block |
| 705 | DROP ACCESS METHOD | remove an access method |
| 706 | DROP AGGREGATE | remove an aggregate function |
| 707 | DROP CAST | remove a cast |
| 708 | DROP COLLATION | remove a collation |
| 709 | DROP CONVERSION | remove a conversion |
| 710 | DROP DATABASE | remove a database |
| 711 | DROP DOMAIN | remove a domain |
| 712 | DROP EVENT TRIGGER | remove an event trigger |
| 713 | DROP EXTENSION | remove an extension |
| 714 | DROP FOREIGN DATA WRAPPER | remove a foreign-data wrapper |
| 715 | DROP FOREIGN TABLE | remove a foreign table |
| 716 | DROP FUNCTION | remove a function |
| 717 | DROP GROUP | remove a database role |
| 718 | DROP INDEX | remove an index |
| 719 | DROP LANGUAGE | remove a procedural language |
| 720 | DROP MATERIALIZED VIEW | remove a materialized view |
| 721 | DROP OPERATOR | remove an operator |
| 722 | DROP OPERATOR CLASS | remove an operator class |
| 723 | DROP OPERATOR FAMILY | remove an operator family |
| 724 | DROP OWNED | remove database objects owned by a database role |
| 725 | DROP POLICY | remove a row-level security policy from a table |
| 726 | DROP PROCEDURE | remove a procedure |
| 727 | DROP PUBLICATION | remove a publication |
| 728 | DROP ROLE | remove a database role |
| 729 | DROP ROUTINE | remove a routine |
| 730 | DROP RULE | remove a rewrite rule |
| 731 | DROP SCHEMA | remove a schema |
| 732 | DROP SEQUENCE | remove a sequence |
| 733 | DROP SERVER | remove a foreign server descriptor |
| 734 | DROP STATISTICS | remove extended statistics |
| 735 | DROP SUBSCRIPTION | remove a subscription |
| 736 | DROP TABLE | remove a table |
| 737 | DROP TABLESPACE | remove a tablespace |
| 738 | DROP TEXT SEARCH CONFIGURATION | remove a text search configuration |
| 739 | DROP TEXT SEARCH DICTIONARY | remove a text search dictionary |
| 740 | DROP TEXT SEARCH PARSER | remove a text search parser |
| 741 | DROP TEXT SEARCH TEMPLATE | remove a text search template |
| 742 | DROP TRANSFORM | remove a transform |
| 743 | DROP TRIGGER | remove a trigger |
| 744 | DROP TYPE | remove a data type |
| 745 | DROP USER | remove a database role |
| 746 | DROP USER MAPPING | remove a user mapping for a foreign server |
| 747 | DROP VIEW | remove a view |
| 748 | END | commit the current transaction |
| 749 | EXECUTE | execute a prepared statement |
| 750 | EXPLAIN | show the execution plan of a statement |
| 751 | FETCH | retrieve rows from a query using a cursor |
| 752 | GRANT | define access privileges |
| 753 | IMPORT FOREIGN SCHEMA | import table definitions from a foreign server |
| 754 | INSERT | create new rows in a table |
| 755 | LISTEN | listen for a notification |
| 756 | LOAD | load a shared library file |
| 757 | LOCK | lock a table |
| 758 | MERGE | conditionally insert, update, or delete rows of a table |
| 759 | MOVE | position a cursor |
| 760 | NOTIFY | generate a notification |
| 761 | PREPARE | prepare a statement for execution |
| 762 | PREPARE TRANSACTION | prepare the current transaction for two-phase commit |
| 763 | REASSIGN OWNED | change the ownership of database objects owned by a database role |
| 764 | REFRESH MATERIALIZED VIEW | replace the contents of a materialized view |
| 765 | REINDEX | rebuild indexes |
| 766 | RELEASE SAVEPOINT | release a previously defined savepoint |
| 767 | RESET | restore the value of a run-time parameter to the default value |
| 768 | REVOKE | remove access privileges |
| 769 | ROLLBACK | abort the current transaction |
| 770 | ROLLBACK PREPARED | cancel a transaction that was earlier prepared for two-phase commit |
| 771 | ROLLBACK TO SAVEPOINT | roll back to a savepoint |
| 772 | SAVEPOINT | define a new savepoint within the current transaction |
| 773 | SECURITY LABEL | define or change a security label applied to an object |
| 774 | SELECT, TABLE, WITH | retrieve rows from a table or view |
| 775 | SELECT INTO | define a new table from the results of a query |
| 776 | SET | change a run-time parameter |
| 777 | SET CONSTRAINTS | set constraint check timing for the current transaction |
| 778 | SET ROLE | set the current user identifier of the current session |
| 779 | SET SESSION AUTHORIZATION | set the session user identifier and the current user identifier of the current session |
| 780 | SET TRANSACTION | set the characteristics of the current transaction |
| 781 | SHOW | show the value of a run-time parameter |
| 782 | START TRANSACTION | start a transaction block |
| 783 | TRUNCATE | empty a table or set of tables |
| 784 | UNLISTEN | stop listening for a notification |
| 785 | UPDATE | update rows of a table |
| 786 | VACUUM | garbage-collect and optionally analyze a database |
| 787 | VALUES | compute a set of rows |

### Lock modes named on the LOCK page (8 table-level modes; weakest → strongest as listed)
ACCESS SHARE, ROW SHARE, ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. `LOCK` with no mode uses ACCESS EXCLUSIVE. (The full conflict matrix is in Section 13.3, outside this slice. The facts stated in this slice are: SHARE conflicts with ROW EXCLUSIVE; SHARE ROW EXCLUSIVE is self-conflicting; ROW EXCLUSIVE is shareable; a transaction never conflicts with itself.)

### Row-level lock strengths (SELECT locking clause)
FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, FOR KEY SHARE. Wait-policy modifiers: (default wait), NOWAIT, SKIP LOCKED. A locking SELECT also takes a ROW SHARE table lock, with a normal wait.

### Lock levels stated by commands in this slice
| Command | Lock documented in its page |
|---|---|
| DROP INDEX | ACCESS EXCLUSIVE on the parent table (CONCURRENTLY: waits for conflicting txns, does not block DML) |
| REINDEX (plain) | blocks writes but not reads on the table; ACCESS EXCLUSIVE on the index being rebuilt |
| REINDEX CONCURRENTLY | session-level SHARE UPDATE EXCLUSIVE on the indexes and table |
| REFRESH MATERIALIZED VIEW | blocks readers unless CONCURRENTLY; one refresh at a time per matview either way |
| TRUNCATE | ACCESS EXCLUSIVE on each table (+ exclusive on restarted sequences) |
| VACUUM (plain) | no exclusive lock; the TRUNCATE phase needs ACCESS EXCLUSIVE briefly |
| VACUUM FULL | ACCESS EXCLUSIVE on each table |
| LOCK | the requested mode, ACCESS EXCLUSIVE by default |
| SELECT … FOR … | ROW SHARE table lock + row locks |
| LOCK on a view | same mode recursively on all relations in the view query |

### Commands/forms that cannot run inside a transaction block (this slice)
DISCARD ALL; DROP DATABASE; DROP TABLESPACE; DROP INDEX CONCURRENTLY; DROP SUBSCRIPTION (with a slot); REINDEX SCHEMA / DATABASE / SYSTEM; REINDEX INDEX/TABLE on a partitioned index/table; REINDEX … CONCURRENTLY; VACUUM (any form); COMMIT PREPARED / ROLLBACK PREPARED.

### Commands that REQUIRE a transaction block (else error or no-op)
- Error outside a block: DECLARE without WITH HOLD; LOCK; PREPARE TRANSACTION; ROLLBACK AND CHAIN.
- Warning and no effect: SET LOCAL; SET CONSTRAINTS; SET TRANSACTION.
- Warning only: END/COMMIT and ROLLBACK outside a block.

### Commands that make a transaction un-PREPARE-able (2PC)
LISTEN, UNLISTEN, NOTIFY; any use of temporary tables or the temp namespace; creating WITH HOLD cursors.

### GRANT privilege matrix (object type → grantable privileges)
| Object | Privileges |
|---|---|
| TABLE / view / foreign table | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN |
| Column | SELECT, INSERT, UPDATE, REFERENCES |
| SEQUENCE | USAGE, SELECT, UPDATE |
| DATABASE | CREATE, CONNECT, TEMPORARY/TEMP |
| DOMAIN, FOREIGN DATA WRAPPER, FOREIGN SERVER, LANGUAGE, TYPE | USAGE |
| FUNCTION / PROCEDURE / ROUTINE | EXECUTE |
| LARGE OBJECT | SELECT, UPDATE |
| PARAMETER | SET, ALTER SYSTEM |
| SCHEMA | CREATE, USAGE |
| TABLESPACE | CREATE |
| Role membership options | ADMIN (default FALSE), INHERIT (default = member's INHERIT attribute), SET (default TRUE) |

### Privilege needed per command (from the pages in this slice)
LOCK: MAINTAIN/UPDATE/DELETE/TRUNCATE → any mode; INSERT → ROW EXCLUSIVE; SELECT → ACCESS SHARE. VACUUM, REINDEX (index/table), REFRESH MATERIALIZED VIEW: MAINTAIN. REINDEX SCHEMA/DATABASE: owner or `pg_maintain`. TRUNCATE: TRUNCATE. DELETE: DELETE + SELECT on what is read. UPDATE: UPDATE (on the listed columns) + SELECT on what is read. INSERT: INSERT (+ UPDATE for DO UPDATE, + SELECT for anything read). MERGE: per action, plus SELECT on at least one target column for DO NOTHING. Locking SELECT: SELECT + UPDATE. LOAD (non-superuser): only `$libdir/plugins/`. CREATE TYPE base type: superuser. DROP ACCESS METHOD / TEXT SEARCH PARSER / TEMPLATE: superuser.

### EXPLAIN options (12) — see the table in the EXPLAIN section
ANALYZE, VERBOSE, COSTS, SETTINGS, GENERIC_PLAN, BUFFERS, SERIALIZE {NONE|TEXT|BINARY}, WAL, TIMING, SUMMARY, MEMORY, FORMAT {TEXT|XML|JSON|YAML}.

### VACUUM options (14) — see the table in the VACUUM section
FULL, FREEZE, VERBOSE, ANALYZE, DISABLE_PAGE_SKIPPING, SKIP_LOCKED, INDEX_CLEANUP {AUTO|ON|OFF}, PROCESS_MAIN, PROCESS_TOAST, TRUNCATE, PARALLEL n, SKIP_DATABASE_STATS, ONLY_DATABASE_STATS, BUFFER_USAGE_LIMIT size.

### REINDEX options and targets
Targets: INDEX, TABLE, SCHEMA, DATABASE, SYSTEM. Options: CONCURRENTLY [bool], TABLESPACE name, VERBOSE [bool].

### Transaction modes (SET TRANSACTION / BEGIN / START TRANSACTION)
ISOLATION LEVEL {SERIALIZABLE | REPEATABLE READ | READ COMMITTED | READ UNCOMMITTED}; READ WRITE | READ ONLY; [NOT] DEFERRABLE; plus SET TRANSACTION SNAPSHOT 'id'.

### FETCH / MOVE directions (14)
NEXT, PRIOR, FIRST, LAST, ABSOLUTE n, RELATIVE n, n, ALL, FORWARD, FORWARD n, FORWARD ALL, BACKWARD, BACKWARD n, BACKWARD ALL.

### Window frame vocabulary
Modes RANGE / ROWS / GROUPS. Bounds UNBOUNDED PRECEDING, offset PRECEDING, CURRENT ROW, offset FOLLOWING, UNBOUNDED FOLLOWING. Exclusions EXCLUDE CURRENT ROW / GROUP / TIES / NO OTHERS. Default frame RANGE UNBOUNDED PRECEDING.

### CREATE TYPE base-type properties (with defaults)
INPUT (req), OUTPUT (req), RECEIVE, SEND, TYPMOD_IN, TYPMOD_OUT, ANALYZE, SUBSCRIPT, INTERNALLENGTH (default: variable), PASSEDBYVALUE, ALIGNMENT (char|int2|int4|double; default int4), STORAGE (plain|external|extended|main; default plain), LIKE, CATEGORY (default 'U'), PREFERRED (default false), DEFAULT (default null), ELEMENT, DELIMITER (default ','), COLLATABLE (default false).

### View options
check_option (local|cascaded), security_barrier (bool), security_invoker (bool).

### System views / functions / GUCs referenced in this slice
- Views: pg_cursors, pg_prepared_statements, pg_prepared_xacts, pg_settings, pg_stat_progress_create_index, pg_stat_progress_vacuum, pg_stat_progress_cluster, pg_index (indisready, indisvalid), pg_type (typarray), pg_statistic.
- Functions: pg_notify(text,text), pg_notification_queue_usage(), pg_export_snapshot(), pg_advisory_unlock_all(), setseed(), set_config(), current_setting(), merge_action(), pg_terminate_backend().
- GUCs: plan_cache_mode (auto | force_generic_plan | force_custom_plan), compute_query_id, track_io_timing, max_notify_queue_pages, max_prepared_transactions, default_transaction_isolation/read_only/deferrable, transaction_isolation/read_only/deferrable, vacuum_freeze_min_age, vacuum_freeze_table_age, vacuum_failsafe_age, vacuum_truncate, vacuum_buffer_usage_limit, max_parallel_maintenance_workers, min_parallel_index_scan_size, temp_tablespaces, dynamic_library_path, default_table_access_method, search_path, client_encoding, timezone.

## Lesson ideas

### Visualizers
- **EXPLAIN anatomy** (M4): parse a real `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` tree. Show startup vs total cost as a bar, estimated vs actual rows (v18 prints fractional `rows=99.00`), loops, and Buffers hit/read/dirtied/written rolled up from the children. Toggle each of the 12 options to see which fields appear. Mark which options require ANALYZE and that GENERIC_PLAN cannot be combined with it.
- **Plan cache state machine** (M4): executions 1-5 build custom plans and an average cost; at execution 6 a generic plan is created and its cost compared. Add switches for plan_cache_mode and invalidation events (DDL, new statistics, search_path change).
- **ON CONFLICT decision flow** (M3/M5): proposed row → BEFORE INSERT triggers → arbiter inference (exact column-set match, optional predicate) → conflict? → DO NOTHING / DO UPDATE with `excluded` → WHERE checked last (row locked even if not updated) → cardinality-violation path when two proposed rows hit one key.
- **MERGE executor** (M3): animate the 3-step trigger order. Candidate rows get labelled MATCHED / NOT MATCHED BY SOURCE / BY TARGET (FULL join when both kinds are present). Walk the WHEN clauses in order, flag unreachable clauses, and show the cardinality violation when one target row matches two source rows (compare UPDATE…FROM, which silently picks one).
- **REINDEX CONCURRENTLY timeline** (M4/M7): six transactions; indisready/indisvalid flags for old and new indexes over time; the `_ccnew` / `_ccold` failure states and the right recovery for each.
- **Locking-clause semantics** (M5): two simulated sessions on a queue table. Compare default wait, NOWAIT (error) and SKIP LOCKED (skip). Show that OFFSET-skipped rows are still locked, that the ROW SHARE table lock is still waited for, and the READ COMMITTED out-of-order ORDER BY case.
- **Window frame explorer** (M3): drag the frame start/end across a partition for ROWS vs RANGE vs GROUPS with tied ORDER BY values. Show the default frame (to the last peer) and the four EXCLUDE options.
- **LISTEN/NOTIFY delivery** (M6): timeline of two transactions showing delivery only after commit and only between the listener's transactions, dedup of identical payloads, and commit-order delivery.
- **Savepoint stack** (M5): push/pop savepoints; RELEASE merges into the parent; ROLLBACK TO keeps the savepoint; duplicate names shadow older ones; cursor position survives ROLLBACK TO.
- **TRUNCATE vs DELETE** (M2/M7): DELETE marks tuples dead (xmax) and needs VACUUM; TRUNCATE swaps in a new empty file, takes ACCESS EXCLUSIVE and is not MVCC-safe for older snapshots.
- **VACUUM option panel** (M7): checkboxes for the 14 options showing which phases run (heap scan with VM skipping, index vacuum, end-of-table truncate, TOAST, DB stats), with the stated incompatibilities enforced (FULL vs PARALLEL, ONLY_DATABASE_STATS with an empty list, etc.).
- **Updatable-view checker** (M6): paste a view definition and test the 4 auto-updatable conditions and per-column updatability; demo LOCAL vs CASCADED CHECK OPTION.

### Playground SQL (PGlite, PG 18, single session)
```sql
-- EXPLAIN options (BUFFERS is automatic with ANALYZE in 18)
CREATE TABLE foo AS SELECT g AS i FROM generate_series(1,10000) g;
CREATE INDEX fi ON foo(i); ANALYZE foo;
EXPLAIN SELECT * FROM foo WHERE i = 4;
EXPLAIN (ANALYZE, WAL, SETTINGS, MEMORY, SERIALIZE TEXT, FORMAT JSON) SELECT * FROM foo WHERE i < 100;
EXPLAIN (GENERIC_PLAN) SELECT * FROM foo WHERE i > $1 AND i < $2;
BEGIN; EXPLAIN ANALYZE DELETE FROM foo WHERE i < 10; ROLLBACK;   -- safe EXPLAIN ANALYZE of DML

-- Prepared statement: custom vs generic plans
PREPARE q(int) AS SELECT count(*) FROM foo WHERE i < $1;
EXECUTE q(10); EXECUTE q(10); EXECUTE q(10); EXECUTE q(10); EXECUTE q(10);
EXPLAIN EXECUTE q(10);                       -- after 5 runs, a generic plan may appear ($1 visible)
SET plan_cache_mode = force_custom_plan; EXPLAIN EXECUTE q(10);
SELECT name, statement, generic_plans, custom_plans FROM pg_prepared_statements;
DEALLOCATE q;

-- Upsert with excluded, WHERE, and v18 RETURNING old/new
CREATE TABLE distributors(did int PRIMARY KEY, dname text, zipcode text);
INSERT INTO distributors VALUES (5,'old', '21201');
INSERT INTO distributors AS d (did, dname) VALUES (5,'Gizmo'),(6,'Assoc')
  ON CONFLICT (did) DO UPDATE SET dname = EXCLUDED.dname || ' (formerly ' || d.dname || ')'
  RETURNING old.dname AS old_dname, new.dname AS new_dname;
INSERT INTO distributors VALUES (7,'a'),(7,'b') ON CONFLICT (did) DO UPDATE SET dname = EXCLUDED.dname; -- cardinality violation

-- MERGE with merge_action() and NOT MATCHED BY SOURCE
CREATE TABLE wines(winename text PRIMARY KEY, stock int);
INSERT INTO wines VALUES ('A',5),('B',3),('C',1);
MERGE INTO wines w USING (VALUES ('A',7),('D',2)) s(winename, stock) ON s.winename = w.winename
WHEN NOT MATCHED BY TARGET THEN INSERT VALUES (s.winename, s.stock)
WHEN MATCHED AND w.stock != s.stock THEN UPDATE SET stock = s.stock
WHEN NOT MATCHED BY SOURCE THEN DELETE
RETURNING merge_action(), w.winename, old.stock, new.stock;

-- Window frames: ROWS vs RANGE vs GROUPS with ties
SELECT x, sum(x) OVER (ORDER BY x ROWS   BETWEEN 1 PRECEDING AND CURRENT ROW) r,
          sum(x) OVER (ORDER BY x RANGE  BETWEEN 1 PRECEDING AND CURRENT ROW) rg,
          sum(x) OVER (ORDER BY x GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW EXCLUDE TIES) g,
          sum(x) OVER (ORDER BY x) dflt
FROM (VALUES (1),(2),(2),(3),(5)) v(x);

-- CTE materialization and evaluated-once demo
WITH t AS (SELECT random() AS x FROM generate_series(1,3)) SELECT * FROM t UNION ALL SELECT * FROM t;
EXPLAIN WITH c AS MATERIALIZED (SELECT * FROM foo) SELECT * FROM c WHERE i = 4;   -- CTE Scan, no index
EXPLAIN WITH c AS (SELECT * FROM foo) SELECT * FROM c WHERE i = 4;                -- inlined → index scan
WITH RECURSIVE t(n) AS (VALUES (1) UNION ALL SELECT n+1 FROM t WHERE n < 5)
  SEARCH DEPTH FIRST BY n SET ord SELECT * FROM t ORDER BY ord;

-- TABLESAMPLE
SELECT count(*) FROM foo TABLESAMPLE BERNOULLI (10) REPEATABLE (42);
SELECT count(*) FROM foo TABLESAMPLE SYSTEM (10) REPEATABLE (42);

-- Locking clause (single session: show the plan node and the rules)
EXPLAIN SELECT * FROM foo WHERE i < 10 ORDER BY i FOR UPDATE SKIP LOCKED LIMIT 3;  -- LockRows node
SELECT * FROM foo FETCH FIRST 1 ROW WITH TIES;          -- error: WITH TIES needs ORDER BY

-- Cursors and savepoints
BEGIN;
DECLARE c SCROLL CURSOR FOR SELECT i FROM foo ORDER BY i;
FETCH 3 FROM c; FETCH PRIOR FROM c; MOVE ABSOLUTE 0 IN c; FETCH NEXT FROM c;
SAVEPOINT s; FETCH 1 FROM c; ROLLBACK TO SAVEPOINT s; FETCH 1 FROM c;  -- position not rolled back
SELECT name, is_scrollable, is_holdable FROM pg_cursors;
COMMIT;

-- SET LOCAL vs SET, SET CONSTRAINTS
BEGIN; SET LOCAL work_mem = '64MB'; SHOW work_mem; COMMIT; SHOW work_mem;
CREATE TABLE p(id int PRIMARY KEY); CREATE TABLE c2(pid int REFERENCES p DEFERRABLE INITIALLY IMMEDIATE);
BEGIN; SET CONSTRAINTS ALL DEFERRED; INSERT INTO c2 VALUES (1); INSERT INTO p VALUES (1); COMMIT;  -- ok
BEGIN; SET CONSTRAINTS ALL DEFERRED; INSERT INTO c2 VALUES (2); SET CONSTRAINTS ALL IMMEDIATE; -- fails here
ROLLBACK;

-- Transaction modes
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT pg_export_snapshot(); CREATE TABLE x(a int); ROLLBACK; -- READ ONLY error

-- VACUUM + visibility (pg_visibility, pageinspect available)
CREATE TABLE v(a int) WITH (autovacuum_enabled = off);
INSERT INTO v SELECT generate_series(1,1000); DELETE FROM v WHERE a % 2 = 0;
SELECT n_dead_tup FROM pg_stat_user_tables WHERE relname = 'v';
VACUUM (VERBOSE, INDEX_CLEANUP OFF, TRUNCATE OFF) v;
SELECT * FROM pg_visibility_map_summary('v');
VACUUM (FREEZE, VERBOSE) v;  SELECT * FROM pg_visibility_map_summary('v');  -- all_frozen
SELECT pg_relation_filepath('v'); TRUNCATE v; SELECT pg_relation_filepath('v');   -- new relfilenode
VACUUM (ONLY_DATABASE_STATS);

-- REINDEX, REFRESH MV
REINDEX (VERBOSE) TABLE foo;
CREATE MATERIALIZED VIEW mv AS SELECT i % 10 AS k, count(*) FROM foo GROUP BY 1;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv;            -- error: needs a unique index
CREATE UNIQUE INDEX ON mv(k); REFRESH MATERIALIZED VIEW CONCURRENTLY mv;
REFRESH MATERIALIZED VIEW mv WITH NO DATA; SELECT * FROM mv;  -- error: not populated

-- Updatable views and CHECK OPTION
CREATE TABLE films(id int, kind text, classification text);
CREATE VIEW comedies AS SELECT * FROM films WHERE kind = 'Comedy';
CREATE VIEW pg_comedies AS SELECT * FROM comedies WHERE classification = 'PG' WITH CASCADED CHECK OPTION;
INSERT INTO pg_comedies VALUES (1,'Drama','PG');       -- rejected by cascaded check
SELECT table_name, is_updatable, is_insertable_into FROM information_schema.views WHERE table_schema='public';

-- LISTEN / NOTIFY / DISCARD
LISTEN virtual; NOTIFY virtual, 'payload'; SELECT pg_notify('virtual','x'); SELECT pg_notification_queue_usage();
DISCARD ALL;

-- LOCK must be in a block
LOCK TABLE foo IN SHARE MODE;                          -- error outside transaction block
BEGIN; LOCK TABLE foo IN SHARE ROW EXCLUSIVE MODE NOWAIT;
SELECT mode, granted FROM pg_locks WHERE relation = 'foo'::regclass; COMMIT;

-- CREATE TYPE forms
CREATE TYPE bug_status AS ENUM ('new','open','closed');
CREATE TYPE float8_range AS RANGE (subtype = float8, subtype_diff = float8mi);
SELECT typname, typarray::regtype FROM pg_type WHERE typname IN ('bug_status','float8_range','float8_multirange');
```
(PREPARE TRANSACTION will fail if `max_prepared_transactions = 0`, which is the default; use it to demo the error and the reason for that default.)

### Pitfalls the docs warn about (each with the documented fix)
1. EXPLAIN ANALYZE really executes DML → wrap it in `BEGIN; … ROLLBACK;`.
2. EXPLAIN ANALYZE timing overhead distorts fast nodes → `TIMING OFF` when only row counts are needed.
3. LIMIT/OFFSET without a unique ORDER BY → unpredictable, inconsistent pages → always use a unique ORDER BY.
4. READ COMMITTED + ORDER BY + FOR UPDATE can return rows out of order → lock in a sub-query (`SELECT * FROM (SELECT … FOR UPDATE) ss ORDER BY …`), accepting that this locks all rows.
5. SKIP LOCKED gives an inconsistent view → use it only for queue-like consumers; finish with a final pass without SKIP LOCKED/LIMIT when batching.
6. UPDATE … FROM with a non-unique join silently picks an arbitrary row → use a sub-select, or MERGE (which raises a cardinality violation).
7. MERGE join_condition that references only target columns changes action selection surprisingly → put target-only filters in WHEN … AND conditions.
8. INSERT ON CONFLICT may raise unique violations while CREATE/REINDEX CONCURRENTLY runs on that unique index → expect and retry. Prefer inference over `ON CONSTRAINT`.
9. ON CONFLICT DO UPDATE WHERE still LOCKS rows that are not updated → be aware of contention.
10. Partition-key UPDATE racing with a concurrent UPDATE/DELETE → serialization failure 40001 → retry the transaction.
11. Long-lived prepared transactions block VACUUM, hold locks and risk wraparound shutdown → keep `max_prepared_transactions = 0` without an external transaction manager.
12. A session sitting in LISTEN + a long transaction blocks notify-queue cleanup; a full queue makes NOTIFY fail at commit → end that transaction; monitor `pg_notification_queue_usage()`.
13. LISTEN setup race → commit the LISTEN first, then read state in a new transaction.
14. Lock upgrade deadlock (two transactions holding SHARE, both wanting ROW EXCLUSIVE) → use SHARE ROW EXCLUSIVE; acquire locks in a consistent order, most restrictive first.
15. In RR/SERIALIZABLE, LOCK after the first query does not give fresh data → LOCK before any SELECT/DML.
16. REINDEX CONCURRENTLY failure leaves an INVALID index that still costs writes → drop `_ccnew` and retry; drop `_ccold`.
17. Plain REINDEX blocks virtually all reads too (the planner takes ACCESS SHARE on every index) → use CONCURRENTLY in production.
18. System-catalog index corruption → start with `-P` (single-user, or `PGOPTIONS="-P"`), then REINDEX SYSTEM.
19. INDEX_CLEANUP OFF repeated → index bloat and unremovable dead line pointers → rely on the `vacuum_failsafe_age` failsafe instead.
20. VACUUM's end-of-table TRUNCATE takes ACCESS EXCLUSIVE → `TRUNCATE false` / the `vacuum_truncate` reloption if that hurts.
21. VACUUM FULL needs extra disk space plus ACCESS EXCLUSIVE → not for routine use; plain VACUUM + autovacuum.
22. TRUNCATE is not MVCC-safe (old snapshots see an empty table) and CASCADE can wipe unintended tables → use DELETE when concurrency matters; avoid blind CASCADE.
23. TRUNCATE … RESTART IDENTITY rollback does not restore `currval()`.
24. Scrollable cursors with volatile functions may re-execute them → NO SCROLL, or SCROLL WITH HOLD and commit before reading.
25. WHERE CURRENT OF without FOR UPDATE silently does nothing if the row changed → declare the cursor FOR UPDATE.
26. Prepared statements don't notice a new same-named table earlier in search_path → schema-qualify names.
27. `CREATE VIEW … AS SELECT 'Hello World'` → column `?column?` of type text → cast and alias. `SELECT *` views don't pick up later columns.
28. security_barrier views may lock rows that user filters later reject → check with EXPLAIN.
29. Granting on a table does not grant on its sequences; revoking a column privilege doesn't undo a table grant.
30. A role that should be inheritable but not SET ROLE-able must own no objects (Trojan-horse risk).
31. DROP SUBSCRIPTION fails if the publisher is unreachable → DISABLE, `SET (slot_name = NONE)`, drop, then drop the remote slots manually (they retain WAL).
32. Very large VALUES lists → OOM and poor performance → prefer INSERT … VALUES or a list-of-scalars IN.
33. Relying on the `_typename` array naming → use `pg_type.typarray`.
34. Large single UPDATE/DELETE → bloat and replica lag → batch with the CTE + ctid + FOR UPDATE [SKIP LOCKED] + LIMIT pattern and VACUUM between batches.
