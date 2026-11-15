// Validates every lesson: the six-part template is complete, and the playground setup + every preset
// query runs without error on a real PGlite (PostgreSQL 18) in Node, with the lesson's extensions.
// usage: node scripts/check-lessons.mjs [slug-filter]
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
const sentences = (s) => (s.match(/[.!?](\s|$)/g) ?? []).length

let failures = 0
const fail = (l, msg) => { failures++; console.log(`  ✗ ${l.module}/${l.slug}: ${msg}`) }
const slugs = new Set()
const { EXERCISES } = await server.ssrLoadModule('/src/cookbook/registry.ts')
const refData = (await import('../src/reference/data.json', { with: { type: 'json' } })).default
const validTargets = new Set([...LESSONS.map((x) => `/${x.module}/${x.slug}`), '/cookbook', '/reference', '/guide', ...EXERCISES.map((e) => `/cookbook/${e.id}`), ...refData.map((t) => `/reference/${t.id}`)])

for (const l of LESSONS) {
  if (filter && !l.slug.includes(filter) && l.module !== filter) continue
  // ---- template checks
  if (slugs.has(l.slug)) fail(l, 'duplicate slug'); slugs.add(l.slug)
  if (!Array.isArray(l.tldr) || l.tldr.length !== 2 || l.tldr.some((s) => sentences(s) !== 1)) fail(l, 'tldr must be exactly 2 sentences (one per entry)')
  if (!l.visualizer?.Component || !l.visualizer.title || !l.visualizer.caption) fail(l, 'visualizer incomplete')
  if (!l.playground?.setup?.trim() || (l.playground.presets?.length ?? 0) < 3) fail(l, 'playground needs setup and >= 3 presets')
  const p = l.production ?? {}
  if (!p.title || !p.context || !p.problem || !p.solution || !p.outcome) fail(l, 'production example incomplete')
  if ((l.pitfalls?.length ?? 0) < 2 || l.pitfalls.some((x) => !x.title || !x.symptom || !x.cause || !x.fix)) fail(l, 'need >= 2 complete pitfalls')
  if (!(l.pointers?.length >= 3 && l.pointers.length <= 5)) fail(l, 'pointers must be 3-5')
  if (!l.sources?.length) fail(l, 'sources missing')
  const text = JSON.stringify(l)
  if (/lorem ipsum|coming soon|\bTODO\b|\bTBD\b/i.test(text)) fail(l, 'placeholder text found')
  for (const m of text.matchAll(/\]\((\/[^)\s]*)\)/g)) if (!validTargets.has(m[1])) fail(l, `broken internal link ${m[1]}`)

  // ---- SQL checks: setup, then all presets in order on one database (as a reader clicking through would)
  const exts = l.playground.extensions ?? []
  const t0 = Date.now()
  let db
  try {
    const loaded = Object.fromEntries(await Promise.all(exts.map(async (n) => [n, await loadExt(n)])))
    db = await PGlite.create({ extensions: loaded, ...(l.playground.config?.length ? { postgresqlconf: l.playground.config } : {}) })
    for (const e of exts) await db.exec(`CREATE EXTENSION IF NOT EXISTS ${sqlName(e)};`)
    await execAll(db, l.playground.setup)
  } catch (e) { fail(l, `setup failed: ${e.message}`); await db?.close(); continue }
  for (const pr of l.playground.presets) {
    try { await execAll(db, pr.sql) } catch (e) {
      fail(l, `preset "${pr.label}" failed: ${e.message}`)
      try { await db.exec('ROLLBACK') } catch { /* not in a transaction */ }
    }
  }
  await db.close()
  console.log(`  ✓ ${l.module}/${l.slug} (${l.playground.presets.length} presets, ${Date.now() - t0} ms)`)
}

// ---- Production guide: every rule complete, ids unique, every link resolves
if (!filter) {
  const { GUIDE_RULES, GUIDE_CATEGORIES } = await server.ssrLoadModule('/src/guide/data.ts')
  const gfail = (r, msg) => { failures++; console.log(`  ✗ guide/${r.id ?? '?'}: ${msg}`) }
  const cats = new Set(GUIDE_CATEGORIES.map((c) => c.id))
  const impacts = new Set(['correctness', 'performance', 'availability', 'security', 'operability'])
  const ids = new Set()
  for (const r of GUIDE_RULES) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id ?? '') || ids.has(r.id)) gfail(r, 'id missing, not kebab-case, or duplicated'); ids.add(r.id)
    if (!cats.has(r.category)) gfail(r, `unknown category ${r.category}`)
    if (!impacts.has(r.impact)) gfail(r, `unknown impact ${r.impact}`)
    if (!r.rule?.trim() || /\.$/.test(r.rule.trim()) || !r.why?.trim()) gfail(r, 'rule (no trailing period) and why are required')
    if (!r.avoid?.trim() && !r.prefer?.trim()) gfail(r, 'needs avoid or prefer')
    if (!r.learn?.length) gfail(r, 'needs at least one learn link')
    for (const p of r.learn ?? []) if (!validTargets.has(p)) gfail(r, `broken learn link ${p}`)
    const text = JSON.stringify(r)
    for (const m of text.matchAll(/\]\((\/[^)\s]*)\)/g)) if (!validTargets.has(m[1])) gfail(r, `broken internal link ${m[1]}`)
    if (/lorem ipsum|coming soon|\bTODO\b|\bTBD\b|PGlite|the docs\b|documented|according to/i.test(text)) gfail(r, 'placeholder or provenance wording')
  }
  for (const c of GUIDE_CATEGORIES) if (!GUIDE_RULES.some((r) => r.category === c.id)) { failures++; console.log(`  ✗ guide: category ${c.id} has no rules`) }
  console.log(`  ✓ production guide (${GUIDE_RULES.length} rules in ${GUIDE_CATEGORIES.length} categories)`)
}

await server.close()
console.log(failures ? `\n${failures} problem(s)` : `\nAll ${slugs.size} lessons pass.`)
process.exit(failures ? 1 : 0)
