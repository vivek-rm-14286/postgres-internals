# Postgres, Visualized

An interactive, animated textbook for PostgreSQL: from your first `SELECT` to page layout, MVCC, the planner, WAL and
replication, and on to pgvector, TimescaleDB and distributed PostgreSQL. Every lesson pairs a step-through visual of the
mechanism with a **real PostgreSQL 18 running in the browser** ([PGlite](https://pglite.dev), PostgreSQL compiled to
WebAssembly). There is no backend; every query stays in the reader's tab. It works on phones too.

**Live site:** https://vivek-rm-14286.github.io/postgres-internals/

## What's inside

111 lessons in three tracks, each in the same six beats: **TL;DR → interactive visualizer → live playground → production
example → pitfalls → key pointers**.

| Track | Modules |
|---|---|
| **Fundamentals** | F1 Getting started with SQL · F2 Working with data (text, numbers, dates, conditionals, casts, JSON, ranges and special types) · F3 Designing a database · F4 Querying & DML (joins, subqueries, CTEs, windows, LATERAL, grouping) · F5 Practical SQL patterns (pagination, upserts, pivots, gaps & islands, hierarchies, search, queues, performance) |
| **Internals** | I1 Processes & memory · I2 Storage & page layout · I3 Planner & indexes · I4 MVCC & locking · I5 Programmability & extensions · I6 WAL, vacuum, replication & HA |
| **Ecosystem** | E1 Vector search with pgvector (runs live, including running it fully in the browser) · E2 Time-series with TimescaleDB (including Toolkit hyperfunctions) · E3 Distributed PostgreSQL (Citus, distributed SQL, multi-master, HA clusters) · E4 Spatial data with PostGIS (runs live) · E5 Distributed database theory (architectures, fragmentation and replication, 2PC/3PC, Paxos, timestamp ordering, distributed query processing, operations) |

Plus:

- **Project docs** in [`docs/`](docs): session log, process, sources register, PGlite notes, lessons learned.

- **Cookbook**: 97 graded SQL exercises (beginner → expert) on five realistic datasets. Press *Check* and your result is
  compared with a reference solution on a fresh copy of the data.
- **Production guide**: recommendations for production and scalable services, grouped by area (queries, schema, indexes,
  transactions, schema changes, connections, vacuum, observability, reliability, security, scaling). Each rule gives the
  reason, the pattern to avoid, the pattern to use, and the lesson that shows the mechanism. Also served to AI agents by
  the MCP server (`production_guidelines`).
- **Reference**: searchable tables of every configuration parameter, system catalog and view, statistics view, wait event,
  lock mode, SQL command, data type, index method, extension, error code and glossary term.

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
npm run check:cookbook # every exercise: reference solution accepted, wrong answer rejected
npm run check:standalone # every playground example on a fresh database, on its own
npm run build          # type-check + static build into app/dist
npm run smoke          # headless Chromium: every lesson + Cookbook checks (after build)
```

Add a Cookbook exercise in `app/src/cookbook/data/<dataset>.ts`. Add a Production guide rule in `app/src/guide/data.ts`. Add a lesson by creating `app/src/lessons/<module>/<slug>.tsx` (module ids in `app/src/lessons/modules.ts`) that exports `lesson: Lesson`
(contract in [`app/src/lesson/types.ts`](app/src/lesson/types.ts)). It is registered automatically.

## Deploy to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**. The site uses relative asset paths and hash routing, so
it works at `https://<user>.github.io/<repo>/` with no configuration.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · PGlite 0.5 (PostgreSQL 18.6, pgvector 0.8.7, PostGIS 3.6.2) · CodeMirror 6.
