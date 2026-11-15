/// <reference lib="webworker" />
// Hosts one in-memory PostgreSQL off the main thread. The page stays responsive while a query runs, and a query
// that never ends is stopped by terminating this worker (a running statement cannot be interrupted from inside).
import type { PGlite } from '@electric-sql/pglite'
import { bootDatabase, runStatements, type BootSpec, type RunOutput } from './engine-core'

export type WorkerRequest = { id: number; type: 'boot'; spec: BootSpec } | { id: number; type: 'run'; sql: string }
export type WorkerReply = { id: number; ok: true; out?: RunOutput } | { id: number; ok: false; message: string }

let db: PGlite | null = null
const reply = (m: WorkerReply) => (self as DedicatedWorkerGlobalScope).postMessage(m)

// Requests are handled one at a time, in arrival order.
let queue: Promise<void> = Promise.resolve()
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const m = e.data
  queue = queue.then(async () => {
    try {
      if (m.type === 'boot') { db ??= await bootDatabase(m.spec); reply({ id: m.id, ok: true }) }
      else if (!db) reply({ id: m.id, ok: false, message: 'The database has not started.' })
      else reply({ id: m.id, ok: true, out: await runStatements(db, m.sql) })
    } catch (err) {
      reply({ id: m.id, ok: false, message: (err as Error)?.message ?? String(err) })
    }
  })
}
