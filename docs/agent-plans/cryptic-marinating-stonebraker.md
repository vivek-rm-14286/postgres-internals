# PostgreSQL Internals — interactive visual textbook (GitHub Pages)

## Context

Goal: a static, animated, interactive site teaching PostgreSQL from beginner to kernel-level internals, with a real
in-browser Postgres (PGlite) in every lesson. The request fixes the order: (1) read the whole official documentation
with browser-driven sub-agents and synthesize a curriculum map, (2) scaffold the app, (3) write seven modules where
every lesson follows a six-part template, (4) verify the static build and PGlite in a browser.

Plan mode was switched on while Phase 1 was mid-flight, so this plan records what is done and what remains.

## State so far (nothing in the app is written yet)

- Project folder: `~/postgres-internals/` (only `curriculum/research/` exists).
- **Docs crawl — done.** Headless Chromium (Playwright) rendered all 1,149 pages of the PostgreSQL **18.7** docs, 0 failures.
  Text + reading-order manifest are in the session scratchpad (`pgdocs/`, `_order.tsv`).
- **PGlite spike — done.** `@electric-sql/pglite` 0.5.16 = PostgreSQL **18.6**, so docs and playground match.
  Verified working: `ctid/xmin/xmax`, `EXPLAIN (ANALYZE, BUFFERS)`, `pg_current_snapshot()`, `uuidv7()`, partitioning,
  `pg_locks`, and extensions `pageinspect`, `pg_visibility`, `pg_freespacemap`, `pg_buffercache`, `pg_walinspect`,
  `pg_stat_statements`, `pg_trgm`, plus `vector` via `@electric-sql/pglite-pgvector`.
  Limit: PGlite is a **single backend** — no second session, no replication. Lessons needing two sessions or a standby
  (lock waits, deadlocks, SSI, streaming/logical replication, PgBouncer) use a scripted simulator for the visual and the
  playground for the single-session observable parts (`pg_locks`, `FOR UPDATE SKIP LOCKED`, `pg_publication`, …).
- **Research agents — interrupted.** 15 agents (slices A–O, brief in `curriculum/research/_BRIEF.md`) were reading the
  docs. Plan mode stopped them part-way; at least F, J and L handed back partial notes with their remaining page ranges.

## Step 1 — Finish Phase 1 (docs ingestion)

1. Resume each interrupted research agent (same agent, context intact) to finish its unread pages and assemble its file
   under `curriculum/research/<slice>.md` (coverage ledger with one row per page, notes, inventories, lesson ideas).
2. Check coverage mechanically: every index 0–1148 of `_order.tsv` appears in exactly one ledger; re-dispatch gaps.
3. Synthesize `curriculum/curriculum-map.json` + `curriculum/CURRICULUM.md`: module → lesson → {facts with doc source,
   visualizer spec, playground schema + queries, production example, pitfalls, key pointers}. Facts flagged by agents as
   "from memory, not in docs" (e.g. `stakind` slot numbers) are either sourced or dropped.

## Step 2 — Scaffold (I build this myself, before any lesson content)

Stack: **Vite + React 18 + TypeScript**, Tailwind CSS, Framer Motion, React Router (`HashRouter`) with Vite
`base: './'` so the site works under any `<user>.github.io/<repo>/` path without configuration.

```
postgres-internals/
  .github/workflows/deploy.yml      # build + actions/deploy-pages on push to main
  curriculum/                       # research notes + curriculum map (Phase 1 output)
  scripts/check-lessons.mjs         # template + SQL validation (see Verification)
  src/
    app/        Layout, Sidebar (module tree + progress tracker in localStorage), Home, Glossary, routes
    lesson/     types.ts (Lesson contract), LessonPage.tsx (renders the 6 fixed sections in order),
                TldrCard, ProductionExample, Pitfalls, KeyPointers
    playground/ pglite.ts (lazy singleton loader, extension registry, reset), Playground.tsx (CodeMirror SQL editor,
                preset query chips, result grid, EXPLAIN output view, error display, "reset database")
    viz/        shared primitives: Stepper (play/pause/step/scrub), PageGrid (8KB page bytes), TupleBox, TreeView
                (B-Tree/GIN/GiST), Timeline (LSN / XID), ProcessDiagram, PlanTree, LockMatrix, Legend
    lessons/m1..m7/<slug>.tsx       # one file per lesson, exports `lesson: Lesson`
    lessons/index.ts                # module + lesson registry (drives sidebar, routing, progress)
```

**Lesson contract** (enforced by types and by `check-lessons`): `id, module, title, tldr (2 sentences),
Visualizer (component), playground {extensions, setup SQL, presets[]}, production {scenario, solution, sql},
pitfalls[{trap, symptom, fix}], pointers[3–5]`. `LessonPage` renders exactly: TL;DR → Visualizer → Playground →
Production example → Pitfalls → Key pointers. No lesson can ship without all six.

## Step 3 — Lessons (≈48, one build agent per module, in parallel)

Each module agent gets: the curriculum map for its module, the Lesson contract, the viz primitives, and two finished
reference lessons I write first (`m2/slotted-page`, `m4/btree`) as the quality bar. Agents write only inside their own
`src/lessons/m#/` folder.

- **M1 Foundations & Process Architecture (6):** what Postgres is & client/server · postmaster & backend fork ·
  shared memory (`shared_buffers`, `wal_buffers`, CLOG) with buffer-pin animation · utility processes · clusters,
  databases, schemas, `search_path`, roles · normalization (1NF→3NF) & constraints.
- **M2 Storage & Page Layout (8):** primitive types & alignment padding · arrays · JSON vs JSONB · UUIDv4 vs UUIDv7
  (B-Tree fragmentation) · slotted 8KB page inspector (`PageHeaderData`, `ItemIdData`) · heap tuple header
  (`xmin/xmax/ctid/t_infomask`) · TOAST · FSM & VM + relation forks/files.
- **M3 Querying & DML (7):** DML lifecycle (INSERT/UPDATE/DELETE as tuple versions, RETURNING, MERGE, upsert) · joins ·
  subqueries · CTEs materialized vs inlined · recursive CTEs · window functions & frames · LATERAL.
- **M4 Planner, Optimizer & Indexes (9):** query pipeline · cost model · statistics (`pg_stats`, MCV, histogram,
  correlation, extended) · B-Tree (Lehman-Yao, splits, dedup) · Hash · GIN (pending list, posting trees) ·
  GiST & SP-GiST · BRIN · reading `EXPLAIN (ANALYZE, BUFFERS)` (interactive plan tree; index-only scan & heap fetches;
  `work_mem` hash/sort spills; parallel & JIT).
- **M5 Concurrency, MVCC & Locking (7):** ACID · snapshots & visibility rules · HOT & `fillfactor` · isolation levels
  (RC/RR/SSI + SIREAD) · heavyweight locks & conflict matrix · row locks, `SKIP LOCKED`, advisory locks ·
  LWLocks, spinlocks & deadlock detection.
- **M6 Programmability & Extensions (6):** views & materialized views · triggers · PL/pgSQL functions & procedures ·
  rule system · FDW · extensions (`pg_trgm`, `pgvector`, `pg_stat_statements`, `pageinspect`).
- **M7 WAL, Replication, Vacuum & HA (9):** WAL & LSN · full page writes & checkpoints · VACUUM vs VACUUM FULL ·
  autovacuum tuning · XID wraparound, freezing, MultiXact · physical streaming replication & sync/async commit ·
  logical replication (`pgoutput`) · declarative partitioning & pruning · connection pooling (PgBouncer modes).

Plus a searchable **Reference** area generated from the research inventories (every GUC, catalog/view, lock mode,
wait event, data type, index AM, extension, glossary term) so "nothing skipped" is browsable, not buried in prose.

## Step 4 — Verification

1. `npm run check:lessons` (Node): every lesson has all six sections; each lesson's playground `setup` and every preset
   query executes without error against Node PGlite with the lesson's extensions.
2. `npm run build` (tsc + vite) clean; `vite preview` serves `dist/` from a sub-path to mimic GitHub Pages.
3. Headless-Chromium smoke test over the built site: visit every lesson route, wait for PGlite ready, run the first
   preset, step the visualizer once, assert no console errors and no failed asset requests (WASM/data files).
4. Manual pass in Chrome on a sample of lessons per module for animation quality and dark/light + mobile layout.
5. Validate `deploy.yml` syntax; no push or commit is made without being asked (repo creation/push left to the user).

## Cost note

Phase 1 reads ~7.5M characters of docs across 15 agents (already ~half spent). Step 3 uses 7 build agents. All other
work is done in the main session.
