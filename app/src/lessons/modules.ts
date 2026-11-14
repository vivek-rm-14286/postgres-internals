import type { ModuleId } from '../lesson/types'

export type TrackId = 'fundamentals' | 'internals' | 'ecosystem'

export interface TrackInfo { id: TrackId; title: string; blurb: string }

export interface ModuleInfo {
  id: ModuleId
  track: TrackId
  /** Short label shown on badges, e.g. "F1", "4", "E2". */
  code: string
  /** Position in the overall curriculum (drives ordering everywhere). */
  n: number
  title: string
  short: string
  blurb: string
}

export const TRACKS: TrackInfo[] = [
  { id: 'fundamentals', title: 'Fundamentals', blurb: 'From your first SELECT to production-grade SQL: data types, design, querying and the patterns real applications use.' },
  { id: 'internals', title: 'Internals', blurb: 'How PostgreSQL works underneath: processes, pages, the planner, MVCC, locking, WAL, vacuum and replication.' },
  { id: 'ecosystem', title: 'Ecosystem', blurb: 'PostgreSQL beyond the core: vector search with pgvector, time-series with TimescaleDB, and distributed PostgreSQL.' },
]

export const MODULES: ModuleInfo[] = [
  // Fundamentals
  { id: 'f1', track: 'fundamentals', code: 'F1', n: 1, title: 'Getting Started with SQL', short: 'Getting started', blurb: 'Tables and rows, your first queries, filtering and sorting, simple aggregates, and changing data safely.' },
  { id: 'f2', track: 'fundamentals', code: 'F2', n: 2, title: 'Working with Data', short: 'Working with data', blurb: 'Text, numbers, dates and times, conditional logic and type conversion: the functions you use every day.' },
  { id: 'f3', track: 'fundamentals', code: 'F3', n: 3, title: 'Designing a Database', short: 'Database design', blurb: 'Keys and relationships, constraints, a first look at indexes, views and identity columns, and changing schemas safely.' },
  { id: 'm3', track: 'fundamentals', code: 'F4', n: 4, title: 'Querying & Data Manipulation', short: 'Querying', blurb: 'What INSERT, UPDATE and DELETE really do, and how joins, CTEs, window functions and LATERAL compose.' },
  { id: 'f4', track: 'fundamentals', code: 'F5', n: 5, title: 'Practical SQL Patterns', short: 'SQL patterns', blurb: 'Pagination, upserts, pivots, gaps and islands, hierarchies, search, job queues and a performance checklist.' },
  // Internals
  { id: 'm1', track: 'internals', code: 'I1', n: 6, title: 'Foundations & Process Architecture', short: 'Foundations', blurb: 'One postmaster, one process per connection, a shared memory arena, and the helper processes that keep it healthy.' },
  { id: 'm2', track: 'internals', code: 'I2', n: 7, title: 'Storage & Page Layout Internals', short: 'Storage', blurb: 'How rows become bytes: data types, 8 KB slotted pages, tuple headers, TOAST, and the free-space and visibility maps.' },
  { id: 'm4', track: 'internals', code: 'I3', n: 8, title: 'Query Planner, Optimizer & Indexing', short: 'Planner & Indexes', blurb: 'From SQL text to a plan tree: costs, statistics, every index access method, and reading EXPLAIN like a pro.' },
  { id: 'm5', track: 'internals', code: 'I4', n: 9, title: 'Concurrency, MVCC & Locking', short: 'MVCC & Locks', blurb: 'Snapshots and visibility rules, HOT updates, isolation levels, and the lock hierarchy from spinlocks to table locks.' },
  { id: 'm6', track: 'internals', code: 'I5', n: 10, title: 'Advanced Programmability & Extensions', short: 'Programmability', blurb: 'Views, triggers, PL/pgSQL, the rule system, foreign data wrappers and the extensions everyone runs.' },
  { id: 'm7', track: 'internals', code: 'I6', n: 11, title: 'WAL, Replication, Vacuum & High Availability', short: 'WAL & HA', blurb: 'Durability through the write-ahead log, vacuum and wraparound, replication, partitioning and pooling.' },
  // Ecosystem
  { id: 'e1', track: 'ecosystem', code: 'E1', n: 12, title: 'Vector Search with pgvector', short: 'pgvector', blurb: 'Embeddings, distance metrics, exact and approximate search, HNSW and IVFFlat internals, filtering, hybrid search and scaling.' },
  { id: 'e2', track: 'ecosystem', code: 'E2', n: 13, title: 'Time-Series with TimescaleDB', short: 'TimescaleDB', blurb: 'Hypertables and chunks, time_bucket and gap filling, continuous aggregates, columnar compression and retention.' },
  { id: 'e3', track: 'ecosystem', code: 'E3', n: 14, title: 'Distributed PostgreSQL', short: 'Distributed', blurb: 'Why and how to distribute: sharding with Citus, distributed query execution and transactions, distributed SQL, multi-master and HA clusters.' },
]

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!
export const modulesIn = (t: TrackId) => MODULES.filter((m) => m.track === t)
