# Plan: finish slice J (SQL Commands, second half, idx 696-787)

## Context
Slice J of the PostgreSQL 18.7 docs distillation (per `/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`).
Plan mode was switched on mid-task, so work is paused part-way. Nothing below has been run since then.

## State at the pause

Output file (partially written, valid markdown so far):
`/Users/vivek-14286/postgres-internals/curriculum/research/J-sql-commands-2.md`

- Pages read in full: idx 696-782 (87 of 92).
- Notes already written to the output file: idx 696-774 (CREATE TYPE through SELECT, including every SELECT clause and the locking clause).
- Read but notes NOT yet written: idx 775-782 (SELECT INTO, SET, SET CONSTRAINTS, SET ROLE, SET SESSION AUTHORIZATION, SET TRANSACTION, SHOW, START TRANSACTION).
- Not yet read: idx 783-787 (TRUNCATE, UNLISTEN, UPDATE, VACUUM, VALUES).
- Coverage ledger rows for idx 696-773 are staged in a scratch file, not yet in the output file:
  `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/J/ledger.md`
- The output file currently has only `## Notes by topic`. It still lacks `## Coverage ledger`, `## Complete inventories`, and `## Lesson ideas`.

## Remaining steps

1. Append notes for idx 775-782 to the output file (already read):
   - SELECT INTO (differences from CREATE TABLE AS)
   - SET (SESSION vs LOCAL, rollback/savepoint behaviour, function SET option interaction, SCHEMA / NAMES / SEED / TIME ZONE special forms)
   - SET CONSTRAINTS (DEFERRED/IMMEDIATE, retroactive check, which constraint kinds are affected)
   - SET ROLE and SET SESSION AUTHORIZATION (session user vs current user, INHERIT/SET option effects)
   - SET TRANSACTION (isolation levels, READ ONLY disallowed commands, DEFERRABLE, SNAPSHOT import rules, related GUCs)
   - SHOW, START TRANSACTION
2. Read idx 783-787 in full from the pgdocs scratch directory: `sql-truncate.txt`, `sql-unlisten.txt`, `sql-update.txt`, `sql-vacuum.txt`, `sql-values.txt`.
3. Append full-detail notes for TRUNCATE, UPDATE, VACUUM (every option) and VALUES; fold UNLISTEN into the existing LISTEN/NOTIFY section if it adds anything.
4. Add ledger rows for idx 774-787 to the staged ledger.
5. Append `## Complete inventories`:
   - every command in range (92) with a one-line purpose
   - EXPLAIN options table (already in notes; reference it)
   - VACUUM options
   - LOCK modes list
   - row-lock strengths
   - which commands cannot run in a transaction block
   - privileges per object type from GRANT
6. Append `## Lesson ideas`: visualizer ideas, PGlite playground SQL, documented pitfalls with fixes.
7. Assemble the final file in the brief's order: title, `## Coverage ledger` (from the staged ledger), `## Notes by topic`, `## Complete inventories`, `## Lesson ideas`. Remove the temporary "ledger is at the END" line under the title.
8. Verify: 92 ledger rows covering idx 696-787 with no gaps; line count roughly within the 600-1500 target; spot-check a few facts against the source text.
9. Report back: output path, pages read, five most lesson-worthy findings.

## Notes
- Two small accuracy fixes were already applied to the SELECT WITH-clause notes (removed wording that came from outside the page).
- The `rtk` shell hook rewrites `grep`/`cat` output, so source pages are read with the Read tool or `awk`.
