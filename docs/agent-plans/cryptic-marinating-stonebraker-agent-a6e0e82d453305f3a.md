# Plan: finish slice I (Part VI Reference, SQL Commands first half, idx 603-695)

## Context
Research task per `/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`: read every page of the slice
and distil it into `/Users/vivek-14286/postgres-internals/curriculum/research/I-sql-commands-1.md`.
Plan mode became active mid-run, so writing stopped. This file records the exact state and the remaining steps.

## State when writing stopped
- Pages read in full: idx 603-677 (75 of 93), ABORT through CREATE POLICY.
- Output file has "Notes by topic" written for idx 603-671 (through CREATE INDEX). It has no ledger, inventories or
  lesson-ideas sections yet, and carries a placeholder line under the title that must be removed at assembly.
- Ledger rows for idx 603-671 are in the scratch file
  `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/I_ledger.md`.
- Read but NOT yet written: idx 672-677 (draft notes below, to append verbatim).
- Not yet read: idx 678-695 (CREATE PROCEDURE, PUBLICATION, ROLE, RULE, SCHEMA, SEQUENCE, SERVER, STATISTICS,
  SUBSCRIPTION, TABLE (917 lines), TABLE AS, TABLESPACE, 4x TEXT SEARCH, TRANSFORM, TRIGGER).
- Out of slice (named in the task emphasis but beyond idx 695): CREATE VIEW, CREATE TYPE, DELETE. To be flagged in the
  final report, not researched here.

## Remaining steps
1. Append the draft notes below for idx 672-677 to the output file, and their six ledger rows to the scratch ledger.
2. Read idx 678-686 in full; append notes + ledger rows. Full detail for PROCEDURE, PUBLICATION, RULE, SEQUENCE,
   STATISTICS, SUBSCRIPTION; ROLE in full; SCHEMA/SERVER compact.
3. Read `sql-createtable.txt` in full (page with offset/limit if needed); append full-detail notes: every storage
   parameter with default, partitioning (RANGE/LIST/HASH, bounds, default partition), LIKE options, UNLOGGED, TEMP and
   ON COMMIT, constraints, generated/identity columns, INHERITS, Notes-section caveats.
4. Read idx 688-695; append notes + ledger rows. Full detail for CREATE TRIGGER and CREATE TABLE AS.
5. Append "## Complete inventories": all 183 SQL commands with one-line purpose (from sql-commands.txt), ALTER TABLE
   lock-level table, index storage parameters, table storage parameters, COPY options, commands that cannot run in a
   transaction block, commands with documented lock levels, superuser-only commands.
6. Append "## Lesson ideas": visualizers (CIC phases, ALTER TABLE lock/rewrite matrix, COPY binary layout, DETACH
   CONCURRENTLY, RLS policy combination), PGlite playground SQL, documented pitfalls with fixes.
7. Assemble final file order: title, Coverage ledger (from scratch file), Notes, Inventories, Lesson ideas; remove the
   placeholder line. Verify 93 ledger rows and line count in the 600-1500 target.
8. Hand back: output path, pages read, five most lesson-worthy findings.

## Draft notes for idx 672-677 (append verbatim in step 1)

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

## Ledger rows for idx 672-677 (append to the scratch ledger in step 1)
| 672 | sql-createlanguage.txt | Register a procedural language: HANDLER/INLINE/VALIDATOR, TRUSTED, per-database |
| 673 | sql-creatematerializedview.txt | Matview from a query, WITH [NO] DATA, unscannable until refreshed, security-restricted query |
| 674 | sql-createoperator.txt | Operator naming rules, COMMUTATOR/NEGATOR pairing, RESTRICT/JOIN, HASHES/MERGES |
| 675 | sql-createopclass.txt | Operator class: strategies, support functions, STORAGE, DEFAULT, FAMILY; superuser |
| 676 | sql-createopfamily.txt | Empty operator family for an index method; superuser |
| 677 | sql-createpolicy.txt | RLS policy syntax, per-command rules, Table 301, permissive/restrictive combination, leaks |

## Verification
- `grep -c '^| 6' <ledger>` gives 93 rows, idx 603-695 with no gaps.
- `wc -l` on the output file lands in the 600-1500 range.
- Spot-check three facts against source pages: ALTER TABLE lock table, CIC phase list, COPY binary header sizes.
