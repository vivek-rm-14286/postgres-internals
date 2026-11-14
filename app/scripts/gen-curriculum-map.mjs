// Writes curriculum/curriculum-map.json from the lesson files: module → lessons → TL;DR, visualizer, presets,
// production example, pitfalls, pointers and official doc sources. Regenerate after editing lessons.
import fs from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS } = await server.ssrLoadModule('/src/lessons/all.ts')
const { MODULES } = await server.ssrLoadModule('/src/lessons/modules.ts')
await server.close()

const map = {
  title: 'Postgres Internals, Visualized — curriculum map',
  postgresVersion: '18 (docs 18.7, playground PGlite 18.6)',
  generatedFrom: 'app/src/lessons/**',
  modules: MODULES.map((m) => ({
    id: m.id, number: m.n, title: m.title, summary: m.blurb,
    lessons: ALL_LESSONS.filter((l) => l.module === m.id).map((l) => ({
      order: l.order, slug: l.slug, title: l.title, tldr: l.tldr.join(' '),
      visualizer: { title: l.visualizer.title, interaction: l.visualizer.caption },
      playground: { extensions: l.playground.extensions ?? [], presets: l.playground.presets.map((p) => ({ label: p.label, lookFor: p.note ?? '' })) },
      production: { title: l.production.title, problem: l.production.problem, outcome: l.production.outcome },
      pitfalls: l.pitfalls.map((p) => ({ title: p.title, fix: p.fix })),
      keyPointers: l.pointers,
    })),
  })),
}
fs.writeFileSync(new URL('../../curriculum/curriculum-map.json', import.meta.url), JSON.stringify(map, null, 1) + '\n')
console.log(`curriculum-map.json: ${map.modules.length} modules, ${ALL_LESSONS.length} lessons`)
