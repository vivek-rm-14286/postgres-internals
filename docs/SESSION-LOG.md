# Session log: how "Postgres, Visualized" was built

A chronological record of the build session (13–14 November 2026): what was asked, what was done, what was found and
what was decided. The companion documents are [PROCESS.md](PROCESS.md) (the method),
[SOURCES.md](SOURCES.md) (every source and how it was read), [PGLITE-NOTES.md](PGLITE-NOTES.md) (what the in-browser
PostgreSQL can and cannot do) and [LESSONS-LEARNED.md](LESSONS-LEARNED.md) (engineering gotchas).

## Round 1: an interactive PostgreSQL internals textbook

**Ask.** A static GitHub Pages site teaching PostgreSQL from beginner to kernel-level internals in seven modules, with
the same six-part template for every lesson (TL;DR, interactive visualizer, live PGlite playground, production example,
pitfalls, key pointers). First read every page of the official docs with browser-driven sub-agents and build a
curriculum map. No placeholder content.

**Docs ingestion.**
- All 1,149 pages of the PostgreSQL 18.7 HTML documentation were rendered with headless Chromium (Playwright), with 0
  failures, and saved as text with a reading-order manifest (now in `sources/postgresql-18.7-docs/`).
- 15 research agents each read one slice in full (A–O, about 500k characters each) and wrote structured notes with a
  per-page coverage ledger, topic notes, complete inventories and lesson ideas (`curriculum/research/A-…O-*.md`).
- A script confirmed that every page index 0–1148 appears in a ledger.
- Interruptions. Plan mode was switched on mid-run, which stopped every agent; they wrote resume plans
  (`docs/agent-plans/`). A 5-hour usage limit then stopped them again. All were resumed with context intact, and none
  of the finished work was lost.

**Runtime spike.** PGlite 0.5.16 is PostgreSQL 18.6, so the docs (18.7) and the playground match. pageinspect,
pg_visibility, pg_walinspect, pg_stat_statements, pg_trgm and pgvector all work. It is a single backend: no second
session, no replication.

**Tutorial ingestion (user request).** The Neon PostgreSQL tutorial (431 pages) and the Crunchy Data developer tutorials
(33 pages) were rendered and mined by 5 agents (`T1–T4`, `TC`). Their errors against the PG 18 docs were logged.

**Build.**
- Scaffold: Vite + React 19 + TypeScript + Tailwind 4 + Framer Motion + CodeMirror, HashRouter with `base: './'`.
- Two reference lessons were written first to set the quality bar: the 8 KB slotted page, using offsets captured from
  a real pageinspect run, and the B-Tree, a live split simulator with UUIDv4 vs v7 measured at 39% more index pages.
- Seven module agents built the remaining 55 lessons in parallel.
- A Reference area was generated from the research inventories (410 GUCs, 64 catalogs, 280 wait events, 263
  SQLSTATEs…). The wait-event descriptions and missing GUC contexts were filled from the server's own `pg_wait_events`
  and `pg_settings`.

**Verification and fixes in round 1.**
- **Multi-statement scripts.** PGlite runs a multi-statement string as one implicit transaction, which breaks VACUUM.
  Added a psql-style statement splitter.
- **Engine rebuilt every render.** A default `[]` prop re-created the playground engine on each render. 26 of 59 smoke
  routes failed ("PGlite is closed") until the engine was keyed on content.
- **Bundle size.** The entry bundle was 2.25 MB with eager lesson imports. Per-lesson lazy chunks and a generated
  manifest brought it to 424 kB (137 kB gzipped).
- **NOTICE output.** PostgreSQL notices (VACUUM VERBOSE, RAISE) were captured with `onNotice` and shown in the playground.
- Published to GitHub (public repo) and deployed with GitHub Actions to Pages.

**Follow-ups.**
- The tutorials had been only lightly applied, so a second pass per module added 300+ tutorial-derived items: presets,
  misconception pitfalls and PG18 features. Each item is logged in `curriculum/modules/m*.md` under "Tutorial integration".
- The user asked for no provenance wording ("the docs say", "captured from a real run", vendor names). It was removed
  site-wide, and the docs-link footer was dropped.
- MCP server (`mcp/`) exposing lessons, the reference tables, docs notes and a live PostgreSQL sandbox. Added a
  one-command installer (`npx -y github:vivek-rm-14286/postgres-internals`) that detects 16 AI tools and installs into or
  uninstalls from each. Config edits keep comments; uninstall restores files byte for byte.

## Round 2: one-stop destination

**Ask.** Make the site mobile friendly. Add fundamentals and queries from beginner to advanced. Add pgvector, TimescaleDB
and distributed PostgreSQL from 20 given links. Work in phases, with worker and verification agents.

- **Phase 0, mobile.**
  - Cause: inline code with `white-space: nowrap` and grid children at `min-width: auto` pushed pages up to 765 px wide.
  - Fix: wrapping code, `.grid > *, .flex > * { min-width: 0 }`, and an Expand (full-screen) frame on every visualizer.
  - Result: all pages audited at 390 px with no overflow (107 pages at the end of round 2).
- **Phase 1, ingestion.** The 20 links plus the primary docs (the pgvector README, TimescaleDB docs, Citus docs) were
  rendered. Six were blocked or partial (bot walls on two Medium articles, Baeldung and Stackademic; Databricks
  summary-only). Research agents V (pgvector), W (TimescaleDB) and X (distributed) wrote notes verified against primary
  sources and tested in PGlite where possible.
- **Phase 2, design.**
  - Three tracks: Fundamentals (F1–F5), Internals (I1–I6) and Ecosystem (E1–E3).
  - A Cookbook of graded exercises, checked against a reference solution on a fresh database copy.
  - The site was renamed "Postgres, Visualized".
- **Phase 3, build.** Eight agents built F1, F2, F3 and F5 (23 lessons), E1, E2 and E3 (18 lessons), and the Cookbook
  (91 exercises on 5 datasets).
- **Phase 4, verify.** An independent fact-check agent per module, about 100 fixes in total. Notable ones:
  - a playground freeze in a 2PC preset (a lock wait that can never time out in the browser);
  - wrong Citus rebalance behaviour;
  - Raft failover time (about 3 s, not 2 s);
  - Patroni 3.2 auto-adjusting its timing rule;
  - `add_dimension` working on non-empty hypertables since 2.8 (the docs page is out of date; the source code wins);
  - `sum(int)` returning bigint;
  - the skip-scan count being 14, not 8;
  - several unreproducible numbers replaced with measured ones.
- **Blocked links, recovered legitimately.**
  - Both Medium articles (and the whole six-part pgvector series) came from Medium's official RSS feeds.
  - Baeldung and Databricks were read in the user's own Chrome, with the user's go-ahead.
  - Stackademic was read through the author's free "friend link".
  - Paywall-bypass services (Freedium) were declined. Archive.org was blocked by the session's permission rules.
- **Release.** 98 lessons, 91 exercises, 121 smoke checks and 107 mobile pages all passed. Committed and deployed (commit `18fff1d`).

## Round 3: the official PDF, then the remaining gaps

- **PDF audit.** Downloaded `postgresql-18-A4.pdf` (18.7, 3,178 pages, generated 9 November 2026).
  - All 4,030 outline entries were found in the HTML crawl.
  - The Reference tables match the PDF: 263/263 SQLSTATEs, 64/64 catalogs, 37/37 views, 43/43 statistics views,
    183/183 SQL commands, 146/146 glossary terms, 100/100 data types, 410/410 parameter names and all 15 limits.
  - No parameter default contradicts the PDF or `pg_settings`.
  - Script: `tools/pdf-audit/check_reference.py`. Outputs: `sources/pdf-audit/`.
- **Coverage audit** against a 6-section learning checklist and an index guide: everything was covered except PostGIS.
  Thin spots: JSON construction and the SQL/JSON standard functions, and range, network, geometric and composite types.
- **Added.** E4 "Spatial Data with PostGIS" (4 lessons; PostGIS 3.6.2 runs live in PGlite via `@electric-sql/pglite-postgis`)
  and two F2 lessons, "Working with JSON" and "Ranges and other special types". That brings the total to 104 lessons.
- **Verified.** Independent fact-checks made 8 fixes in each.
  - PostGIS: a preset that only worked after the previous one; the k-means `max_radius` exception; the
    `ST_SetSRID`/degrees-vs-metres symptom. Every distance and plan number reproduced.
  - JSON and ranges: `JSON_EXISTS` returns false, not NULL, on error; JSON "updated in place" contradicted the JSONB
    lesson. The range model matched PostgreSQL on 36,633 checks.
- **MCP 1.2.0.** Optional PostGIS sessions (`with_postgis`).
- **Session record.** Everything from this session committed: research notes, briefs, module plans, agent resume
  plans, official docs text, crawler and audit tools, and `docs/`. Third-party page copies are kept locally only.

## Round 4: TimescaleDB and pgvector checklists

- **Coverage audit** against a TimescaleDB checklist (hypertables, Hypercore, hyperfunctions, lifecycle) and a pgvector
  checklist (types, operators, ANN indexes, filtering, hybrid search, quantization, running in the browser). Two gaps:
  the Toolkit hyperfunctions, and in-browser pgvector.
- **Added two lessons, 106 in total.**
  - E2 "Hyperfunctions": `time_weight`, `candlestick_agg`, `percentile_agg`/`uddsketch` with `rollup`, `counter_agg`.
    The Toolkit is 1.27.0 (TSL, PG 16–18, trusted since 1.23, not available on Neon). It is simulated, with native SQL
    equivalents.
  - E1 "pgvector in the browser": PGlite sizes measured at about 5.4 MB compressed, so a popular "under 3 MB gzipped"
    claim is out of date. Also covers `idb://` and `opfs-ahp://` persistence (a live demo, on click only),
    `PGliteWorker` leader election, and an opt-in Transformers.js model (`Xenova/all-MiniLM-L6-v2`, about 29 MB first
    load, cached afterwards).
- **Fact-checks.**
  - Hyperfunctions, 10 fixes: wording about a counter delta "turning negative"; the percentile error bound; the 1.14
    renames. The flagged linear-mode values were recomputed from the Toolkit source and were correct.
  - In-browser lesson, 7 fixes: `initdb.wasm` was missing from the download total; timing labels. Safety checks passed:
    no storage, worker or model download without a click.
- **Noted.** The site's only external request on page load is Google Fonts.

## Round 5: distributed-database theory

- **Coverage audit** against a distributed-systems checklist. PostgreSQL-specific distribution was already covered
  (E3), but most textbook theory was missing: P2P, shared-nothing, federated systems, vertical and hybrid fragmentation
  and their correctness rules, transparencies, 3PC, Paxos, timestamp ordering, global deadlock detection, query
  localization and semi-joins, consistent hashing, node-to-node TLS and data residency.
- **Added E5 "Distributed Database Theory", 5 lessons, 111 in total.** Architectures and classification; fragmentation,
  allocation and replication; distributed transactions and consensus; distributed query processing; operating
  distributed databases. Each has step-through simulators (2PC/3PC failures, Paxos duels, a consistent-hash ring,
  a phi-accrual detector, split brain, a pg_hba evaluator) paired with runnable PostgreSQL equivalents (partitions as
  fragments, pruning as localization, `PREPARE TRANSACTION`, advisory locks with fencing tokens, recursive wait-for
  graph cycle detection, measured semi-join bytes). Research notes: `curriculum/research/Z-distributed-theory.md`,
  verified against the original papers (Lamport, Raft, Skeen, Skeen & Stonebraker, Karger, Dynamo, Hayashibara,
  Bernstein-Hadzilacos-Goodman) and vendor docs.
- **Fact-check, 17 fixes.** Three presets that only worked after an earlier preset; an unreachable 3PC state; "3PC
  never blocks" (it does not block on crashes, but a partition breaks it); `postgres_fdw` pointed at a MySQL server;
  a split-brain heal that kept a stale term; a rebalance share recomputed as 36.8%.

## Round 6: whole-site review

- **Method.** Eight independent reviewers read every lesson, the Cookbook and the Reference a second time, testing
  claims on a real PostgreSQL 18; the app shell was reviewed by hand with an automated accessibility scan; a new
  script ran every playground example on a fresh database.
- **Content: 303 findings, applied.** Wrong pitfall fixes (a SECURITY DEFINER `search_path` without `pg_temp`, a
  timestamp comparison that errors, unquoted numeric trigger names), wrong facts (`TRUNCATE` and readers, `ON CONFLICT
  DO NOTHING` and sequences, `CREATE DATABASE` strategy, `enable_*` flags in 18), simulators that modelled the wrong
  thing (Raft committing without a majority, VACUUM FULL phase order, recovery past the end of WAL), Cookbook
  exercises that accepted wrong answers or the untouched starter, and garbled or truncated Reference cells. In-scope
  topics that were missing were added, with six new exercises (97) and cross-links between modules.
- **Order-dependent examples.** 22 examples in 11 lessons failed unless an earlier example had been run, and six more
  had notes that were only true in order. All fixed; `scripts/check-standalone.mjs` now runs in CI.
- **App shell.** Site search (lessons, exercises, every Reference row; Ctrl/⌘ K or `/`); fonts bundled, so pages make
  no third-party requests; contrast fixes (dark-mode buttons were 2.4:1, green and amber text in light mode);
  skip link, focus on navigation, labelled editors, keyboard-scrollable tables, inert closed drawer; the Cookbook
  shows your result beside the expected one; the Reference filter takes several words and lives in the URL.
- **Deferred.** A query that never ends freezes the tab: the in-browser database cannot be interrupted
  (`statement_timeout` does not fire). The fix is to run it in a Web Worker.
- **Interruptions.** A usage limit stopped seven agents mid-run; all resumed with their work intact. Two reviewers'
  edits were refused because their original task was review-only; fresh agents applied those findings.

## Decisions worth remembering

- **Primary sources win.** Blogs and tutorials supply teaching angles. Their errors become "common misconception" pitfalls.
- **Never pretend.** Anything the browser cannot run (TimescaleDB, Citus, replication, PgBouncer, concurrent sessions)
  is simulated in the visualizer and paired with a runnable native-PostgreSQL equivalent.
- **Measure, don't estimate.** Numbers in lessons come from real runs. Randomised results (HNSW recall) are stated as ranges.
- **Copyright.** Third-party page copies stay local (`sources/third-party-copies/`, git-ignored). Only our notes and a
  URL index are published.
- **Outward-facing actions** (public repo, pushes, deploys, editing tool configs, using the user's browser) were each
  confirmed with the user first.
