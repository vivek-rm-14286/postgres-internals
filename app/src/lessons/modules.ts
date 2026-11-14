import type { ModuleId } from '../lesson/types'

export interface ModuleInfo {
  id: ModuleId
  n: number
  title: string
  short: string
  blurb: string
}

export const MODULES: ModuleInfo[] = [
  { id: 'm1', n: 1, title: 'Foundations & Process Architecture', short: 'Foundations', blurb: 'One postmaster, one process per connection, a shared memory arena, and the helper processes that keep it healthy.' },
  { id: 'm2', n: 2, title: 'Storage & Page Layout Internals', short: 'Storage', blurb: 'How rows become bytes: data types, 8 KB slotted pages, tuple headers, TOAST, and the free-space and visibility maps.' },
  { id: 'm3', n: 3, title: 'Querying & Data Manipulation', short: 'Querying', blurb: 'What INSERT, UPDATE and DELETE really do, and how joins, CTEs, window functions and LATERAL compose.' },
  { id: 'm4', n: 4, title: 'Query Planner, Optimizer & Indexing', short: 'Planner & Indexes', blurb: 'From SQL text to a plan tree: costs, statistics, every index access method, and reading EXPLAIN like a pro.' },
  { id: 'm5', n: 5, title: 'Concurrency, MVCC & Locking', short: 'MVCC & Locks', blurb: 'Snapshots and visibility rules, HOT updates, isolation levels, and the lock hierarchy from spinlocks to table locks.' },
  { id: 'm6', n: 6, title: 'Advanced Programmability & Extensions', short: 'Programmability', blurb: 'Views, triggers, PL/pgSQL, the rule system, foreign data wrappers and the extensions everyone runs.' },
  { id: 'm7', n: 7, title: 'WAL, Replication, Vacuum & High Availability', short: 'WAL & HA', blurb: 'Durability through the write-ahead log, vacuum and wraparound, replication, partitioning and pooling.' },
]

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!
