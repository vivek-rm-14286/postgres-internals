// Runs every preset on its own: fresh database + setup + that one preset. A preset that only works after an
// earlier preset fails here (a reader may click presets in any order after "Reset").
// usage: node scripts/check-standalone.mjs [slug-or-module-filter]
import { createServer } from 'vite'
import { PGlite } from '@electric-sql/pglite'

const filter = process.argv[2]
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS: LESSONS } = await server.ssrLoadModule('/src/lessons/all.ts')
const { splitStatements } = await server.ssrLoadModule('/src/playground/split.ts')
const execAll = async (db, sql) => { for (const st of splitStatements(sql)) await db.exec(st) }
const extImport = {
  vector: () => import('@electric-sql/pglite-pgvector').then((m) => m.vector),
  postgis: () => import('@electric-sql/pglite-postgis').then((m) => m.postgis),
  uuid_ossp: () => import('@electric-sql/pglite/contrib/uuid_ossp').then((m) => m.uuid_ossp),
}
const loadExt = (n) => (extImport[n] ?? (() => import(`@electric-sql/pglite/contrib/${n}`).then((m) => m[n])))()
const sqlName = (e) => (e === 'uuid_ossp' ? '"uuid-ossp"' : e)

let failures = 0
const todo = LESSONS.filter((l) => !filter || l.slug.includes(filter) || l.module === filter)
async function one(l) {
  const exts = l.playground.extensions ?? []
  const loaded = Object.fromEntries(await Promise.all(exts.map(async (n) => [n, await loadExt(n)])))
  // Boot once, run setup, snapshot the data directory; each preset starts from a copy of that snapshot.
  const opts = { extensions: loaded, ...(l.playground.config?.length ? { postgresqlconf: l.playground.config } : {}) }
  const base = await PGlite.create(opts)
  for (const e of exts) await base.exec(`CREATE EXTENSION IF NOT EXISTS ${sqlName(e)};`)
  await execAll(base, l.playground.setup)
  const snap = await base.dumpDataDir('none')
  await base.close()
  for (const pr of l.playground.presets) {
    const db = await PGlite.create({ ...opts, loadDataDir: snap })
    try { await execAll(db, pr.sql) } catch (e) { failures++; console.log(`  ✗ ${l.module}/${l.slug} · "${pr.label}": ${e.message}`) }
    await db.close()
  }
}
const queue = [...todo]
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) { const l = queue.shift(); try { await one(l) } catch (e) { failures++; console.log(`  ✗ ${l.module}/${l.slug}: ${e.message}`) } } }))
await server.close()
console.log(failures ? `\n${failures} preset(s) fail on their own` : `\nEvery preset of ${todo.length} lessons runs on its own.`)
process.exit(failures ? 1 : 0)
