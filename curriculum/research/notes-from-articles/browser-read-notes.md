# Notes from the 3 articles read in the user's own browser (secondary sources; primary docs win)

## Baeldung, "Getting Started With TimescaleDB" (last updated April 2024)
- Covers: what TimescaleDB is (extension; hypertables, continuous aggregates, compression); install via `brew tap timescale/tap && brew install timescaledb`; `CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`.
- Hypertable example: a regular `employee(id int8, name varchar, login_time timestamp, logout_time timestamp)` table converted with
  `SELECT create_hypertable('employee', by_range('login_time'));`, plus `migrate_data => true` for a table that already has rows.
- Claims the partition column may be date, smallint, int, bigint, timestamp or timestamptz, and that the dimension builder can be
  omitted (the legacy `create_hypertable(table, column)` form).
- Range query with `BETWEEN '2023-01-01 00:00:00' AND '2023-01-01 12:00:00'`: an inclusive upper bound, a classic time-range trap.
- Teaching value: very beginner-level. Useful as the "simplest possible first hypertable" and the `migrate_data` detail. It predates
  2.18+ naming and the `CREATE TABLE … WITH (tsdb.hypertable)` syntax.

## Stackademic, "TimescaleDB: The Complete Guide — Part 1: Foundations" (July 2026)
- **Motivation story:** per-second server metrics that grow to hundreds of millions of rows; dashboards slow down; indexes balloon;
  autovacuum struggles; manual partitioning gets painful. "Should we move to a dedicated TSDB?"
- **Positioning:** an extension, not a separate engine; tools, ORMs, pg_dump, PostGIS and pgvector keep working. The company
  rebranded to **Tiger Data in 2025**, but the extension is still called TimescaleDB.
- **Licensing:**
  - Apache 2.0 edition vs Community edition (Timescale License, TSL). The Community edition adds continuous aggregates,
    compression/columnstore and hyperfunctions.
  - Community is free for self-hosted production use. Its main restriction: you cannot offer TimescaleDB itself as a hosted DBaaS.
- **Hypertables:** chunks by time; queries only scan matching chunks ("last 24 h reads the latest chunk").
  - `create_hypertable('cpu_metrics', 'time')` and `create_hypertable('cpu_metrics', by_range('time'), if_not_exists => TRUE)`.
  - **ERROR in article:** `add_dimension('cpu_metrics', by_hash('tenant_id', 4))` is used on a table that has no `tenant_id` column.
- **Chunk sizing table** (heuristic): over 100M rows/day → 1 hour–1 day; 1–10M rows/day → 1 day; low volume → 1 week or longer.
  Default 7 days. `set_chunk_time_interval` affects only new chunks.
  - The guide also says the active chunk plus its indexes should fit in memory; official guidance is about 25% of memory.
- **Deployment:**
  - Docker image `timescale/timescaledb-ha:pg18`.
  - Helm chart `timescale/timescaledb-single` with Patroni and pgBackRest. **Verify:** that chart is believed deprecated/archived.
  - `timescaledb-tune`.
- **Tuning:**
  - `work_mem` is per operation per connection (example: 200 connections × 2 sorts × 64 MB ≈ 25 GB).
  - Batch inserts with multi-row INSERT or COPY. Use PgBouncer. Monitor before tuning (compression jobs, cagg refreshes,
    WAL, background workers).

## Databricks, "What is pgvector?" (2026)
- **Overview:** vector type, embeddings stored with relational data, query embedding → nearest by distance. Metrics described:
  L2, "cosine similarity", inner product.
  - **ERROR:** "Jaccard distance supports sparse vectors". Jaccard (`<%>`) is for `bit` vectors only.
  - **IMPRECISE:** "cosine similarity" as the metric. pgvector's `<=>` is cosine *distance*; similarity = 1 − distance.
  - **IMPRECISE:** "HNSW builds a graph structure in memory". The index is stored on disk like any index; it is built faster
    when it fits in `maintenance_work_mem`, and query speed depends on it being cached.
- **Index trade-off:** HNSW is faster at query time but uses more memory; IVFFlat is more memory-efficient, needs a training step
  (k-means), and can be slower.
- **Features:** filtered search (in stock, price range, category); hybrid search with full-text; halfvec, sparsevec and bit to
  save memory.
- **Use cases:** semantic search and RAG, recommendations, image similarity, anomaly detection (distant points), near-duplicate
  detection.
- **Comparison table (vendor opinion):** pgvector has the lowest operational complexity and the best hybrid/SQL joins, with a
  "~100M+" ceiling (vague). Pinecone, Weaviate and Qdrant are dedicated systems. pgvectorscale is an intermediate step.
- **Limitations:** degradation at 10M+ without tuning; HNSW is memory-hungry; no built-in sharding for vectors; recall vs speed
  needs deliberate tuning. Available on RDS, Supabase, Azure, Cloud SQL and Neon.
- **FAQ:** "millions to tens of millions of vectors depending on hardware".
