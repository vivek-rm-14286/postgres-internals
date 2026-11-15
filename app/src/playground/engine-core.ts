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
  /** True when the run was stopped (by the reader or the time limit) and the database had to be restarted. */
  stopped?: boolean
}

export interface BootSpec { extensions: ExtensionName[]; setup: string; config: string[] }

/**
 * The database itself: one in-memory PostgreSQL, started from a lesson or dataset schema. This module has no idea
 * which thread it runs on. In the browser it lives in a Web Worker (engine.worker.ts) so that a query that never
 * ends can be stopped by terminating the worker; in Node (the content checks) it runs in-process.
 */
export async function bootDatabase(spec: BootSpec): Promise<PGlite> {
  const [{ PGlite }, exts] = await Promise.all([import('@electric-sql/pglite'), loadExtensions(spec.extensions)])
  const db = await PGlite.create({ extensions: exts, ...(spec.config.length ? { postgresqlconf: spec.config } : {}) })
  for (const e of spec.extensions) await db.exec(`CREATE EXTENSION IF NOT EXISTS ${sqlName(e)};`)
  for (const stmt of splitStatements(spec.setup)) await db.exec(stmt)
  return db
}

export async function runStatements(db: PGlite, sql: string): Promise<RunOutput> {
  const t0 = performance.now()
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
