# Sources register

Every source used, how it was obtained and where its material lives. **Primary sources are the source of truth for
facts.** Secondary sources supplied teaching angles, examples and datasets, and their errors were turned into
"misconception" pitfalls.

## Primary

| Source | Version | How read | Where |
|---|---|---|---|
| PostgreSQL documentation (HTML), all 1,149 pages | 18.7 | headless Chromium crawl | `sources/postgresql-18.7-docs/` (full text; PostgreSQL License) · notes `curriculum/research/A-…O-*.md` |
| PostgreSQL documentation (PDF, A4), 3,178 pages | 18.7 (built 2026-11-09) | downloaded from postgresql.org, text extracted with pdf.js | outline + audit results in `sources/pdf-audit/` (PDF not committed: re-download from postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf) |
| PostgreSQL server itself (PGlite) | 18.6 | `pg_settings`, `pg_wait_events`, catalogs, every lesson query | `app/scripts/check-lessons.mjs` |
| pgvector README, CHANGELOG, source headers, LICENSE | 0.8.7 | GitHub | `curriculum/research/V-pgvector.md` |
| TimescaleDB README, CHANGELOG 2.0–2.32.0, official docs (`tigerdata.com/docs/llms-full.txt`), selected source files | 2.32.0 | GitHub, WebFetch | `curriculum/research/W-timescaledb.md` |
| Citus docs (Microsoft Learn and docs.citusdata.com), YugabyteDB, pgEdge Spock 5, EDB PGD 6.5, Patroni, Neon architecture, Aurora storage | current (Nov 2026) | WebFetch | `curriculum/research/X-distributed-postgres.md` |
| PostGIS manual | 3.6 | WebFetch | `curriculum/research/Y-postgis.md` |

## Secondary (teaching material)

| Source | Pages | How read | Notes |
|---|---|---|---|
| Neon PostgreSQL tutorial (neon.com/postgresql) | 431 | headless Chromium | `curriculum/research/T1–T4-*.md`; URL index `sources/third-party-index/neon-postgresql-tutorial.tsv` |
| Crunchy Data developer tutorials | 33 | headless Chromium (JS on) | `curriculum/research/TC-crunchy-tutorials.md`; index `…/crunchy-developer-tutorials.tsv` |
| neon.com/docs/extensions/pgvector, severalnines.com pgvector deep dive, geeksforgeeks pgvector | 3 | headless Chromium | in `V-pgvector.md` |
| Databricks "What is pgvector?" | 1 | user's Chrome (with permission) | `curriculum/research/notes-from-articles/browser-read-notes.md` |
| Medium "All you need to know about pgvector" (parts 1–6) | 6 | Medium's official RSS feed | folded into E1 lessons |
| freeCodeCamp TimescaleDB course, neon.com/docs/extensions/timescaledb | 2 | headless Chromium | in `W-timescaledb.md` |
| Baeldung "Getting Started With TimescaleDB" | 1 | user's Chrome | `browser-read-notes.md` |
| Stackademic "TimescaleDB: The Complete Guide, Part 1" | 1 | user's Chrome via the author's friend link | `browser-read-notes.md` |
| Yugabyte (key concepts, behaviour differences), Crunchy Data distributed architectures, pgEdge, EnterpriseDB, Instaclustr, dev.to, GeeksforGeeks, Hacker News thread | 9 | headless Chromium | in `X-distributed-postgres.md` |
| Microsoft Learn: Citus DDL reference | 1 | WebFetch | in `X-distributed-postgres.md` |
| Medium "Distributed Postgres architectures" | 1 | Medium's official RSS feed | folded into E3 lessons |

Third-party page copies are kept **locally only** in `sources/third-party-copies/` (git-ignored, copyright of their
authors). The URL lists are in `sources/third-party-index/`.

## Known errors found in secondary sources

Each tutorial note file has a "Discrepancies" section, and the ecosystem notes have "Contradictions & version notes".
Examples:
- Cosine distance (`<=>`) is mislabelled "cosine similarity" and sorted descending.
- Jaccard distance is described as applying to sparse vectors (it is for `bit` only).
- `EXTRACT` is said to return double precision (it returns numeric since PG 14).
- An `add_dimension` example targets a column that does not exist.
- An HA tutorial uses removed settings (`wal_keep_segments`, `recovery.conf`).
- The official TimescaleDB docs page still says `add_dimension` needs an empty table. The code has allowed data since 2.8.
