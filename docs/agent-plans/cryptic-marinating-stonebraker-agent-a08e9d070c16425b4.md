# Plan: finish slice B research notes (ch.14 Performance Tips, ch.15 Parallel Query, inventories, lesson ideas)

## Context
Slice B of the PostgreSQL 18 docs distillation (per `/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`).
Output file: `/Users/vivek-14286/postgres-internals/curriculum/research/B-types-indexes-fts-mvcc-perf-parallel.md`
Source dir: `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/`

Plan mode was switched on partway through, so writing to the output file stopped. Nothing below has been executed yet.

## Done so far (already in the output file, 688 lines)
- Pages read in full and noted: idx 66-87 (ch.8), 120-126 (ch.10), 127-139 (ch.11), 140-151 (ch.12), 152-159 (ch.13), 160 (ch.14 TOC page).
- Coverage ledger rows exist for idx 66-87 and 120-160. New rows are inserted before the `<!-- ledger-end -->` marker line.
- "Notes by topic" sections written for ch.8, ch.10, ch.11, ch.12 and ch.13 (ch.13 in full: isolation levels, Table 13.1, all 8 table lock modes with acquirers, 4 row lock modes, deadlocks, advisory locks, SSI caveats, SQLSTATEs).

## Remaining steps
1. Read in full, in order (about 103K chars):
   - 161 `using-explain.txt` (46K; page through it)
   - 162 `planner-stats.txt`
   - 163 `explicit-joins.txt`
   - 164 `populate.txt`
   - 165 `non-durability.txt`
   - 166 `parallel-query.txt`
   - 167 `how-parallel-query-works.txt`
   - 168 `when-can-parallel-query-be-used.txt`
   - 169 `parallel-plans.txt`
   - 170 `parallel-safety.txt`
2. Append "Notes by topic" sections after every two or three pages:
   - EXPLAIN output anatomy (cost pairs, rows, width, node types), EXPLAIN ANALYZE fields (actual time, rows, loops, Rows Removed by Filter, sort and hash memory, Heap Fetches), BUFFERS fields, caveats. [M4]
   - Planner statistics: `pg_class.reltuples/relpages`, `pg_statistic` / `pg_stats` columns, `default_statistics_target`, MCV and histograms; extended statistics (`CREATE STATISTICS` kinds: dependencies, ndistinct, mcv; `pg_statistic_ext`, `pg_stats_ext`). [M4]
   - Explicit JOIN control: `join_collapse_limit`, `from_collapse_limit`, GEQO threshold. [M4]
   - Bulk load tips and non-durable settings, with exact GUC names. [M7, M4]
   - Parallel query: Gather / Gather Merge, worker GUCs, when parallelism is disabled, parallel scan/join/aggregate/append plans, parallel safety labels. [M4]
3. Add ledger rows for idx 161-170 before `<!-- ledger-end -->`, then remove the marker line.
4. Append `## Complete inventories`:
   - Every data type from Table 8.1 with aliases, storage size and range (sizes from the per-type tables already noted).
   - Pseudo-types (Table 8.27), OID alias types (Table 8.26), range and multirange types.
   - Index types with supported operators; which support multicolumn, unique, INCLUDE, index-only scans, ordering.
   - Table 13.2 table-lock conflict matrix and Table 13.3 row-lock conflict matrix, complete.
   - FTS: 23 token types with tokid, dictionary templates, built-in dictionaries, functions, limits.
   - Every GUC named in the slice with its documented default (only where the slice states one).
   - EXPLAIN node types and options seen in ch.14; parallel-safety categories.
5. Append `## Lesson ideas`: visualizer ideas, PGlite playground SQL (single session, so two-session lock demos need a note), and documented pitfalls with fixes.
6. Verify: ledger has 73 rows (66-87 and 120-170), no "etc." truncation in inventories, line count within the 600-1500 target.
7. Reply with output path, pages read, and the 5 most lesson-worthy findings.

## Known caveats to carry into the final report
- `datatype-uuid.txt` does not give UUID generation function names; they were taken from `functions-uuid.txt` (section 9.14, outside the slice) and are marked as such in the notes.
- One line in the range-types notes gives the canonical display of `int8range(1, 14, '(]')` as `[2,15)`; the docs only say it is converted to canonical form. That value is derived, not quoted, and should be reworded when writing resumes.
