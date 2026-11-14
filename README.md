# Postgres Internals, Visualized

An interactive, animated textbook that teaches PostgreSQL from the first `SELECT` down to page layout, MVCC,
the planner, WAL and replication. Every lesson pairs a step-through visual of the mechanism with a **real
PostgreSQL 18 running in the browser** ([PGlite](https://pglite.dev), PostgreSQL compiled to WebAssembly). There is
no backend, and every query stays in the reader's tab.

## Curriculum

Seven modules, each lesson in the same six beats: **TL;DR → interactive visualizer → live playground → production
example → pitfalls → key pointers**.

| Module | Topics |
|---|---|
| 1. Foundations & Process Architecture | postmaster and backends, shared memory, background processes, databases, schemas, roles, normalization |
| 2. Storage & Page Layout | types and alignment, arrays, JSONB, UUIDv4 vs v7, the 8 KB slotted page, tuple headers, TOAST, FSM/VM |
| 3. Querying & DML | DML lifecycle, joins, subqueries, CTEs, recursive CTEs, window functions, LATERAL, grouping sets |
| 4. Planner, Optimizer & Indexes | query pipeline, cost model, statistics, B-Tree, Hash, GIN, GiST/SP-GiST, BRIN, index design, EXPLAIN |
| 5. Concurrency, MVCC & Locking | transactions, snapshots and visibility, HOT, isolation levels and SSI, lock modes, SKIP LOCKED, deadlocks |
| 6. Programmability & Extensions | views, triggers, PL/pgSQL, rules, FDW, extensions, full-text search, row-level security |
| 7. WAL, Replication, Vacuum & HA | WAL and LSN, checkpoints and full page writes, vacuum, autovacuum, wraparound, replication, partitioning, backups, pooling |

A searchable **Reference** section lists every configuration parameter, system catalog and view, statistics view, wait
event, lock mode, SQL command, data type, index method, extension, error code and glossary term.

## Curriculum map

[`curriculum/CURRICULUM.md`](curriculum/CURRICULUM.md) fixes each lesson's scope, and
[`curriculum/curriculum-map.json`](curriculum/curriculum-map.json) is generated from the lessons themselves
(`npm run curriculum-map`): module, then lesson, with the TL;DR, visualizer, playground presets, production example,
pitfalls and key pointers.

## For AI agents: MCP server

[`mcp/`](mcp) exposes the lessons, the reference tables and a live PostgreSQL 18 sandbox as MCP tools (`search`, `read`,
`get_lesson`, `lookup_reference`, `run_sql`, …), so any MCP-capable agent can look things up and verify behaviour on a real
Postgres. Set it up in every AI tool on your machine with one command:

```bash
npx -y github:vivek-rm-14286/postgres-internals
```

It detects Claude Code, Claude Desktop, Cursor, VS Code (Copilot), Copilot CLI, OpenCode, pi, Codex, Gemini CLI,
Windsurf, Zed, Cline, Kiro and Goose, and lets you pick. `… uninstall` removes it again. Details: [`mcp/README.md`](mcp/README.md).

## Develop

```bash
cd app
npm install
npm run dev            # http://localhost:5173
npm run check:lessons  # template completeness + runs every playground query on real PGlite in Node
npm run build          # type-check + static build into app/dist
npm run smoke          # headless Chromium: every route, PGlite boot, first query, visualizer step (after build)
```

Add a lesson by creating `app/src/lessons/<module>/<slug>.tsx` that exports `lesson: Lesson`
(contract in [`app/src/lesson/types.ts`](app/src/lesson/types.ts)). It is registered automatically.

## Deploy to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**. The site uses relative asset paths and hash routing, so
it works at `https://<user>.github.io/<repo>/` with no configuration.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · PGlite 0.5 (PostgreSQL 18.6) · CodeMirror 6.
