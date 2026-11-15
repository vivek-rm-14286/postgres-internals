# Project documentation

| Document | What it covers |
|---|---|
| [SESSION-LOG.md](SESSION-LOG.md) | Chronological record of the build: requests, phases, findings, fixes, decisions |
| [PROCESS.md](PROCESS.md) | The research → design → build → verify → ship pipeline, and the agent briefs |
| [SOURCES.md](SOURCES.md) | Every source, version, how it was read, where its material lives, known errors in secondary sources |
| [PGLITE-NOTES.md](PGLITE-NOTES.md) | What the in-browser PostgreSQL can and cannot run |
| [LESSONS-LEARNED.md](LESSONS-LEARNED.md) | Frontend, content and tooling gotchas |
| [agent-plans/](agent-plans) | Resume plans written by research agents when plan mode interrupted them |

## Where everything else lives

| Path | Contents |
|---|---|
| `curriculum/CURRICULUM.md` | Every module and lesson with its scope |
| `curriculum/curriculum-map.json` | Machine-readable map generated from the lessons |
| `curriculum/_*.md` | The agent briefs, verbatim |
| `curriculum/modules/*.md` | Per-module plans: facts with doc sources, visualizer designs, tutorial integration logs |
| `curriculum/research/A-…O-*.md` | The official PostgreSQL 18.7 docs, distilled (15 slices, a coverage ledger for every page) |
| `curriculum/research/T1-…T4, TC` | Neon and Crunchy tutorial notes |
| `curriculum/research/V, W, X, Y` | pgvector, TimescaleDB, distributed PostgreSQL, PostGIS research |
| `curriculum/research/notes-from-articles/` | Notes on articles read in the browser |
| `sources/postgresql-18.7-docs/` | Full text of all 1,149 official docs pages, plus reading order |
| `sources/pdf-audit/` | PDF outline and default-value audit reports |
| `sources/third-party-index/` | URL, title and size of every third-party page read |
| `sources/third-party-copies/` | Local-only copies of third-party pages (git-ignored) |
| `tools/crawl/` | Headless-Chromium crawlers |
| `tools/pdf-audit/` | PDF text extraction and the Reference cross-check |
| `app/src/guide/` | The Production guide: rules for production and scalable services (also exported to the MCP server) |
| `app/scripts/` | check-lessons, check-cookbook, smoke, mobile-audit, screenshot, manifest, MCP export |
