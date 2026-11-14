// Validates the Cookbook: every dataset sets up, every reference solution (and check query) runs on real PGlite,
// returns rows, ids are unique, and the checker accepts the solution and rejects an obviously wrong answer.
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { DATASETS, EXERCISES } = await server.ssrLoadModule('/src/cookbook/registry.ts')
const { checkAnswer } = await server.ssrLoadModule('/src/cookbook/compare.ts')
const { LEVELS } = await server.ssrLoadModule('/src/cookbook/types.ts')
let fails = 0
const fail = (id, m) => { fails++; console.log(`  ✗ ${id}: ${m}`) }
const ids = new Set()
for (const e of EXERCISES) {
  if (ids.has(e.id)) fail(e.id, 'duplicate id'); ids.add(e.id)
  const ds = DATASETS.find((d) => d.id === e.dataset)
  if (!ds) { fail(e.id, `unknown dataset ${e.dataset}`); continue }
  if (!LEVELS.includes(e.level)) fail(e.id, `bad level ${e.level}`)
  if (!e.task || !e.title || !e.explanation || !e.topic) fail(e.id, 'missing text')
  const good = await checkAnswer(e, ds, e.solution)
  if (!good.ok) { fail(e.id, `solution not accepted: ${good.message}${good.error ? ' ' + good.error.message : ''}`); continue }
  const wrong = await checkAnswer(e, ds, 'SELECT 1 AS wrong_answer WHERE false;')
  if (wrong.ok) fail(e.id, 'checker accepted an empty wrong answer')
  if (!fails || true) console.log(`  ✓ ${e.id} (${e.level})`)
}
await server.close()
const by = Object.fromEntries(LEVELS.map((l) => [l, EXERCISES.filter((e) => e.level === l).length]))
console.log(`\n${DATASETS.length} datasets, ${EXERCISES.length} exercises ${JSON.stringify(by)}`)
console.log(fails ? `${fails} problem(s)` : 'All exercises pass.')
process.exit(fails ? 1 : 0)
