# Plan: finish research slice E (maintenance / WAL / replication / monitoring / storage)

## Context
Slice E of the PostgreSQL 18 docs distillation (69 pages: idx 248-300, 983-985, 993-1005) per
`/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`.
Plan mode was switched on midway, so writing stopped. This plan records the exact state and the remaining steps.

## State when writing stopped

Output file: `/Users/vivek-14286/postgres-internals/curriculum/research/E-maintenance-wal-replication-monitoring-storage.md`
- Has the header, a `<!--LEDGER-->` placeholder under "## Coverage ledger" (ledger rows not written yet), and
  "## Notes by topic" filled in for idx 248-274: ch.24 (vacuum, freezing, XID and multixact wraparound,
  autovacuum formulae, reindex, logs), ch.25 (dump, file-system backup, archiving, base and incremental backup,
  low-level API, PITR procedure, timelines), ch.26 (solution matrix, standby, streaming, slots, cascading,
  synchronous replication, failover, hot standby and conflicts), ch.27 (ps titles, stats system mechanics,
  locks, progress views and phases, DTrace probes, disk usage), ch.28 (reliability, checksums, WAL concept,
  async commit, checkpoints, WAL configuration, WAL internals).
- Missing sections: "## Complete inventories" and "## Lesson ideas".

Scratch inventory file (not yet merged into the output file):
`/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/E/inv.md`
- Every wait event type and wait event (Tables 27.4-27.13).
- Every pg_stat_* / pg_statio_* view with every column, plus the statistics functions (Tables 27.1-27.37).

Read but no notes written yet (must be re-read): idx 275-278
(logical-replication.txt, -publication.txt, -subscription.txt, -failover.txt).

Not read yet (38 pages): idx 279-300 (row filters, column lists, generated columns, conflicts, restrictions,
architecture, monitoring, security, config, upgrade, quick setup; JIT ch.30; regression tests ch.31),
idx 983-985 (ch.64 generic WAL, custom rmgr), idx 993-1000 (ch.66 storage), idx 1001-1005 (ch.67 transactions).

## Remaining steps
1. Re-read idx 275-278 and read idx 279-289; append logical replication notes (publications, replica identity,
   subscriptions and slot management, failover, row filter rules and UPDATE transformations, column lists,
   generated columns, conflict types and log format, restrictions, architecture and initial snapshot,
   security, config settings, upgrade).
2. Read idx 290-300; append JIT notes (full detail, feeds M4) and a compact regression-test summary.
3. Read idx 983-985; append generic WAL and custom resource manager notes.
4. Read idx 993-1000; append ch.66 in exact detail: file layout table, forks, TOAST thresholds and the four
   strategies, FSM, VM, init fork, PageHeaderData / ItemIdData / HeapTupleHeaderData tables with sizes, HOT.
5. Read idx 1001-1005; append ch.67 (xids, virtual xids, locking, subtransactions, two-phase).
6. Append "## Complete inventories": merge the scratch `inv.md`, then add GUCs referenced in the slice,
   progress-view phases, synchronous_commit levels, special XIDs and thresholds, and the storage struct tables.
7. Append "## Lesson ideas": visualizers, PGlite playground SQL (pageinspect, pg_visibility, pg_freespacemap,
   pg_walinspect, pg_buffercache), and documented pitfalls with fixes.
8. Replace the `<!--LEDGER-->` placeholder with one row per page (69 rows).
9. Hand back: output path, pages read, five most lesson-worthy findings.

## Notes for whoever resumes
- Shell commands are rewritten by the rtk hook: `grep` output gets summarised. Use `awk 'NF' file` to strip
  blank lines when reading doc pages.
- Appends were done with a quoted bash heredoc (`cat >> file <<'EOF_NOTES'`).
- Two values in the notes were added from general knowledge rather than from the slice pages, marked there as
  "per ch.19": `wal_writer_delay` default 200ms, `commit_siblings` default 5, and
  `max_standby_*_delay` default 30s. They should be checked against the ch.19 slice.
- The line about 24-hex-digit WAL segment names being "8 timeline + 8 log + 8 segment" is my reading of the
  example name; the page itself only states the leading 8 digits are the timeline ID.

## Verification
- `awk -F'\t'` over `_order.tsv` for the slice ranges gives 69 pages; the ledger must have 69 rows.
- Check the output file has all four top-level sections and is within roughly 600-1500 lines.
