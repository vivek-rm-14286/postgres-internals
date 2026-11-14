// One sandbox session = one worker thread = one in-memory PGlite (PostgreSQL 18).
// Running it off the main thread lets the server kill a runaway query by terminating the worker.
import { parentPort } from 'node:worker_threads'
import { PGlite } from '@electric-sql/pglite'
import { splitStatements } from './split.mjs'

const CONTRIB = ['pageinspect', 'pg_visibility', 'pg_freespacemap', 'pg_buffercache', 'pg_walinspect', 'pg_stat_statements',
  'pg_trgm', 'btree_gin', 'btree_gist', 'bloom', 'amcheck', 'hstore', 'ltree', 'citext', 'pgcrypto', 'tablefunc', 'pg_surgery',
  'tsm_system_rows', 'uuid_ossp', 'cube', 'earthdistance', 'fuzzystrmatch', 'intarray', 'isn', 'lo', 'seg', 'unaccent',
  'dict_int', 'dict_xsyn', 'auto_explain', 'tcn', 'moddatetime']

let db
async function boot() {
  if (db) return db
  const extensions = {}
  for (const n of CONTRIB) {
    try { const m = await import(`@electric-sql/pglite/contrib/${n}`); extensions[n] = m[n] ?? Object.values(m)[0] } catch { /* not bundled */ }
  }
  try { extensions.vector = (await import('@electric-sql/pglite-pgvector')).vector } catch { /* optional */ }
  db = await PGlite.create({ extensions })
  return db
}

parentPort.on('message', async ({ id, sql }) => {
  const t0 = performance.now()
  const results = []
  const notices = []
  const onNotice = (n) => notices.push(`${n.severity ?? 'NOTICE'}:  ${n.message ?? ''}${n.detail ? `\nDETAIL:  ${n.detail}` : ''}`)
  try {
    const conn = await boot()
    const stmts = splitStatements(sql)
    for (let i = 0; i < stmts.length; i++) {
      try {
        const res = await conn.exec(stmts[i], { rowMode: 'array', onNotice })
        for (const r of res) results.push({ fields: r.fields.map((f) => f.name), rows: r.rows, affectedRows: r.affectedRows, statement: i + 1 })
      } catch (e) {
        parentPort.postMessage({ id, results, notices, ms: performance.now() - t0, statements: stmts.length,
          error: { statement: i + 1, sql: stmts[i], message: e.message, code: e.code, detail: e.detail, hint: e.hint, position: e.position } })
        return
      }
    }
    parentPort.postMessage({ id, results, notices, ms: performance.now() - t0, statements: stmts.length })
  } catch (e) {
    parentPort.postMessage({ id, results, notices, ms: performance.now() - t0, error: { message: `sandbox failed to start: ${e.message}` } })
  }
})
