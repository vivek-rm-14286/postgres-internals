import type { PGlite } from '@electric-sql/pglite'
import { bootDatabase, runStatements, type RunOutput } from './engine-core'
import type { ExtensionName } from './extensions'
import type { WorkerReply, WorkerRequest } from './engine.worker'

export type { RunOutput, StatementResult } from './engine-core'

/** A run is stopped automatically after this long, so a query that never ends cannot hold the page for ever. */
export const RUN_LIMIT_MS = 60_000

const HAS_WORKER = typeof Worker !== 'undefined'

/**
 * One isolated in-memory Postgres per playground. Created lazily, torn down on reset/unmount.
 * In the browser the database runs in its own Web Worker: the page stays responsive during a query, and `stop()`
 * (or the time limit) ends a runaway query by terminating the worker. The next run starts a fresh database from
 * the same schema. Without Worker support (Node, used by the content checks) it runs in-process and cannot be stopped.
 */
export class Engine {
  private extensions: ExtensionName[]
  private setup: string
  private config: string[]
  private worker: Worker | null = null
  private local: PGlite | null = null
  private booting: Promise<void> | null = null
  private booted = false
  private seq = 0
  private waiting = new Map<number, { resolve: (r: WorkerReply) => void; reject: (e: Error) => void }>()
  /** The run in flight, if any: lets stop() answer it. */
  private current: { finish: (out: RunOutput) => void; t0: number; timer?: ReturnType<typeof setTimeout> } | null = null

  constructor(extensions: ExtensionName[], setup: string, config: string[] = []) {
    this.extensions = extensions
    this.setup = setup
    this.config = config
  }

  get ready() { return this.booted }
  /** Whether a run can be stopped (true in the browser). */
  get stoppable() { return HAS_WORKER }

  private send(msg: Omit<Extract<WorkerRequest, { type: 'boot' }>, 'id'> | Omit<Extract<WorkerRequest, { type: 'run' }>, 'id'>): Promise<WorkerReply> {
    const id = ++this.seq
    return new Promise<WorkerReply>((resolve, reject) => {
      this.waiting.set(id, { resolve, reject })
      this.worker!.postMessage({ ...msg, id })
    })
  }

  boot(): Promise<void> {
    if (this.booted) return Promise.resolve()
    if (!this.booting) {
      const spec = { extensions: this.extensions, setup: this.setup, config: this.config }
      this.booting = (async () => {
        if (!HAS_WORKER) { this.local = await bootDatabase(spec); this.booted = true; return }
        const w = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
        this.worker = w
        w.onmessage = (e: MessageEvent<WorkerReply>) => { const p = this.waiting.get(e.data.id); if (p) { this.waiting.delete(e.data.id); p.resolve(e.data) } }
        w.onerror = (e) => { const err = new Error(e.message || 'The database worker failed to start.'); for (const p of this.waiting.values()) p.reject(err); this.waiting.clear() }
        const r = await this.send({ type: 'boot', spec })
        if (this.worker !== w) throw new Error('The database was stopped while starting.')
        if (!r.ok) throw new Error(r.message)
        this.booted = true
      })()
      this.booting.catch(() => { this.teardown() })
    }
    return this.booting
  }

  /** Runs a script. Never rejects for SQL errors or a stop: both come back in the output. */
  async run(sql: string, limitMs = RUN_LIMIT_MS): Promise<RunOutput> {
    await this.boot()
    if (!HAS_WORKER) return runStatements(this.local!, sql)
    const t0 = performance.now()
    return new Promise<RunOutput>((resolve, reject) => {
      const cur = { finish: (out: RunOutput) => { clearTimeout(cur.timer); if (this.current === cur) this.current = null; resolve(out) }, t0, timer: undefined as ReturnType<typeof setTimeout> | undefined }
      this.current = cur
      cur.timer = setTimeout(() => this.stop(`Stopped after ${Math.round(limitMs / 1000)} s: the query did not finish.`), limitMs)
      this.send({ type: 'run', sql }).then(
        (r) => { if (this.current !== cur) return; if (r.ok && r.out) cur.finish(r.out); else { clearTimeout(cur.timer); this.current = null; reject(new Error(r.ok ? 'No result.' : r.message)) } },
        (e) => { if (this.current !== cur) return; clearTimeout(cur.timer); this.current = null; reject(e as Error) },
      )
    })
  }

  /**
   * Ends the run in flight by terminating the database. The run resolves with an error explaining what happened;
   * the next boot() or run() starts a fresh database from the same schema. Returns false when nothing was running.
   */
  stop(message = 'Stopped.'): boolean {
    const cur = this.current
    if (!cur || !HAS_WORKER) return false
    this.teardown()
    cur.finish({
      results: [], notices: [], stopped: true, ms: performance.now() - cur.t0,
      error: { message, hint: 'A running statement cannot be cancelled, so the database was restarted from the original schema. Changes made since the last reset are gone.' },
    })
    return true
  }

  private teardown() {
    this.worker?.terminate()
    this.worker = null
    this.booting = null
    this.booted = false
    for (const p of this.waiting.values()) p.reject(new Error('The database was stopped.'))
    this.waiting.clear()
  }

  async close() {
    if (this.current) { this.stop('Stopped.'); return }
    const local = this.local
    this.local = null
    this.teardown()
    await local?.close().catch(() => {})
  }
}

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Date) return v.toISOString()
  if (v instanceof Uint8Array) return '\\x' + Array.from(v.slice(0, 64), (b) => b.toString(16).padStart(2, '0')).join('') + (v.length > 64 ? '…' : '')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
