# pgvector

Vector similarity search inside PostgreSQL. **Current release: 0.8.7 (2026-10-01).** PGlite 0.5.16 (PostgreSQL 18.6)
ships exactly **0.8.7** via `@electric-sql/pglite-pgvector` 0.0.17 (verified: `select extversion from pg_extension` → `0.8.7`;
`pg_available_extensions.default_version` → `0.8.7`). Extension comment: "vector data type and ivfflat and hnsw access methods".
The extension name is `vector`, not `pgvector`. Licence: PostgreSQL Licence (the BSD/MIT-style licence of PostgreSQL itself;
LICENSE file reads "Portions Copyright (c) 1996-2026, PostgreSQL Global Development Group ...").

Notation in this file: **[README]** = official pgvector README (primary), **[CL]** = official CHANGELOG (primary),
**[SRC]** = pgvector source headers (primary), **[PGlite]** = verified by running SQL in PGlite 0.5.16 / pgvector 0.8.7,
**[blog]** = secondary.

---

## Sources read

| # | URL | Contributed | Kind |
|---|-----|-------------|------|
| 1 | https://github.com/pgvector/pgvector (rendered page, in `pages/github.com__pgvector__pgvector.txt`) | Whole feature set: types, operators, functions, HNSW/IVFFlat options, GUCs, filtering, iterative scans, quantization, hybrid search, performance, FAQ, troubleshooting, install | primary |
| 2 | https://raw.githubusercontent.com/pgvector/pgvector/master/README.md (fetched 2026-11-14) | Confirmed the rendered page matches master; install pins `v0.8.7`; "supports Postgres 13+" | primary |
| 3 | https://raw.githubusercontent.com/pgvector/pgvector/master/CHANGELOG.md | Full version history 0.1.0 → 0.8.7 and unreleased 0.9.0 | primary |
| 4 | https://raw.githubusercontent.com/pgvector/pgvector/master/src/hnsw.h and `src/ivfflat.h` | Exact min/max/default constants for m, ef_construction, ef_search, lists, probes, max dims | primary |
| 5 | https://raw.githubusercontent.com/pgvector/pgvector/master/LICENSE | Licence | primary |
| 6 | https://raw.githubusercontent.com/pgvector/pgvector-python/master/examples/hybrid_search/rrf.py | The official Reciprocal Rank Fusion SQL (k = 60) | primary (official example repo) |
| 7 | https://neon.com/docs/extensions/pgvector (`pages/neon.com__docs__extensions__pgvector.txt`) | Provider view: per-database install, `CREATE EXTENSION vector VERSION '0.7.4'`, maintenance_work_mem sizing advice (≤ 50–60% of RAM), 0.5.1 → 0.7.0 behaviour differences (NULL ordering), pre-0.7.0 Hamming via `bit_count(a # b)` | secondary (vendor docs) |
| 8 | https://severalnines.com/blog/vector-similarity-search-with-postgresqls-pgvector-a-deep-dive/ | Conceptual intro, use cases; contains outdated/incorrect claims (see Contradictions) | secondary |
| 9 | https://www.geeksforgeeks.org/data-science/pgvector/ | Beginner walkthrough (build from source, psycopg2 + `register_vector`), comparison table vs FAISS/Chroma/Milvus | secondary |
| 10 | https://www.databricks.com/blog/what-is-pgvector (WebFetch, summary only) | Qualitative positioning; internally inconsistent scale numbers; no versions/limits | secondary |
| 11 | https://supabase.com/blog/pgvector-0-7-0 (WebFetch) | 0.7.0 halfvec benchmark table (900K × 1536-d) | secondary (vendor) |
| 12 | https://jkatz05.com/post/postgres/pgvector-scalar-binary-quantization/ (WebFetch) | Most rigorous public benchmark of vector vs halfvec vs bit (ANN-Benchmarks, 3 datasets) | secondary (written by a pgvector contributor) |
| – | medium.com "All you need to know about pgvector part 1" | **Not read** — bot wall (`pages/medium.com__...txt` is a 258-char "Just a moment..." stub). Skipped per instructions. | – |

PGlite verification scripts (all run, output captured): `scratchpad/pgvt/t1.sql` … `t9.sql`, runner `scratchpad/pgvt/run.mjs`
(run from `/Users/vivek-14286/postgres-internals/app` as `SQLF=<file> node --input-type=module < run.mjs`).

---

## Core concepts

### 1. What pgvector is
- An extension that adds vector **types** (`vector`, `halfvec`, `sparsevec`; plus index/distance support for the built-in `bit`),
  **distance operators**, **functions/aggregates**, and two **index access methods** (`hnsw`, `ivfflat`; `pg_am.amtype = 'i'`). [README][PGlite]
- "Store your vectors with the rest of your data": ACID, PITR, JOINs, replication (pgvector uses WAL, so streaming
  replication and PITR work). [README FAQ]
- Install once per database: `CREATE EXTENSION vector;` (Neon: "installed per database, not per project"). [README][Neon]
- Upgrade: install new binaries, then in each database `ALTER EXTENSION vector UPDATE;`. Check with
  `SELECT extversion FROM pg_extension WHERE extname = 'vector';`. [README] `pg_extension_update_paths('vector')` shows a
  chained path `0.1.0--0.1.1--…--0.8.6--0.8.7`. [PGlite]
- Supported servers: 0.8.x supports **Postgres 13+** [README]; 0.8.0 dropped PG 12 [CL]; unreleased 0.9.0 drops PG 13 and 14 [CL].

### 2. Exact vs approximate search
- **Default = exact nearest-neighbour search** (sequential scan + top-N sort) → "perfect recall". [README]
- Adding an HNSW/IVFFlat index makes the planner use **approximate** nearest-neighbour (ANN) search: "trades some recall
  for speed. Unlike typical indexes, you will see different results for queries after adding an approximate index." [README]
- An index is used only when the query has **`ORDER BY <distance operator expression> ASC` and `LIMIT`**. The ORDER BY must be
  the raw operator result, not an expression: `ORDER BY embedding <=> q LIMIT 5` uses the index; `ORDER BY 1 - (embedding <=> q) DESC LIMIT 5` does not. [README][PGlite: verified both, plus `DESC` and no-`LIMIT` → Seq Scan + Sort]
- A distance predicate alone (`WHERE embedding <-> q < 5`) does **not** use the index (verified: Seq Scan + Filter). Combine
  with ORDER BY + LIMIT, or use the materialized-CTE pattern (§9). [README][PGlite]
- `<#>` returns the **negative** inner product "since Postgres only supports ASC order index scans on operators". [README]
- Exact search plan in PGlite (20 000 × 32-d): `Sort (top-N heapsort, Memory: 17kB) → Seq Scan`, 427 buffers, ~5 ms;
  with HNSW: `Index Scan using i_hnsw … Order By: (embedding <-> …) / Index Searches: 1`, ~0.7 ms. [PGlite]
- For recall testing compare with exact search: `BEGIN; SET LOCAL enable_indexscan = off; SELECT …; COMMIT;` (verified:
  produces Seq Scan + Sort). [README][PGlite]

### 3. Types and limits

| Type | Element | Storage (bytes) | Max (storage) | Max for HNSW index | Max for IVFFlat index | Since |
|------|---------|-----------------|---------------|--------------------|-----------------------|-------|
| `vector(n)` | float4 (like `real`) | `4*dims + 8` | 16,000 dims | 2,000 dims | 2,000 dims | 0.1.0 (index max raised 1024→2000 and storage max 1024→16000 in 0.4.0) |
| `halfvec(n)` | float16 | `2*dims + 8` | 16,000 dims | 4,000 dims | 4,000 dims | 0.7.0 |
| `bit(n)` (core PG type) | 1 bit | `dims/8 + 8` | PG limit | 64,000 dims | 64,000 dims | indexing since 0.7.0 |
| `sparsevec(n)` | float4, stored as (index,value) | `8*nnz + 16` | 16,000 **non-zero** elements | 1,000 non-zero elements | **not supported** | 0.7.0 |

[README; SRC `HNSW_MAX_DIM 2000`, `HNSW_MAX_NNZ 1000`, `IVFFLAT_MAX_DIM 2000`]

Why these numbers: an index tuple must fit in one 8 KB page. 2000×4+8 = 4000×2+8 = 64000/8+8 = **8008 bytes** — the same
ceiling for all three. (Inference from `HNSW_MAX_SIZE = BLCKSZ - page header - opaque - ItemId` in `hnsw.h`; good teaching point.)

Verified in PGlite:
- `pg_column_size('[1,2,3]'::vector)` = 20; `halfvec` = 14; 1536-d `vector` = 6152, `halfvec` = 3080;
  `'{1:1,3:2,5:3}/5'::sparsevec` = 40; `bit(1536)` = 200. All match the formulas.
- `vector` with 16 001 dims → `ERROR: vector cannot have more than 16000 dimensions`; same for halfvec.
- HNSW on `vector(2001)` → `ERROR: column cannot have more than 2000 dimensions for hnsw index`; `halfvec(4001)` → "…4000…";
  `bit(64001)` → "…64000…".
- HNSW on untyped `vector` column → `ERROR: column does not have dimensions` (needs `vector(n)` or an expression cast).
- sparsevec HNSW: inserting 1001 non-zeros → `ERROR: sparsevec cannot have more than 1000 non-zero elements for hnsw index`
  (checked at insert time, because the column typmod is dims, not nnz).
- `vector(3000)` column: direct HNSW fails, but expression indexes `(e::halfvec(3000)) halfvec_cosine_ops` and
  `(binary_quantize(e)::bit(3000)) bit_hamming_ops` both succeed.
- Storage: all three types have `typstorage = 'e'` (EXTERNAL: TOAST-able out of line, **not compressed**). Changed from
  `plain`→`extended` in 0.4.0 and `extended`→`external` in 0.6.0. [CL][PGlite]

Literal formats:
- vector/halfvec: `'[1,2,3]'`. Output uses shortest float repr: `'[1.0001,2.123456789]'::vector` → `[1.0001,2.1234567]`. [PGlite]
- halfvec precision: `'[1.0001,2.123456789,65504]'::halfvec` → `[1,2.1230469,65504]`; `65520` → `ERROR: "65520" is out of range for type halfvec` (float16 max = 65504). [PGlite]
- sparsevec: `'{index1:value1,index2:value2}/dimensions'`, **1-based** indices "like SQL arrays". Unsorted input is
  normalised (`'{3:1,1:2}/5'` → `{1:2,3:1}/5`), explicit zeros dropped (`'{1:0,2:1}/5'` → `{2:1}/5`), index 0 →
  `ERROR: sparsevec index out of bounds`. `'[1,2,3]'::sparsevec` is invalid syntax. [README][PGlite]
- bit: `'101'` or `B'101'`.
- All elements must be finite: `'[1,NaN]'` → `ERROR: NaN not allowed in vector`; `'[4e38,1]'` → `ERROR: "4e38" is out of range for type vector`. [README][PGlite][Neon]
- Typmod mismatch: `'[1,2]'::vector(3)` → `ERROR: expected 3 dimensions, not 2`. Distance between different dims →
  `ERROR: different vector dimensions 2 and 3`. Comparison operators (`<`, `=`) **do** accept different dims since 0.7.0. [CL][PGlite]

Variable dimensions in one column: declare `vector` (no n); you can only index rows of one dimension via expression +
partial index: `CREATE INDEX ON embeddings USING hnsw ((embedding::vector(3)) vector_l2_ops) WHERE (model_id = 123);`
and query with the same cast. [README FAQ]

More precision: store `double precision[]` or `numeric[]`, add `CHECK (vector_dims(embedding::vector) = 3)`, and index
`((embedding::vector(3)) vector_l2_ops)`. [README FAQ]

### 4. Distance operators

| Op | Meaning | Types | Index opclass suffix |
|----|---------|-------|---------------------|
| `<->` | L2 / Euclidean distance | vector, halfvec, sparsevec | `_l2_ops` |
| `<#>` | **negative** inner product | vector, halfvec, sparsevec | `_ip_ops` |
| `<=>` | cosine distance (= 1 − cosine similarity, range 0..2) | vector, halfvec, sparsevec | `_cosine_ops` |
| `<+>` | L1 / taxicab / Manhattan distance (0.7.0) | vector, halfvec, sparsevec | `_l1_ops` (HNSW only) |
| `<~>` | Hamming distance (0.7.0) | bit | `bit_hamming_ops` |
| `<%>` | Jaccard distance (0.7.0) | bit | `bit_jaccard_ops` (HNSW only) |

All return `double precision`. [README][PGlite: pg_operator]

Verified values for `a='[1,2,3]'`, `b='[3,1,2]'`: `<->` 2.449489742783178, `<#>` −11, `<=>` 0.2142857142857143,
`<+>` 4. `'101'::bit(3) <~> '111'` = 1, `<%>` = 0.333…. `'[1,1]' <=> '[2,2]'` = 0 (same direction);
`'[1,0]' <=> '[-1,0]'` = 2. **Zero vector cosine:** `'[0,0]' <=> '[1,1]'` = **NaN**. [PGlite]

Converting to similarities: inner product = `(a <#> b) * -1`; cosine similarity = `1 - (a <=> b)`. [README]

For unit-length vectors (e.g. OpenAI embeddings) inner product, cosine and L2 give the same ranking; README: "If vectors
are normalized to length 1 (like OpenAI embeddings), use inner product for best performance." Verified:
`l2_normalize(a) <#> l2_normalize(b)` = −0.7857 = −(1 − 0.2143). [README][PGlite]

### 5. HNSW (Hierarchical Navigable Small World)
- Multilayer proximity graph. "Better query performance than IVFFlat (in terms of speed-recall tradeoff), but has slower
  build times and uses more memory. Also, an index can be created without any data in the table since there isn't a
  training step like IVFFlat." [README] Added in 0.5.0 (2023-08-28). [CL]
- Syntax: `CREATE INDEX ON items USING hnsw (embedding vector_l2_ops) WITH (m = 16, ef_construction = 64);`
- **No default opclass** — `USING hnsw (e)` → `ERROR: data type vector has no default operator class for access method "hnsw"`. One index per distance function you query with. [README][PGlite]

Build options (reloptions; verified bounds in PGlite, constants in hnsw.h):

| Option | Default | Range | Meaning |
|--------|---------|-------|---------|
| `m` | 16 | 2–100 | max connections per node per layer |
| `ef_construction` | 64 | 4–1000, and **must be ≥ 2·m** | size of the dynamic candidate list while building |

Errors: `value 1 out of bounds for option "m"`, `value 3 out of bounds for option "ef_construction"`,
`ef_construction must be greater than or equal to 2 * m`. "A higher value of ef_construction provides better recall at the
cost of index build time / insert speed." "Use the defaults unless seeing low recall." [README][PGlite]

Query GUC: **`hnsw.ef_search`** default **40**, range 1–1000 (`SET hnsw.ef_search = 1001` →
`ERROR: 1001 is outside the valid range for parameter "hnsw.ef_search" (1 .. 1000)`). Higher = better recall, slower.
Use `SET LOCAL` in a transaction for one query. [README][PGlite]

**ef_search caps the number of rows an HNSW scan can return** (without iterative scan): verified
`SELECT … ORDER BY embedding <-> q LIMIT 100` returned **40 rows** with default ef_search; 100 rows with `ef_search = 200`. [PGlite]
README Troubleshooting: "Results are limited by the size of the dynamic candidate list (hnsw.ef_search)… There may be even
less results due to dead tuples or filtering conditions."

Build memory & speed:
- "Indexes build significantly faster when the graph fits into `maintenance_work_mem`". When it doesn't:
  `NOTICE: hnsw graph no longer fits into maintenance_work_mem after 100000 tuples` / `DETAIL: Building will take significantly more time.` / `HINT: Increase maintenance_work_mem to speed up builds.` [README]
  Verified in PGlite with `SET maintenance_work_mem = '1MB'` on 10 000 × 64-d: `NOTICE: hnsw graph no longer fits into maintenance_work_mem after 1273 tuples`. PGlite default `maintenance_work_mem` = 64MB.
- "Do not set maintenance_work_mem so high that it exhausts the memory on the server." Neon: ≤ 50–60% of RAM
  (10 GB tested on 28 GB). Docker: `--shm-size` must be ≥ maintenance_work_mem "to avoid an error with parallel HNSW index builds". [README][Neon]
- **Parallel builds** (HNSW since 0.6.0; IVFFlat since 0.5.0): `SET max_parallel_maintenance_workers = 7; -- plus leader`
  (default 2); may need to raise `max_parallel_workers` (default 8). [README][CL]
  **PGlite: `max_parallel_maintenance_workers` = 0 and `max_parallel_workers` = 0** — single process, no parallel builds. [PGlite]
- "Like other index types, it's faster to create an index after loading your initial data." [README]
- Progress: `SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;`
  HNSW phases: `initializing`, `loading tuples`. [README] (Can't be observed in PGlite: single backend, build blocks.)
- Build time observed in PGlite (WASM, single thread): 20 000 × 32-d ≈ 2.9 s; 10 000 × 16-d ≈ 2 s. [PGlite]

Internals visible in catalogs [PGlite: pg_amproc]: HNSW `vector_l2_ops` uses `vector_l2_squared_distance` (support #1 —
squared distance internally, no sqrt); `vector_cosine_ops` uses `vector_negative_inner_product` (#1) + `vector_norm` (#2,
normalisation) — i.e. cosine is implemented as inner product on normalised vectors, which is why **zero vectors are not
indexed for cosine** (can't be normalised). halfvec/sparsevec/bit opclasses also register a type support function (#3).

### 6. IVFFlat (Inverted File, flat)
- "Divides vectors into lists, and then searches a subset of those lists that are closest to the query vector. It has
  faster build times and uses less memory than HNSW, but has lower query performance (in terms of speed-recall tradeoff)." [README]
- Build = k-means on a sample to find `lists` centroids, then assign every row to its nearest centroid. Build phases:
  `initializing`, `performing k-means`, `assigning tuples`, `loading tuples` (progress % only populated during loading tuples;
  use `tuples_done / tuples_total`). [README]
- **Three keys to good recall** [README]:
  1. Create the index **after the table has some data** (centroids come from existing rows).
  2. `lists`: start with **rows / 1000** for up to 1M rows and **sqrt(rows)** for over 1M rows.
  3. `ivfflat.probes`: start with **sqrt(lists)**.
- Syntax: `CREATE INDEX ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);`
- `lists` default **100**, range **1–32768** (`lists = 0` / `32769` → out of bounds). [SRC][PGlite]
- Building on an empty/small table: `NOTICE: ivfflat index created with little data` (added 0.4.2; verified). Rows inserted
  later go into the stale lists → poor recall. FAQ fix: "Drop the index until the table has more data." [README][CL][PGlite]
- Query GUC `ivfflat.probes` default **1**, range 1–32768. "Can be set to the number of lists for exact nearest neighbor search
  (at which point the planner won't use the index)" — verified: `lists=100, probes=100` → plan switches to Seq Scan + Sort. [README][PGlite]
- Opclasses: `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `halfvec_l2_ops`, `halfvec_ip_ops`, `halfvec_cosine_ops`,
  `bit_hamming_ops`. **No L1, no Jaccard, no sparsevec** for IVFFlat (all verified as `operator class … does not exist for access method "ivfflat"`). [PGlite]
- "To speed up queries with an IVFFlat index, increase the number of inverted lists (at the expense of recall)." [README]

### 7. HNSW vs IVFFlat (decision table)

| | HNSW | IVFFlat |
|---|---|---|
| Speed/recall trade-off | better | worse |
| Build time | slower | faster |
| Memory / size | more | less |
| Needs data before build | no | **yes** (k-means training) |
| Degrades as data changes | no (graph updated on insert) | yes, centroids go stale → rebuild |
| Types | vector, halfvec, bit, sparsevec | vector, halfvec, bit |
| Distances | L2, IP, cosine, L1, Hamming, Jaccard | L2, IP, cosine, Hamming |
| Query knob | `hnsw.ef_search` (40) | `ivfflat.probes` (1) |
| Iterative scan modes | `strict_order`, `relaxed_order` | `relaxed_order` only |
| Iterative stop | `hnsw.max_scan_tuples` (20000), `hnsw.scan_mem_multiplier` (1) | `ivfflat.max_probes` (32768) |

PGlite sizes for 10 000 × 64-d (heap 2968 kB): HNSW m=16 5592 kB; HNSW m=4 4120 kB; HNSW on `halfvec(64)` 4256 kB;
HNSW on `binary_quantize()::bit(64)` 3032 kB; IVFFlat lists=100 3184 kB. 10 000 × 16-d (heap 1072 kB): HNSW 3616 kB.
20 000 × 32-d: HNSW 8496 kB, halfvec-HNSW 7224 kB, bit-HNSW 2488 kB. At low dimensions the neighbour lists dominate HNSW size,
so halfvec saves little; the saving approaches 2× only as dims grow (jkatz: 1.45× at 128-d, 2.0× at 1536-d). [PGlite][blog]

### 8. Filtering and the post-filtering recall problem
`SELECT * FROM items WHERE category_id = 123 ORDER BY embedding <-> '[3,1,2]' LIMIT 5;` [README] Options, in the README's order:
1. **B-tree (or other) index on the filter column** → exact search on the matching subset. "Exact indexes work well for
   conditions that match a low percentage of rows." Multicolumn: `CREATE INDEX ON items (location_id, category_id);`
2. **Approximate index** — but "filtering is applied *after* the index is scanned. If a condition matches 10% of rows, with
   HNSW and the default hnsw.ef_search of 40, only 4 rows will match on average."
3. **Iterative index scans** (0.8.0+): `SET hnsw.iterative_scan = strict_order;`
4. **Partial index** if few distinct values: `CREATE INDEX ON items USING hnsw (embedding vector_l2_ops) WHERE (category_id = 123);`
5. **Partitioning** if many values: `CREATE TABLE items (embedding vector(3), category_id int) PARTITION BY LIST(category_id);`

**Multitenancy:** "sharing an approximate index between tenants means vectors from one tenant can affect recall (and speed)
for other tenants. For tenant isolation, use list partitioning or separate tables." [README]

PGlite measurements (20 000 × 32-d clustered data, 30 queries, recall@10 vs exact filtered ground truth):

| Scenario (filter `category_id = 3`, 9.8% selectivity, independent of clusters) | rows returned (avg of LIMIT 10) | recall@10 |
|---|---|---|
| HNSW, ef_search 40, iterative off | **4.0** (exactly the README's "only 4 rows") | 0.40 |
| HNSW, ef_search 200, iterative off | 10 | 0.997 |
| HNSW, `iterative_scan = strict_order` | 10 | 0.997 |
| HNSW, `iterative_scan = relaxed_order` | 10 | 0.997 |

| Scenario: filter **anti-correlated** with query (matching rows live in other clusters) | rows | recall@10 |
|---|---|---|
| HNSW, iterative off | 1.0 | 0.10 |
| HNSW, strict_order | 10 | 0.36 |
| HNSW, relaxed_order | 10 | 0.79 |
| IVFFlat lists=20 probes=1, iterative off | 3.0 | 0.22 |
| IVFFlat relaxed_order | 10 | 0.45 |

Lessons: post-filtering loses rows; iterative scans fix *row count* but when the filter is correlated against the query,
recall can still be poor and `relaxed_order` beats `strict_order` (consistent with README: relaxed "provides better recall").
For such filters, an exact B-tree path, partial index, or partitioning is the right tool.

Planner (0.8.0 "Improved cost estimation for better index selection when filtering" [CL]): verified that with a 0.1%
selective filter (`category_id = 99`, 20 rows) the planner chose **Seq Scan + Sort** even without a B-tree, and with a B-tree it
chose **Bitmap Index Scan → Sort** (exact); for the 10% filter it kept the HNSW index scan with `Filter:`. [PGlite]
`EXPLAIN ANALYZE` shows `Rows Removed by Filter: 129` / `Index Searches: 1` on the HNSW node. [PGlite]

### 9. Iterative index scans (0.8.0+)
"Automatically scan more of the index until enough results are found (or it reaches `hnsw.max_scan_tuples` or
`ivfflat.max_probes`)." [README]
- `hnsw.iterative_scan` enum: `off` (default), `relaxed_order`, `strict_order`. `'on'` is invalid. [PGlite]
- `ivfflat.iterative_scan` enum: `off` (default), `relaxed_order` only — `strict_order` → `ERROR: invalid value for parameter "ivfflat.iterative_scan": "strict_order"`. [PGlite]
- **Strict**: results in exact distance order. **Relaxed**: "slightly out of order by distance, but provides better recall".
- Re-establishing strict order after relaxed scan — materialized CTE:
  ```sql
  WITH relaxed_results AS MATERIALIZED (
      SELECT id, embedding <-> '[1,2,3]' AS distance FROM items WHERE category_id = 123 ORDER BY distance LIMIT 5
  ) SELECT * FROM relaxed_results ORDER BY distance + 0;
  ```
  "Note: `+ 0` is needed for Postgres 17+" (otherwise the planner treats the outer sort as already satisfied). [README]
- Distance threshold queries — put the distance filter **outside** a materialized CTE ("due to the current behavior of the
  Postgres executor"), other filters inside:
  ```sql
  WITH nearest_results AS MATERIALIZED (
      SELECT id, embedding <-> '[1,2,3]' AS distance FROM items ORDER BY distance LIMIT 5
  ) SELECT * FROM nearest_results WHERE distance < 5 ORDER BY distance;
  ```
- Stop conditions:
  - `hnsw.max_scan_tuples` default **20000** (range 1–2147483647). "Approximate and does not affect the initial scan."
  - `hnsw.scan_mem_multiplier` default **1** (real, 1–1000): max memory as a multiple of `work_mem`; "Try increasing this if
    increasing hnsw.max_scan_tuples does not improve recall".
  - `ivfflat.max_probes` default **32768** (range 1–32768); "If this is lower than ivfflat.probes, ivfflat.probes will be used".
- Verified cost: forcing HNSW for a 0.1% filter with relaxed iterative scan returned 10 rows but `Rows Removed by Filter: 10334`
  and **37 242 buffer hits** vs 427 for a seq scan — iterative scan over a very selective filter can be far worse than exact.
  With `hnsw.max_scan_tuples = 1000` the same query returned **0 rows**. [PGlite]

### 10. Quantization and reduced precision
- **halfvec storage**: `CREATE TABLE items (id bigserial PRIMARY KEY, embedding halfvec(3));` — "Use the halfvec type instead
  of vector for a smaller working set." [README]
- **Half-precision indexing** (keep `vector` in the table, index at half precision):
  `CREATE INDEX ON items USING hnsw ((embedding::halfvec(3)) halfvec_l2_ops);`
  query: `SELECT * FROM items ORDER BY embedding::halfvec(3) <-> '[1,2,3]' LIMIT 5;` — the query expression **must match the
  index expression** (verified plan uses `i_hnsw_half`). Indexes up to 4000 dims. [README][PGlite]
- **Binary quantization** (`binary_quantize(vector|halfvec) → bit`, 0.7.0): each element > 0 → 1, else 0
  (`binary_quantize('[1,-2,0,3]')` = `1001`; note 0 → 0). [PGlite]
  ```sql
  CREATE INDEX ON items USING hnsw ((binary_quantize(embedding)::bit(3)) bit_hamming_ops);
  SELECT * FROM items ORDER BY binary_quantize(embedding)::bit(3) <~> binary_quantize('[1,-2,3]') LIMIT 5;
  -- re-rank by the original vectors for better recall
  SELECT * FROM (
      SELECT * FROM items ORDER BY binary_quantize(embedding)::bit(3) <~> binary_quantize('[1,-2,3]') LIMIT 20
  ) ORDER BY embedding <=> '[1,-2,3]' LIMIT 5;
  ```
  [README] Indexes up to 64 000 dims; "for faster build times at scale", "to keep indexes in-memory at scale".
  PGlite (10 000 × 64-d uniform random): BQ-only recall@10 = 3/10, BQ top-200 (`ef_search = 200`) + exact re-rank = 9/10. Note
  the inner LIMIT (200) needs `hnsw.ef_search ≥ 200` or the HNSW scan returns only 40 candidates. [PGlite]
- **Subvector indexing** (Matryoshka-style models): `CREATE INDEX ON items USING hnsw ((subvector(embedding, 1, 3)::vector(3)) vector_cosine_ops);`
  query with the same expression, then re-rank by the full vector. `subvector(v, start, count)` is 1-based:
  `subvector('[1,2,3,4,5]', 2, 3)` = `[2,3,4]`. [README][PGlite]
- >2000-dim models (e.g. 3072-d): halfvec indexing (≤4000), binary quantization (≤64 000), subvectors, or dimensionality reduction. [README FAQ]

### 11. Sparse vectors
`CREATE TABLE items (id bigserial PRIMARY KEY, embedding sparsevec(5));`
`INSERT INTO items (embedding) VALUES ('{1:1,3:2,5:3}/5'), ('{1:4,3:5,5:6}/5');`
`SELECT * FROM items ORDER BY embedding <-> '{1:3,3:1,5:2}/5' LIMIT 5;` [README] Typical sources: SPLADE / learned-sparse
models, bag-of-words. HNSW only (≤1000 nnz). Casts: `array[1,0,2]::sparsevec` → `{1:1,3:2}/3` (array→sparsevec casts added
0.8.0); `'[0,1,0,2]'::vector::sparsevec` → `{2:1,4:2}/4`; `sparsevec::vector` → dense. [CL][PGlite]

### 12. Hybrid search (vector + full-text) and RRF
README: "Use together with Postgres full-text search for hybrid search" and "You can use Reciprocal Rank Fusion or a
cross-encoder to combine results."
```sql
SELECT id, content FROM items, plainto_tsquery('hello search') query
    WHERE textsearch @@ query ORDER BY ts_rank_cd(textsearch, query) DESC LIMIT 5;
```
Official RRF (pgvector-python `examples/hybrid_search/rrf.py`): score = Σ 1/(k + rank), **k = 60**, each branch takes top 20,
combined with FULL OUTER JOIN:
```sql
WITH semantic_search AS (
    SELECT id, RANK () OVER (ORDER BY embedding <=> %(embedding)s) AS rank
    FROM documents ORDER BY embedding <=> %(embedding)s LIMIT 20
),
keyword_search AS (
    SELECT id, RANK () OVER (ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC)
    FROM documents, plainto_tsquery('english', %(query)s) query
    WHERE to_tsvector('english', content) @@ query
    ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC LIMIT 20
)
SELECT COALESCE(semantic_search.id, keyword_search.id) AS id,
       COALESCE(1.0 / (%(k)s + semantic_search.rank), 0.0) +
       COALESCE(1.0 / (%(k)s + keyword_search.rank), 0.0) AS score
FROM semantic_search FULL OUTER JOIN keyword_search ON semantic_search.id = keyword_search.id
ORDER BY score DESC LIMIT 5;
```
(The example creates `CREATE INDEX ON documents USING GIN (to_tsvector('english', content))` and uses a 384-d
`multi-qa-MiniLM-L6-cos-v1` model.) Neon/Lakebase advertise a separate BM25 extension; that is not pgvector. Note
`ts_rank_cd` is not BM25. A runnable PGlite version is in the last section.

### 13. Embeddings workflow and RAG
- pgvector does **not** create embeddings; the application calls a model (OpenAI, sentence-transformers, …) and stores the
  float array. Client libraries exist for 30+ languages (pgvector-python, pgvector-node, pgvector-go, pgvector-java, …);
  you can write vectors in one language and query from another. Python: `from pgvector.psycopg import register_vector` (psycopg 3)
  or `pgvector.psycopg2` (GfG example). [README][GfG]
- Dimension must match the model: OpenAI `text-embedding-3-small` = 1536 dims by default [Neon]; MiniLM = 384 [rrf.py].
- Bulk load with `COPY items (embedding) FROM STDIN WITH (FORMAT BINARY);` (binary COPY added 0.1.1), index **after** loading. [README][CL]
- Upsert: `INSERT … ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding;` [README]
- RAG pattern: chunk documents → embed chunks → store `(doc_id, chunk_no, content, embedding)` → at question time embed the
  question → `ORDER BY embedding <=> $q LIMIT k` (optionally with metadata filters / hybrid RRF / re-ranking) → concatenate
  chunks into the LLM prompt. Severalnines/GfG mention RAG; the SQL side is just the KNN query. Changing the embedding
  model means re-embedding everything (vectors from different models aren't comparable) — store `model_id` (README FAQ pattern).
- Aggregates: `AVG(embedding)`, `SUM` (0.5.0), e.g. a centroid per category `SELECT category_id, AVG(embedding) FROM items GROUP BY category_id;`
  `avg` on zero rows returns NULL (0.8.7 fixed an error here). [README][CL][PGlite]

---

## Complete inventories

### Types
`vector`, `vector(n)`; `halfvec`, `halfvec(n)`; `sparsevec`, `sparsevec(n)`; core `bit(n)` (gets `<~>`, `<%>`, opclasses).
All three pgvector types: `typlen = -1`, `typstorage = 'e'`. [PGlite]

### Operators (from `pg_operator`, PGlite 0.8.7)

| Operator | vector | halfvec | sparsevec | bit | Result | Notes |
|---|---|---|---|---|---|---|
| `+` | ✓ | ✓ (0.7.0) | – | – | same type | element-wise add |
| `-` | ✓ | ✓ (0.7.0) | – | – | same type | element-wise subtract (0.6.1 fixed it being marked commutative) |
| `*` | ✓ (0.5.0) | ✓ (0.7.0) | – | – | same type | element-wise multiply |
| `\|\|` | ✓ (0.7.0) | ✓ (0.7.0) | – | (core bitcat) | same type | concatenate: `'[1,2]' \|\| '[3,4]'` = `[1,2,3,4]` |
| `<->` | ✓ | ✓ | ✓ | – | float8 | L2 (`l2_distance`) |
| `<#>` | ✓ | ✓ | ✓ | – | float8 | negative inner product (`*_negative_inner_product`) |
| `<=>` | ✓ | ✓ | ✓ | – | float8 | cosine distance (`cosine_distance`) |
| `<+>` | ✓ (0.7.0) | ✓ | ✓ | – | float8 | L1 (`l1_distance`) |
| `<~>` | – | – | – | ✓ (0.7.0) | float8 | Hamming (`hamming_distance`) |
| `<%>` | – | – | – | ✓ (0.7.0) | float8 | Jaccard (`jaccard_distance`) |
| `< <= = <> >= >` | ✓ | ✓ | ✓ | core | bool | btree opclasses `vector_ops`, `halfvec_ops`, `sparsevec_ops` exist (so DISTINCT/ORDER BY/UNIQUE on vectors work) |

### Functions (user-facing; from `pg_proc`, PGlite)

| Function | Returns | Since | Notes |
|---|---|---|---|
| `l2_distance(vector\|halfvec\|sparsevec, same)` | float8 | – / 0.7.0 | = `<->` |
| `inner_product(…)` | float8 | – / 0.7.0 | **positive** inner product (operator is negative) |
| `cosine_distance(…)` | float8 | – / 0.7.0 | = `<=>` |
| `l1_distance(…)` | float8 | 0.5.0 / 0.7.0 | = `<+>` |
| `hamming_distance(bit, bit)` | float8 | 0.7.0 | `B'1010'` vs `B'1001'` = 2 |
| `jaccard_distance(bit, bit)` | float8 | 0.7.0 | same pair = 0.667 |
| `vector_dims(vector\|halfvec)` | int | – / 0.7.0 | **not for sparsevec in 0.8.7** (`ERROR: function vector_dims(sparsevec) does not exist`); added in unreleased 0.9.0 |
| `vector_norm(vector)` | float8 | – | Euclidean norm of a `vector` (`[3,4]` → 5) |
| `l2_norm(halfvec\|sparsevec)` | float8 | 0.7.0 | norm for the other types (no `l2_norm(vector)`) |
| `l2_normalize(vector\|halfvec\|sparsevec)` | same | 0.7.0 | `[3,4]` → `[0.6,0.8]` |
| `binary_quantize(vector\|halfvec)` | bit | 0.7.0 | >0 → 1 (performance improved 0.8.1) |
| `subvector(vector\|halfvec, start int, count int)` | same | 0.7.0 | 1-based |
| `array_to_vector / array_to_halfvec / array_to_sparsevec (int[]\|real[]\|float8[]\|numeric[], int typmod, bool)` | type | – | cast functions behind `::` |
| `vector_to_float4`, `halfvec_to_float4`, `vector_to_halfvec`, `vector_to_sparsevec`, `halfvec_to_vector`, `halfvec_to_sparsevec`, `sparsevec_to_vector`, `sparsevec_to_halfvec` | – | – | cast functions |
| internal: `vector_l2_squared_distance`, `vector_spherical_distance`, `*_negative_inner_product`, `*_add/_sub/_mul/_concat`, `*_avg` | – | – | used by opclasses / operators |

Aggregates: `avg(vector)`, `avg(halfvec)` (0.7.0), `sum(vector)` (0.5.0), `sum(halfvec)` (0.7.0).

### Casts (`pg_cast`, PGlite; a = assignment, i = implicit)
`int[]`, `real[]`, `double precision[]`, `numeric[]` → `vector` / `halfvec` / `sparsevec` (a).
`vector` → `real[]` (i), `vector` → `halfvec` (i), `vector` → `sparsevec` (i).
`halfvec` → `real[]`, `vector` (a); `halfvec` → `sparsevec` (i). `sparsevec` → `vector`, `halfvec` (a).
Consequence: `'[1,2,3]'::vector::halfvec <-> '[1,2,3]'::vector` resolves to the halfvec operator (implicit vector→halfvec).

### Operator classes (`pg_opclass`, PGlite)

| AM | vector | halfvec | sparsevec | bit |
|---|---|---|---|---|
| hnsw | `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops` | `halfvec_l2_ops`, `halfvec_ip_ops`, `halfvec_cosine_ops`, `halfvec_l1_ops` | `sparsevec_l2_ops`, `sparsevec_ip_ops`, `sparsevec_cosine_ops`, `sparsevec_l1_ops` | `bit_hamming_ops`, `bit_jaccard_ops` |
| ivfflat | `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops` | `halfvec_l2_ops`, `halfvec_ip_ops`, `halfvec_cosine_ops` | – | `bit_hamming_ops` |
| btree | `vector_ops` | `halfvec_ops` | `sparsevec_ops` | (core) |

Total: 14 HNSW + 7 IVFFlat opclasses. Each HNSW opclass has one **ordering** operator (strategy 1, `amoppurpose = 'o'`). [PGlite]

### Index options (reloptions)

| AM | Option | Default | Min | Max | Constraint |
|---|---|---|---|---|---|
| hnsw | `m` | 16 | 2 | 100 | |
| hnsw | `ef_construction` | 64 | 4 | 1000 | ≥ 2·m |
| ivfflat | `lists` | 100 | 1 | 32768 | |

`pg_class.reloptions` only stores explicitly given options (`["m=2","ef_construction=4"]`; NULL if defaulted). [PGlite]

### GUCs (`pg_settings`, PGlite 0.8.7 — all user-settable, `SET`/`SET LOCAL`)

| GUC | Type | Default | Range / values | Since |
|---|---|---|---|---|
| `hnsw.ef_search` | int | 40 | 1–1000 | 0.5.0 |
| `hnsw.iterative_scan` | enum | off | off, relaxed_order, strict_order | 0.8.0 |
| `hnsw.max_scan_tuples` | int | 20000 | 1–2147483647 | 0.8.0 |
| `hnsw.scan_mem_multiplier` | real | 1 | 1–1000 (× work_mem) | 0.8.0 |
| `ivfflat.probes` | int | 1 | 1–32768 | 0.1.0 |
| `ivfflat.iterative_scan` | enum | off | off, relaxed_order | 0.8.0 |
| `ivfflat.max_probes` | int | 32768 | 1–32768 | 0.8.0 |

Core GUCs that matter: `maintenance_work_mem` (HNSW build graph; IVFFlat build), `max_parallel_maintenance_workers` (2),
`max_parallel_workers` (8), `max_parallel_workers_per_gather` (exact-search parallel seq scan), `work_mem` (iterative scan
memory via multiplier), `shared_buffers` (~25% RAM per README), `enable_indexscan`/`enable_seqscan` (diagnostics),
`min_parallel_table_scan_size`, `parallel_setup_cost`.

### Catalog / monitoring views
`pg_extension` (extversion), `pg_available_extensions`, `pg_extension_update_paths('vector')`, `pg_am` (hnsw, ivfflat),
`pg_opclass`/`pg_amop`/`pg_amproc`, `pg_stat_progress_create_index` (phases above), `pg_stat_progress_vacuum`,
`pg_relation_size('index')`, `pg_stat_statements`, PgHero (README). `EXPLAIN` on PG 18 shows `Index Searches: N` on the
HNSW/IVFFlat node (0.8.2 fixed it for PG 18; verified `Index Searches: 1`).

### Version history (relevant entries, [CL])
- **0.1.0** 2021-04-20 first release (IVFFlat). 0.1.1 binary COPY, PARALLEL SAFE. 0.1.7 `numeric[]`→vector. 0.1.8 vector→`real[]`.
- 0.2.3 indexing progress; 0.2.4 parallel vacuum.
- 0.3.1 (2022-11-02): fixed IVFFlat silent corruption introduced in 0.2.7 — recreate ivfflat indexes if upgrading from 0.2.7/0.3.0.
- **0.4.0** 2023-01-11: max dims 1024→16000 (storage) and 1024→2000 (index); `avg`; storage plain→extended; Windows (experimental).
- 0.4.2 notice "ivfflat index created with little data".
- **0.5.0** 2023-08-28: **HNSW**; parallel IVFFlat builds; `l1_distance`; `*`; `sum`.
- **0.6.0** 2024-01-29: **parallel HNSW builds**; GUC validation; storage extended→**external**; reduced HNSW build memory/WAL; dropped PG 11. 0.6.2 reduced parallel-build lock contention.
- **0.7.0** 2024-04-29: **halfvec, sparsevec, bit indexing, HNSW L1, binary_quantize, hamming_distance, jaccard_distance, l2_normalize, subvector, `||`**, CPU dispatching (Linux x86-64), comparisons across dims.
- 0.7.1–0.7.4: on-disk HNSW build perf; 0.7.4 fixed locking for parallel HNSW builds.
- **0.8.0** 2024-10-30: **iterative index scans**; array→sparsevec casts; better filter cost estimation; faster HNSW scans/inserts/on-disk builds; dropped PG 12.
- 0.8.1 2025-09-04: PG 18 rc1 support; faster `binary_quantize`.
- 0.8.2 2026-02-25: fixed buffer overflow in parallel HNSW build; `Index Searches` in EXPLAIN for PG 18.
- 0.8.3 2026-06-17: **fixed possible index corruption with HNSW vacuuming**; Hamming/Jaccard perf regression on PG 18.
- 0.8.4 2026-06-30: fixed `hnsw graph not repaired` error with HNSW vacuuming; IVFFlat builds exceeding maintenance_work_mem.
- 0.8.5 2026-07-08, 0.8.6 2026-07-29 (IVFFlat fixes; array→sparsevec nnz limit), **0.8.7 2026-10-01**: fixed IVFFlat build buffer overflow; `avg` on no rows.
- **0.9.0 (unreleased)**: asynchronous I/O for indexes; vacuuming progress for indexes; `vector_dims(sparsevec)`; faster sparsevec HNSW inserts; drops PG 13 and 14.

---

## Beginner → advanced path

Each step lists the worked example (all tested in PGlite unless marked).

1. **What an embedding is & the `vector` type.** Literal syntax, typmod, dims errors, storage size.
   `CREATE EXTENSION vector; CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3)); INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');` Show `pg_column_size` = 4·d+8.
2. **Distances.** `<->`, `<#>`, `<=>`, `<+>` on 2-D/3-D toy vectors; similarity conversions; normalisation; zero-vector NaN for cosine. Visualise in 2-D.
3. **Exact KNN.** `SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;` + `EXPLAIN` (Seq Scan → top-N heapsort).
   KNN to a row: `WHERE id != 1 ORDER BY embedding <-> (SELECT embedding FROM items WHERE id = 1) LIMIT 5`.
4. **Vector arithmetic & aggregates.** `+ - * ||`, `avg` centroids per category, `l2_normalize`, `subvector`.
5. **HNSW index.** Create, `EXPLAIN` shows `Index Scan … Order By:`; the "why isn't my index used" rules (ORDER BY raw op, ASC, LIMIT; opclass must match operator — `vector_l2_ops` index ignored for `<=>`, verified).
6. **Recall.** Build ground truth with `SET LOCAL enable_indexscan = off`, measure recall@10; tune `hnsw.ef_search` (10/40/100 → 0.91/0.96/0.96 on our data); show ef_search capping row count (LIMIT 100 → 40 rows).
7. **HNSW build parameters.** `m`, `ef_construction`, size vs recall; `maintenance_work_mem` notice.
8. **IVFFlat.** lists/probes, build-after-data, `little data` notice, probes = lists → planner falls back to seq scan.
9. **Filtering.** B-tree exact path vs HNSW + Filter; the "4 rows" problem; iterative scans strict vs relaxed; partial indexes; partitioning; multitenancy.
10. **Other types.** halfvec (precision loss, 65504 max), sparsevec literal format, bit + Hamming/Jaccard.
11. **Quantization.** halfvec expression index; binary quantization + re-rank; subvector index + re-rank; index-size comparison.
12. **Hybrid search.** tsvector generated column + GIN, `ts_rank_cd`, RRF with k = 60.
13. **RAG.** chunks table, retrieval query, `string_agg` context assembly; model_id for multiple models.
14. **Operations.** CONCURRENTLY builds, VACUUM/REINDEX for HNSW, monitoring recall, sizing memory, replicas/sharding.

---

## Production patterns

### Sizing
- Raw vector bytes: `rows × (4·d + 8)`. 1M × 1536-d `vector` ≈ 6.15 GB heap (TOASTed out of line, uncompressed); halfvec ≈ 3.08 GB.
  Supabase: 900K × 1536-d table = 7 GB (vector) vs 3.5 GB (halfvec). [blog]
- HNSW index on vector data is larger than the raw vectors (stores vectors + neighbour lists). jkatz (m=16, ef_construction=256):
  sift-128 1M → 782 MB; gist-960 1M → 7,678 MB; dbpedia-1536 1M → 7,734 MB. [blog] In PGlite 10k × 64-d: heap 2968 kB, HNSW 5592 kB.
- "Do indexes need to fit into memory? No, but like other index types, you'll likely see better performance if they do."
  `SELECT pg_size_pretty(pg_relation_size('index_name'));` [README]
- Table limit: 32 TB non-partitioned by default; partitioned tables can have thousands of partitions. [README FAQ]

### Build
- Load data first (COPY BINARY), then `CREATE INDEX CONCURRENTLY` in production (avoids blocking writes; verified works in PGlite). [README]
- Raise `maintenance_work_mem` so the graph fits (watch for the NOTICE); keep ≤ ~50–60% RAM (Neon). Docker `--shm-size` ≥ maintenance_work_mem for parallel HNSW builds.
- `max_parallel_maintenance_workers` (default 2) up to cores−1; raise `max_parallel_workers` (8). AWS reported up to 30× faster loads vs 0.5.1 [blog: "load vector embeddings up to 67x faster" Aurora post — not isolated from other changes].
- Build time is dominated by ef_construction and m; "use the defaults unless seeing low recall".
- Binary quantization and halfvec indexes build faster (jkatz, ef_construction=256: dbpedia-1536 vector 377 s, halfvec 163 s (2.31×), bit 187 s (2.02×); gist-960 247 s / 147 s / 77 s). [blog]

### Query tuning
- HNSW: set `hnsw.ef_search` ≥ the LIMIT (else you get at most ef_search rows) and raise it for recall; per-query `SET LOCAL`.
- IVFFlat: probes ≈ sqrt(lists) to start; more lists = faster but lower recall.
- Normalised embeddings → use `<#>` / `vector_ip_ops` (cheapest). [README]
- Exact search speed: `SET max_parallel_workers_per_gather = 4;`. If the planner refuses a parallel scan because TOASTed vectors
  are not costed: `SET LOCAL min_parallel_table_scan_size = 1; SET LOCAL parallel_setup_cost = 1;` or
  `ALTER TABLE items ALTER COLUMN embedding SET STORAGE PLAIN;` (keep vectors inline). [README]
- Debug with `EXPLAIN (ANALYZE, BUFFERS)`. [README]
- Monitor recall in production by periodically comparing approximate with exact results. [README]

### Benchmarks (secondary; dataset- and hardware-dependent — teach as "measure your own")
jkatz, pgvector 0.7.0, PG 16.2, r7gd.16xlarge, HNSW m=16 [blog]:

| Dataset (1M) | ef_search | vector recall / QPS | halfvec recall / QPS | bit (no re-rank) recall | bit + re-rank recall / QPS |
|---|---|---|---|---|---|
| sift-128 | 40 | 95.4% / 1,020 | 95.4% / 1,097 | 2.42% | 4.19% / 971 |
| gist-960 | 40 | 78.0% / 513 | 78.1% / 579 | 0.00% | 0.00% |
| dbpedia-openai-1536 | 40 | 96.8% / 567 | 96.8% / 578 | 66.8% | 91.6% / 760 |
| dbpedia-openai-1536 | 200 | 99.6% / 156 | 99.6% / 163 | 68.3% | 99.0% / 222 |

Conclusions: halfvec is "a clear winner" (half the size, same recall, equal or better QPS) — store `vector`, index as
`halfvec`. Binary quantization works only for high-dimensional embeddings whose bits are informative (OpenAI 1536-d: yes;
SIFT/GIST: useless) and needs re-ranking. Supabase 900K × 1536-d: index 7734 MB → 3867 MB, build 264 s → 90 s, recall@ef40
0.945 both. [blog] The pgvector README itself publishes **no benchmark numbers**; it ships build flags
`-DHNSW_BENCH -DIVFFLAT_BENCH` and memory flags `-DHNSW_MEMORY -DIVFFLAT_MEMORY` for measuring. [README]

### Maintenance
- "Vacuuming can take a while for HNSW indexes. Speed it up by reindexing first": `REINDEX INDEX CONCURRENTLY index_name; VACUUM table_name;` [README]
  PGlite: after deleting 50% of 20 000 rows, HNSW stayed 8488 kB after VACUUM; `REINDEX INDEX CONCURRENTLY` → 4264 kB. [PGlite]
- Deleted/dead tuples reduce results returned by an HNSW scan (ef_search budget spent on dead entries). [README Troubleshooting]
- IVFFlat: rebuild when data distribution drifts or after large growth (centroids are fixed at build time). (Inference from the "create after data" rule.)
- Upgrade to ≥ 0.8.4 if you vacuum HNSW indexes (0.8.3 fixed possible corruption, 0.8.4 "hnsw graph not repaired"). [CL]

### Scaling
- Smaller working set: halfvec tables; binary-quantized indexes with re-ranking. Vertical scaling first. Horizontal:
  read replicas; sharding with Citus, PgDog, or others. [README] Multitenancy: list partitions per tenant.
- Hosted: preinstalled on most providers (Neon lets you pick one version back: `CREATE EXTENSION vector VERSION '0.7.4';`). [Neon]

---

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Query does a Seq Scan despite HNSW index | ORDER BY is an expression (`1 - (a <=> b)`), DESC, no LIMIT, opclass for a different operator, or the table is small | ORDER BY the raw operator ASC with LIMIT; create an index per operator; `SET LOCAL enable_seqscan = off` to test |
| Fewer rows than LIMIT (HNSW) | `hnsw.ef_search` (40) caps results; dead tuples; post-filtering | Raise ef_search ≥ LIMIT; enable `hnsw.iterative_scan`; VACUUM/REINDEX |
| Fewer rows than LIMIT (IVFFlat) | Index built with too little data; `ivfflat.probes` = 1 + filter | Drop and rebuild after loading; raise probes; `ivfflat.iterative_scan = relaxed_order` |
| `NOTICE: ivfflat index created with little data` | Built on empty/small table | Build after load; lists ≈ rows/1000 |
| Results change after adding an index | ANN is approximate — expected | Measure recall vs exact; tune ef_search/probes |
| Rows with NULL or zero vector never returned by index scan | NULLs not indexed; zero vectors not indexed for cosine (can't normalise) | Exclude/handle them; verified: index scan returned 2 of 4 rows |
| Filtered query returns garbage/few rows | Filter applied after ANN; correlated filter | B-tree on filter column, partial index, partitioning, iterative scan (prefer relaxed) |
| Iterative scan is slow / returns 0 rows | Very selective filter forces visiting many tuples; `hnsw.max_scan_tuples` hit | Let planner use B-tree exact path; partial index; raise `max_scan_tuples` / `scan_mem_multiplier` |
| Relaxed iterative results out of order | By design | Materialized CTE + `ORDER BY distance + 0` (PG 17+) |
| `ERROR: column cannot have more than 2000 dimensions for hnsw index` | 3072-d model | Index `(e::halfvec(3072)) halfvec_*_ops`, binary quantize, or subvector |
| `ERROR: column does not have dimensions` | Index on untyped `vector` column | Use `vector(n)` or expression cast + partial index per model |
| `ERROR: different vector dimensions 2 and 3` | Query vector length ≠ column | Check model / dims |
| `ERROR: NaN not allowed in vector` / out of range | Non-finite elements; halfvec > 65504 | Clean data; use vector for large magnitudes |
| Build extremely slow, NOTICE "hnsw graph no longer fits into maintenance_work_mem" | Graph spills to disk | Raise maintenance_work_mem (but not beyond RAM); parallel workers; binary quantization |
| Parallel HNSW build error in Docker | `/dev/shm` too small | `docker run --shm-size=…` ≥ maintenance_work_mem |
| `Illegal instruction` after copying binaries | Compiled with `-march=native` | `make OPTFLAGS=""` |
| Expression index not used | Query expression differs from index expression (e.g. missing `::halfvec(3)` or `::bit(3)`) | Write exactly the same expression in ORDER BY |
| Binary-quantized search has terrible recall | Low-dimensional / non-centred data; no re-rank | Re-rank top-N by original distance; raise ef_search ≥ inner LIMIT; only use for high-dim embeddings |
| Planner avoids parallel seq scan for exact search | TOAST not costed | `min_parallel_table_scan_size = 1`, `parallel_setup_cost = 1`, or `SET STORAGE PLAIN` |
| Recall of one tenant drops when another tenant grows | Shared ANN index | Partition per tenant / separate tables |
| Long HNSW VACUUM | Graph repair work | `REINDEX INDEX CONCURRENTLY` then VACUUM; be on ≥ 0.8.4 |

---

## Contradictions & version notes

- **Supported PG versions.** Severalnines: "pgvector only supports PostgreSQL version 12 and above" — outdated. Correct
  (README, 0.8.7): **Postgres 13+**; 0.8.0 dropped 12; 0.9.0 (unreleased) drops 13 and 14.
- **Cosine "similarity" operator.** Severalnines says `<=>` "computes the cosine similarity" and orders `… <=> q DESC` to get
  most-similar first. **Wrong**: `<=>` is cosine **distance** (README); ascending order gives most similar first, and DESC
  returns the *least* similar and cannot use an index. Similarity = `1 - (a <=> b)`.
- **Dimension limits.** Severalnines: "You can index vectors with up to 2,000 dimensions" — true only for `vector`; since 0.7.0
  halfvec indexes to 4000, bit to 64 000, sparsevec to 1000 nnz. Databricks says Jaccard is "for sparse vectors" — **wrong**,
  Jaccard (`<%>`) is for `bit` only.
- **Neon IVFFlat progress text** copies the HNSW phases ("The phases for HNSW are: initializing, loading tuples") under its
  IVFFlat section and uses `blocks_done`; README gives IVFFlat phases initializing / performing k-means / assigning tuples /
  loading tuples and the formula with `tuples_done / tuples_total`. README is correct.
- **Neon filtering** lists only B-tree, partial index, partitioning and predates iterative scans; README (0.8.0+) adds iterative scans.
- **Neon halfvec "98%" accuracy claim** for OpenAI embeddings is unsourced; jkatz/Supabase measured identical recall to vector on dbpedia-1536.
- **GfG** "Limited GPU acceleration: relies on CPU only" — accurate (no GPU path); "slower than dedicated vector DBs for billions" is opinion.
  Its comparison table says FAISS has "IVFFlat" — FAISS calls it IndexIVFFlat; fine.
- **Databricks scale numbers** are internally inconsistent ("millions to tens of millions", "~100M+", "degrade at 10M+"); no primary source gives a hard ceiling. Treat as marketing.
- **Distance between a vector and NULL**: ordering of `ORDER BY val <-> NULL::vector` through an index differs between 0.5.1 and 0.7.0 (Neon). Never rely on it; NULL distance is NULL.
- **Pre-0.7.0 Hamming**: `ORDER BY bit_count(embedding # '101')` (no index); 0.7.0+ use `<~>` with `bit_hamming_ops`. [Neon]
- **Storage**: plain (≤0.3) → extended (0.4.0) → external (0.6.0). Upgrading across 0.6.0 with PG 12 or Docker had special notes. [CL]
- **`vector_dims(sparsevec)`** doesn't exist in 0.8.7 (verified error) — arrives in 0.9.0.
- **`l2_norm` vs `vector_norm`**: README lists `vector_norm(vector)` and `l2_norm(halfvec|sparsevec)`; there is no `l2_norm(vector)` (verified catalog).
- **`ORDER BY distance + 0`** is required on PG 17+ for the materialized-CTE re-sort trick. [README]
- **PG 18 specifics**: 0.8.1 added PG 18 support; 0.8.2 fixed `Index Searches` in EXPLAIN; 0.8.3 fixed a Hamming/Jaccard regression on PG 18; 0.9.0 adds async I/O (PG 18 AIO) for indexes.
- **Lakebase Search** (`lakebase_vector`, `lakebase_text`) banner on the Neon page is a different product, not part of pgvector.
- **Licence**: PostgreSQL Licence (permissive). Databricks: "permissive open-source license (not named)" — consistent.
- **pgvectorscale** (Timescale) and Lakebase are separate extensions; out of scope.

---

## Lesson & visualizer ideas, and runnable PGlite SQL

### Visualizer ideas
1. **2-D distance playground**: drag a query point; show the ranking under L2, cosine, inner product and L1 side by side
   (live from `<->`, `<=>`, `<#>`, `<+>`); show cosine is magnitude-blind (`[1,1]` vs `[2,2]` → 0) and that negative IP sorts ASC.
2. **HNSW layer graph animation**: insert points one at a time (m, ef_construction sliders); search greedily from the top layer
   down; show the ef_search candidate list size and how LIMIT > ef_search truncates results (40-row cap).
3. **IVFFlat Voronoi view**: k-means centroids as cells; probes slider lights up cells; show a true neighbour sitting just across
   a cell boundary (recall loss at probes=1); "built on empty table" mode where all rows land in arbitrary lists.
4. **Post-filter funnel**: 40 candidates → 10% pass the filter → 4 rows; toggle iterative scan to keep pulling candidates;
   show strict vs relaxed ordering and the anti-correlated filter case (recall 0.36 vs 0.79).
5. **Quantization slider**: same vectors stored as float32 / float16 / 1 bit; show bytes per row (`4d+8`, `2d+8`, `d/8+8`),
   index size bars (5592 / 4256 / 3032 kB from PGlite), recall before/after re-rank.
6. **Recall meter**: every lesson query shows "approximate vs exact" overlap computed by running the query twice (second time
   with `SET LOCAL enable_indexscan = off`).
7. **Hybrid search RRF table**: two ranked lists, 1/(60+rank) contributions, final fused ranking.
8. **EXPLAIN diff**: before/after index; highlight `Order By:`, `Filter:`, `Rows Removed by Filter`, `Index Searches`, Buffers.

### Runnable SQL (all TESTED in PGlite 0.5.16 / pgvector 0.8.7 unless marked)

**A. Setup, types, sizes**
```sql
CREATE EXTENSION vector;
SELECT extversion FROM pg_extension WHERE extname = 'vector';            -- 0.8.7
SELECT pg_column_size('[1,2,3]'::vector) AS v3,                           -- 20
       pg_column_size('[1,2,3]'::halfvec) AS h3,                          -- 14
       pg_column_size(array_fill(1.0::real, array[1536])::vector) AS v1536,  -- 6152
       pg_column_size(array_fill(1.0::real, array[1536])::halfvec) AS h1536, -- 3080
       pg_column_size('{1:1,3:2,5:3}/5'::sparsevec) AS s3,                -- 40
       pg_column_size(repeat('1',1536)::bit(1536)) AS b1536;              -- 200
SELECT '[1.0001,2.123456789,65504]'::halfvec;                             -- [1,2.1230469,65504]
SELECT '{3:1,1:2}/5'::sparsevec, '[0,1,0,2]'::vector::sparsevec;          -- {1:2,3:1}/5 | {2:1,4:2}/4
```
Errors to demonstrate (each tested): `SELECT '[1,2]'::vector(3);` → expected 3 dimensions, not 2;
`SELECT '[1,2]'::vector <-> '[1,2,3]';` → different vector dimensions 2 and 3; `SELECT '[1,NaN]'::vector;` → NaN not allowed;
`SELECT '[65520]'::halfvec;` → out of range; `SELECT array_fill(1, array[16001])::vector;` → cannot have more than 16000 dimensions.

**B. Distances and functions**
```sql
SELECT '[1,2,3]'::vector <-> '[3,1,2]' AS l2,        -- 2.449489742783178
       '[1,2,3]'::vector <#> '[3,1,2]' AS neg_ip,    -- -11
       '[1,2,3]'::vector <=> '[3,1,2]' AS cos_dist,  -- 0.2142857142857143
       '[1,2,3]'::vector <+> '[3,1,2]' AS l1,        -- 4
       '101'::bit(3) <~> '111' AS hamming,           -- 1
       '101'::bit(3) <%> '111' AS jaccard;           -- 0.333...
SELECT inner_product('[1,2,3]'::vector,'[3,1,2]'),   -- 11 (positive)
       vector_norm('[3,4]'::vector),                 -- 5
       l2_normalize('[3,4]'::vector),                -- [0.6,0.8]
       subvector('[1,2,3,4,5]'::vector,2,3),         -- [2,3,4]
       binary_quantize('[1,-2,0,3]'::vector);        -- 1001
SELECT '[1,1]'::vector <=> '[2,2]' AS same_dir,      -- 0
       '[1,0]'::vector <=> '[-1,0]' AS opposite,     -- 2
       '[0,0]'::vector <=> '[1,1]' AS zero_vec;      -- NaN
SELECT '[1,2]'::vector + '[3,4]', '[1,2]'::vector - '[3,4]', '[1,2]'::vector * '[3,4]', '[1,2]'::vector || '[3,4]';
-- [4,6] | [-2,-2] | [3,8] | [1,2,3,4]
SELECT avg(v), sum(v) FROM (VALUES ('[1,2]'::vector), ('[3,4]')) t(v);  -- [2,3] | [4,6]
```

**C. Dataset generator (clustered, realistic recall) — used for D–G**
```sql
SELECT setseed(0.7);
CREATE TABLE centers AS
  SELECT cid, (SELECT array_agg(random()*2-1)::real[] FROM generate_series(1,32) WHERE cid >= 0) v
  FROM generate_series(0,49) cid;
CREATE TABLE items (id int PRIMARY KEY, category_id int, embedding vector(32));
INSERT INTO items
  SELECT i, (random()*9.999)::int % 10,
         (SELECT array_agg(c.v[j] + (random()-0.5)*0.6)::real[] FROM generate_series(1,32) j)::vector(32)
  FROM generate_series(1,20000) i JOIN centers c ON c.cid = (i*7) % 50;
CREATE TABLE queries AS
  SELECT qid, (SELECT array_agg(c.v[j] + (random()-0.5)*0.6)::real[] FROM generate_series(1,32) j)::vector(32) v
  FROM generate_series(1,30) qid JOIN centers c ON c.cid = (qid*13) % 50;
-- ground truth BEFORE creating any vector index (exact search)
CREATE TABLE truth AS SELECT qid, id FROM queries,
  LATERAL (SELECT id FROM items ORDER BY embedding <-> queries.v LIMIT 10) a;
CREATE VIEW recall AS
  SELECT avg(cnt)/10.0 AS recall_at_10, avg(n) AS avg_rows FROM queries q,
  LATERAL (SELECT count(*) n, count(*) FILTER (WHERE id IN (SELECT id FROM truth t WHERE t.qid = q.qid)) cnt
           FROM (SELECT id FROM items ORDER BY embedding <-> q.v LIMIT 10) a) x;
ANALYZE;
```
Note: uniform-random high-dimensional data gives misleadingly bad ANN recall (64-d uniform: HNSW recall@10 = 0.2 in our
test) because all distances concentrate; use clustered data for teaching. (`WHERE cid >= 0` and the `c.v[j]` reference make
the scalar subqueries correlated so they are re-evaluated per row; without an outer reference PostgreSQL evaluates the
subquery once and every row gets the same vector.) Runtime ≈ 5–15 s in Node.

**D. HNSW + ef_search** (20 000 × 32-d build ≈ 3 s)
```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) SELECT id FROM items ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;
-- Sort (top-N heapsort) -> Seq Scan, ~5 ms
CREATE INDEX i_hnsw ON items USING hnsw (embedding vector_l2_ops);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) SELECT id FROM items ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;
-- Index Scan using i_hnsw ... Order By ... Index Searches: 1, ~0.7 ms
SELECT * FROM recall;                          -- ~0.96
SET hnsw.ef_search = 10;  SELECT * FROM recall; -- ~0.91
RESET hnsw.ef_search;
SELECT count(*) FROM (SELECT id FROM items ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 100) a;  -- 40 (!)
SET hnsw.ef_search = 200;
SELECT count(*) FROM (SELECT id FROM items ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 100) a;  -- 100
RESET hnsw.ef_search;
-- index NOT used:
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY 1 - (embedding <-> (SELECT v FROM queries WHERE qid=1)) DESC LIMIT 5;
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <=> (SELECT v FROM queries WHERE qid=1) LIMIT 5;  -- wrong opclass
EXPLAIN (COSTS OFF) SELECT id FROM items WHERE embedding <-> (SELECT v FROM queries WHERE qid=1) < 0.5;
```
(All numbers above came from this exact data, including the 40-row cap.)

**E. Build-option errors and memory notice**
```sql
CREATE TABLE s (e vector(3));
CREATE INDEX ON s USING hnsw (e vector_l2_ops) WITH (m = 101);                       -- out of bounds for option "m"
CREATE INDEX ON s USING hnsw (e vector_l2_ops) WITH (m = 16, ef_construction = 31);  -- must be >= 2 * m
CREATE INDEX ON s USING hnsw (e);                                                    -- no default operator class
CREATE INDEX ON s USING ivfflat (e vector_l1_ops);                                   -- opclass does not exist for ivfflat
CREATE INDEX ON s USING ivfflat (e vector_l2_ops) WITH (lists = 10);                 -- NOTICE: ivfflat index created with little data
SET hnsw.ef_search = 1001;                                                           -- outside the valid range (1 .. 1000)
SET ivfflat.iterative_scan = strict_order;                                           -- invalid value
-- memory notice (on table "items" from C, ~10 s):
SET maintenance_work_mem = '1MB';
CREATE INDEX i_small_mem ON items USING hnsw (embedding vector_l2_ops);
-- NOTICE: hnsw graph no longer fits into maintenance_work_mem after ~N tuples
RESET maintenance_work_mem; DROP INDEX i_small_mem;
```
(The 1MB test was run on a 10 000 × 64-d table → "after 1273 tuples"; N differs for 32-d.)

**F. Filtering, iterative scans** (needs i_hnsw from D)
```sql
CREATE TABLE truthf AS SELECT qid, id FROM queries,
  LATERAL (SELECT id FROM items WHERE category_id = 3 ORDER BY embedding <-> queries.v LIMIT 10) a;
-- (create truthf BEFORE the HNSW index, or inside BEGIN; SET LOCAL enable_indexscan = off; ... COMMIT;)
CREATE VIEW recallf AS
  SELECT avg(cnt)/10.0 AS recall_at_10, avg(n) AS avg_rows FROM queries q,
  LATERAL (SELECT count(*) n, count(*) FILTER (WHERE id IN (SELECT id FROM truthf t WHERE t.qid = q.qid)) cnt
           FROM (SELECT id FROM items WHERE category_id = 3 ORDER BY embedding <-> q.v LIMIT 10) a) x;
SELECT * FROM recallf;                                   -- avg_rows 4.0, recall 0.40
SET hnsw.iterative_scan = strict_order;  SELECT * FROM recallf;   -- 10 rows, ~1.0
SET hnsw.iterative_scan = relaxed_order; SELECT * FROM recallf;   -- 10 rows, ~1.0
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) SELECT id FROM items WHERE category_id = 3
  ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;   -- Filter / Rows Removed by Filter: ~129
-- re-impose strict order on relaxed results
WITH r AS MATERIALIZED (
  SELECT id, embedding <-> (SELECT v FROM queries WHERE qid=1) AS d FROM items WHERE category_id = 3 ORDER BY d LIMIT 10
) SELECT id, round(d::numeric,4) FROM r ORDER BY d + 0;
RESET hnsw.iterative_scan;
-- very selective filter: exact path wins
UPDATE items SET category_id = 99 WHERE id % 1000 = 0;
CREATE INDEX i_cat ON items (category_id); ANALYZE items;
EXPLAIN (COSTS OFF) SELECT id FROM items WHERE category_id = 99 ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;
-- Bitmap Index Scan on i_cat -> Sort  (exact)
-- partial index
CREATE INDEX i_part ON items USING hnsw (embedding vector_l2_ops) WHERE (category_id = 3);
```
(Recall figures tested on this data; the anti-correlated variant used `category_id = i % 10`, giving 0.10 / 0.36 / 0.79.)
Partitioning per tenant (`PARTITION BY LIST`) — UNTESTED here but plain PG partitioning works in PGlite.

**G. IVFFlat**
```sql
DROP INDEX IF EXISTS i_hnsw;
CREATE INDEX i_ivf ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 20);  -- ~50 ms on 20k rows
SELECT * FROM recall;
SET ivfflat.probes = 4;  SELECT * FROM recall;
SET ivfflat.probes = 20; EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;
-- probes = lists -> planner uses Seq Scan + Sort
RESET ivfflat.probes;
SET ivfflat.iterative_scan = relaxed_order;
```
(Tested: lists=100 & probes=100 → Seq Scan; lists=20 recall was 1.0 at probes=1 on the clustered set because 50 tight
clusters map neatly onto cells; on 64-d uniform data with lists=100, probes 1 → 0/10 and probes 10 → 4/10. Use the uniform
set if you want to show the probes curve.)

**H. halfvec / binary quantization / re-rank / sizes**
```sql
CREATE INDEX i_half ON items USING hnsw ((embedding::halfvec(32)) halfvec_l2_ops);
CREATE INDEX i_bq   ON items USING hnsw ((binary_quantize(embedding)::bit(32)) bit_hamming_ops);
SELECT relname, pg_size_pretty(pg_relation_size(oid)) FROM pg_class WHERE relname IN ('i_hnsw','i_half','i_bq');
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding::halfvec(32) <-> (SELECT v FROM queries WHERE qid=1)::halfvec(32) LIMIT 10;
SET hnsw.ef_search = 200;
SELECT id FROM (
  SELECT id, embedding FROM items
  ORDER BY binary_quantize(embedding)::bit(32) <~> binary_quantize((SELECT v FROM queries WHERE qid=1)) LIMIT 200
) c ORDER BY embedding <-> (SELECT v FROM queries WHERE qid=1) LIMIT 10;
RESET hnsw.ef_search;
```
(Tested on this 20 000 × 32-d clustered set: sizes HNSW 8496 kB / halfvec 7224 kB / bit 2488 kB; averaged over the 30
queries, BQ-only recall@10 = **0.097** (0.97/10) and BQ top-200 + exact re-rank = **0.78**. On 10 000 × 64-d uniform data:
5592 / 4256 / 3032 kB, BQ-only 3/10, re-ranked 9/10 for one query. Lesson: 32 bits is far too few to discriminate; BQ only
makes sense for high-dimensional embeddings, and always with re-ranking.)

**I. NULL and zero vectors are not indexed for cosine**
```sql
CREATE TABLE nz (id int, e vector(2));
INSERT INTO nz VALUES (1,'[0,0]'),(2,'[1,1]'),(3,NULL),(4,'[1,2]');
CREATE INDEX ON nz USING hnsw (e vector_cosine_ops);
BEGIN; SET LOCAL enable_seqscan = off;
SELECT id FROM nz ORDER BY e <=> '[1,1]' LIMIT 10;   -- 2, 4   (index scan: zero & NULL missing)
COMMIT;
SELECT id FROM nz ORDER BY e <=> '[1,1]' LIMIT 10;   -- 2, 4, 1, 3  (seq scan: NaN and NULL sort last)
```

**J. Hybrid search with RRF (k = 60)**
```sql
CREATE TABLE docs (id int PRIMARY KEY, content text, embedding vector(3),
  textsearch tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED);
INSERT INTO docs VALUES
 (1,'The dog is barking','[0.9,0.1,0.0]'), (2,'The cat is purring','[0.8,0.3,0.1]'),
 (3,'The bear is growling','[0.1,0.9,0.2]'), (4,'A grizzly bear catches salmon','[0.2,0.8,0.4]'),
 (5,'Salmon recipes for dinner','[0.0,0.2,0.9]');
CREATE INDEX ON docs USING gin (textsearch);
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);
WITH semantic AS (
  SELECT id, rank() OVER (ORDER BY embedding <=> '[0.15,0.85,0.3]') AS rank
  FROM docs ORDER BY embedding <=> '[0.15,0.85,0.3]' LIMIT 20),
keyword AS (
  SELECT id, rank() OVER (ORDER BY ts_rank_cd(textsearch, query) DESC) AS rank
  FROM docs, plainto_tsquery('english','growling bear') query
  WHERE textsearch @@ query ORDER BY ts_rank_cd(textsearch, query) DESC LIMIT 20)
SELECT coalesce(s.id, k.id) AS id, s.rank AS semantic_rank, k.rank AS keyword_rank,
       round(coalesce(1.0/(60+s.rank),0.0) + coalesce(1.0/(60+k.rank),0.0), 5) AS rrf_score
FROM semantic s FULL OUTER JOIN keyword k ON s.id = k.id
ORDER BY rrf_score DESC LIMIT 5;
-- 3 | 1 | 1 | 0.03279 ; 4 | 2 | null | 0.01613 ; 5 | 3 | null | 0.01587 ; ...
```
Note: `plainto_tsquery('english','growling bear')` ANDs the terms, so only doc 3 matches the keyword branch; a teaching
point (use `websearch_to_tsquery('english','growling or bear')` → `'growl' | 'bear'` for OR semantics; tested).

**K. RAG retrieval step**
```sql
CREATE TABLE chunks (id bigserial PRIMARY KEY, doc_id int, chunk_no int, content text, embedding vector(3));
INSERT INTO chunks (doc_id, chunk_no, content, embedding) VALUES
 (1,1,'Postgres uses MVCC','[1,0,0]'), (1,2,'VACUUM removes dead tuples','[0.9,0.2,0]'), (2,1,'HNSW is a graph index','[0,1,0]');
SELECT string_agg(content, E'\n' ORDER BY embedding <=> '[0.95,0.1,0]') AS context
FROM (SELECT content, embedding FROM chunks ORDER BY embedding <=> '[0.95,0.1,0]' LIMIT 2) t;
-- "Postgres uses MVCC\nVACUUM removes dead tuples"
```

**L. Maintenance**
```sql
DELETE FROM items WHERE id % 2 = 0;
VACUUM items;                              -- HNSW index size unchanged (8488 kB in test)
REINDEX INDEX CONCURRENTLY i_hnsw;         -- shrinks (4264 kB in test)
CREATE INDEX CONCURRENTLY i_hnsw_ip ON items USING hnsw (embedding vector_ip_ops);  -- works in PGlite
SHOW max_parallel_maintenance_workers;     -- 0 in PGlite (no parallel builds)
```

**M. Catalog exploration**
```sql
SELECT am.amname, opc.opcname, t.typname
FROM pg_opclass opc JOIN pg_am am ON am.oid = opc.opcmethod JOIN pg_type t ON t.oid = opc.opcintype
WHERE am.amname IN ('hnsw','ivfflat') ORDER BY 1, 2;                     -- 14 hnsw + 7 ivfflat
SELECT name, setting, vartype, enumvals, min_val, max_val FROM pg_settings
WHERE name LIKE 'hnsw.%' OR name LIKE 'ivfflat.%';                       -- 7 GUCs
SELECT am.amname, opc.opcname, string_agg(p.amproc::regproc::text || '#' || p.amprocnum, ', ' ORDER BY p.amprocnum)
FROM pg_opclass opc JOIN pg_am am ON am.oid = opc.opcmethod JOIN pg_amproc p ON p.amprocfamily = opc.opcfamily
WHERE am.amname IN ('hnsw','ivfflat') GROUP BY 1, 2 ORDER BY 1, 2;     -- cosine = neg inner product + norm
```

### PGlite caveats for lesson authors
- Single backend: no parallel builds (`max_parallel_*` = 0), `pg_stat_progress_create_index` can't be watched from another
  session, CONCURRENTLY works but has nothing to be concurrent with.
- WASM, single thread: keep demo tables ≤ ~20 000 rows × ≤ 64 dims; HNSW build ≈ 3 s at 20k × 32-d, multiple HNSW indexes on
  10k × 64-d took ~25 s total. IVFFlat builds are ~50× faster than HNSW here.
- `onNotice` callback in `db.query(sql, [], {onNotice})` surfaces the pgvector NOTICEs (little data, maintenance_work_mem).
- No network: embeddings must be precomputed (ship a small JSON of real model embeddings, e.g. 384-d MiniLM, for a semantic-search demo) or synthetic.
