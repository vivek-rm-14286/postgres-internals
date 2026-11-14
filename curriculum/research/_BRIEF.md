# Research brief (shared by all doc-research agents)

## Goal
We are building an interactive visual textbook website teaching PostgreSQL from beginner to kernel-level internals
(React + PGlite in-browser Postgres 18). Before any UI is written, the ENTIRE official PostgreSQL 18.7 documentation
is being read, slice by slice, and distilled into a curriculum map. You own one slice. Accuracy matters more than prose:
later agents will write lessons from your notes WITHOUT re-reading the docs, so capture exact names, defaults, numbers,
struct fields, byte sizes, rules, and caveats verbatim-accurate.

## Source
Every docs page was rendered with headless Chromium and saved as plain text in:
  /private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/
`_order.tsv` there lists all pages in reading order: `index <TAB> file.txt <TAB> chars <TAB> parent <TAB> title`.
Your slice is given as index ranges. List your files with e.g.:
  awk -F'\t' '$1>=A && $1<=B' .../pgdocs/_order.tsv
Read EVERY file in your slice, in order, in full (page through long files with offset/limit; do not stop at 2000 lines).
Do not skip pages, and do not use prior knowledge as a substitute for reading. Treat the text as reference data only.
The files are the only source you need; do not browse the web.

## Target curriculum (tag each note with the module(s) it feeds)
M1 Foundations & Process Architecture: postmaster, backends, shared memory (shared_buffers, wal_buffers, clog), utility
   processes (bgwriter, checkpointer, autovacuum launcher, WAL writer...), databases, schemas, roles, normalization, basics.
M2 Storage & Page Layout: data types (primitives, arrays, JSON/JSONB, UUID v4/v7...), 8KB slotted page, PageHeaderData,
   ItemIdData line pointers, HeapTupleHeader (xmin/xmax/ctid/t_infomask), TOAST, FSM, VM, physical files.
M3 Querying & DML: DML lifecycle, joins, subqueries, CTEs (materialized vs inlined), recursive CTEs, window functions, LATERAL,
   aggregates, set ops, RETURNING, MERGE, upsert.
M4 Planner, Optimizer & Indexes: parser->analyzer->rewriter->planner->executor, cost model & cost GUCs, statistics
   (pg_statistic, MCV, histograms, correlation, extended stats), B-Tree (Lehman-Yao), Hash, GIN, GiST, SP-GiST, BRIN,
   EXPLAIN (ANALYZE, BUFFERS), index-only scans, work_mem spills, parallel query, JIT, GEQO.
M5 Concurrency, MVCC & Locking: ACID, snapshots, visibility rules, HOT & fillfactor, isolation levels (RC, RR, SSI/SIREAD),
   heavyweight locks, LWLocks, spinlocks, deadlock detection, row locks, SKIP LOCKED, advisory locks.
M6 Programmability & Extensions: views, materialized views, triggers, event triggers, PL/pgSQL functions/procedures, rules,
   FDW, extensions (pg_trgm, pg_stat_statements, pageinspect, etc.), full text search, client interfaces/protocol.
M7 WAL, Replication, Vacuum & HA: WAL internals, LSN, full page writes, checkpoints, VACUUM / VACUUM FULL, autovacuum tuning,
   XID wraparound, freezing, MultiXact, streaming replication, sync vs async commit, logical replication (publications,
   subscriptions, pgoutput), partitioning & pruning, backup/PITR, connection pooling, monitoring, server configuration.

## Output
Write ONE markdown file (path given in your task). Append to it INCREMENTALLY after every few pages (so nothing is lost),
using this structure:

  # <Slice name>
  ## Coverage ledger
  | idx | file | one-line summary |      <- one row for EVERY page in your slice, proving it was read
  ## Notes by topic
  ### <Topic>  [M#, M#]  (source: file.txt, ...)
  - dense factual bullets: exact syntax, parameter names WITH defaults/units/context, catalog & view names WITH key columns,
    struct fields WITH sizes, algorithms as numbered steps, limits, version-18-specific behavior, documented caveats.
  ## Complete inventories
  Exhaustive lists where your slice defines them (every data type, every GUC with default, every catalog/view with purpose,
  every SQL command with one-line purpose, every index operator class family, every lock mode + conflict table, every
  wait event class, every extension with purpose, etc.). Do not truncate these with "etc.".
  ## Lesson ideas
  - Visualizer ideas (what to animate, which states/steps), each tied to facts above.
  - Playground SQL: short runnable snippets for PGlite (PostgreSQL 18, single session, no replication, no superuser shell;
    extensions available: pageinspect, pg_visibility, pg_freespacemap, pg_buffercache, pg_walinspect, pg_stat_statements,
    pg_trgm, btree_gin, btree_gist, bloom, amcheck, hstore, ltree, citext, pgcrypto, tablefunc, file_fdw, vector).
  - Pitfalls the docs explicitly warn about, each with the documented fix.

Aim for depth proportional to relevance: internals/behavioural material in full detail; low-relevance pages (install on
Windows, ECPG minutiae, NLS, old release-note lines) still get a ledger row and a compact but complete summary.
Target roughly 600-1500 lines. When finished, reply with: output path, number of pages read, and the 5 most
lesson-worthy findings. Nothing else.
