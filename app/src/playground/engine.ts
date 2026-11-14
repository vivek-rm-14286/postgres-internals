import type { PGlite } from '@electric-sql/pglite'
import { loadExtensions, sqlName, type ExtensionName } from './extensions'
import { splitStatements } from './split'

export interface StatementResult {
  fields: string[]
  rows: unknown[][]
  affectedRows?: number
  command?: string
}

export interface RunOutput {
  results: StatementResult[]
  /** NOTICE / INFO / WARNING messages, in arrival order (VACUUM VERBOSE, RAISE NOTICE…). */
  notices: string[]
  error?: { message: string; code?: string; position?: string; hint?: string; detail?: string; statement?: string }
  ms: number
}

/** One isolated in-memory Postgres per playground. Created lazily, torn down on reset/unmount. */
export class Engine {
  private db: PGlite | null = null
  private booting: Promise<PGlite> | null = null
  private extensions: ExtensionName[]
  private setup: string
  private config: string[]
  constructor(extensions: ExtensionName[], setup: string, config: string[] = []) {
    this.extensions = extensions
    this.setup = setup
    this.config = config
  }

  get ready() { return this.db !== null }

  async boot(): Promise<PGlite> {
    if (this.db) return this.db
    if (!this.booting) {
      this.booting = (async () => {
        const [{ PGlite }, exts] = await Promise.all([import('@electric-sql/pglite'), loadExtensions(this.extensions)])
        const db = await PGlite.create({ extensions: exts, ...(this.config.length ? { postgresqlconf: this.config } : {}) })
        for (const e of this.extensions) await db.exec(`CREATE EXTENSION IF NOT EXISTS ${sqlName(e)};`)
        for (const stmt of splitStatements(this.setup)) await db.exec(stmt)
        this.db = db
        return db
      })()
      this.booting.catch(() => { this.booting = null })
    }
    return this.booting
  }

  async run(sql: string): Promise<RunOutput> {
    const t0 = performance.now()
    const db = await this.boot()
    const results: StatementResult[] = []
    const notices: string[] = []
    const onNotice = (n: { severity?: string; message?: string; detail?: string }) => {
      notices.push(`${n.severity ?? 'NOTICE'}:  ${n.message ?? ''}${n.detail ? `\nDETAIL:  ${n.detail}` : ''}`)
    }
    // Like psql: each statement is its own message, so it autocommits unless the reader wrote BEGIN.
    for (const stmt of splitStatements(sql)) {
      try {
        const res = await db.exec(stmt, { rowMode: 'array', onNotice })
        for (const r of res) results.push({ fields: r.fields.map((f) => f.name), rows: r.rows as unknown[][], affectedRows: r.affectedRows })
      } catch (e) {
        const err = e as { message: string; code?: string; position?: string; hint?: string; detail?: string }
        // An error inside BEGIN … leaves the transaction aborted: every later statement fails with 25P02 until ROLLBACK.
        let hint = err.hint
        try { if (db.isInTransaction()) hint = [hint, 'The transaction is still open and now aborted: run ROLLBACK (or press Reset DB) before continuing.'].filter(Boolean).join(' ') } catch { /* ignore */ }
        return { results, notices, error: { message: err.message, code: err.code, position: err.position, hint, detail: err.detail, statement: stmt }, ms: performance.now() - t0 }
      }
    }
    return { results, notices, ms: performance.now() - t0 }
  }

  async close() {
    const db = this.db ?? (this.booting ? await this.booting.catch(() => null) : null)
    this.db = null
    this.booting = null
    await db?.close().catch(() => {})
  }
}

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Date) return v.toISOString()
  if (v instanceof Uint8Array) return '\\x' + Array.from(v.slice(0, 64), (b) => b.toString(16).padStart(2, '0')).join('') + (v.length > 64 ? '…' : '')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
