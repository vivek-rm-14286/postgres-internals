// Writes src/lessons/manifest.json (slug, module, order, title, file) from the lesson files, and the site search
// index src/search/index.json (lessons, Cookbook exercises, Production guide rules, Reference tables and their rows).
// Runs automatically before dev and build, so the manifest can never drift from the lessons.
import fs from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS } = await server.ssrLoadModule('/src/lessons/all.ts')
const { MODULES } = await server.ssrLoadModule('/src/lessons/modules.ts')
const { EXERCISES, DATASETS } = await server.ssrLoadModule('/src/cookbook/registry.ts')
const { GUIDE_RULES, GUIDE_CATEGORIES } = await server.ssrLoadModule('/src/guide/data.ts')
await server.close()

const manifest = ALL_LESSONS.map(({ slug, module, order, title, file }) => ({ slug, module, order, title, file }))
const out = JSON.stringify(manifest, null, 1) + '\n'
const path = new URL('../src/lessons/manifest.json', import.meta.url)
if (!fs.existsSync(path) || fs.readFileSync(path, 'utf8') !== out) fs.writeFileSync(path, out)
console.log(`manifest: ${manifest.length} lessons`)

// ---- search index: [kind, path, title, context label, searchable text]. Loaded lazily when search is first opened.
const plain = (t) => String(t ?? '').replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/\*\*|`|\*/g, '').replace(/\s+/g, ' ').trim()
const code = Object.fromEntries(MODULES.map((m) => [m.id, m]))
const refTables = JSON.parse(fs.readFileSync(new URL('../src/reference/data.json', import.meta.url), 'utf8'))
const dsTitle = Object.fromEntries(DATASETS.map((d) => [d.id, d.title]))
const entries = [
  ...ALL_LESSONS.map((l) => ['lesson', `/${l.module}/${l.slug}`, plain(l.title), `${code[l.module].code} · ${code[l.module].title}`,
    plain([...l.tldr, l.visualizer.title, ...l.playground.presets.map((p) => p.label), l.production.title, ...l.pitfalls.map((p) => p.title), ...l.pointers].join(' · '))]),
  ...EXERCISES.map((e) => ['exercise', `/cookbook/${e.id}`, plain(e.title), `Cookbook · ${e.level} · ${dsTitle[e.dataset] ?? e.dataset}`, plain(`${e.topic} · ${e.task}`)]),
  ...GUIDE_RULES.map((r) => ['rule', `/guide?r=${r.id}`, plain(r.rule), `Production guide · ${GUIDE_CATEGORIES.find((c) => c.id === r.category)?.title ?? r.category}`, plain([r.why, r.id.replace(/-/g, ' '), ...r.learn.map((p) => ALL_LESSONS.find((l) => `/${l.module}/${l.slug}` === p)?.title ?? '')].join(' · '))]),
  ...refTables.map((t) => ['reference', `/reference/${t.id}`, plain(t.title), `Reference · ${t.rows.length} rows`, plain(t.description)]),
  ...refTables.flatMap((t) => t.rows.map((r) => ['row', `/reference/${t.id}?q=${encodeURIComponent(plain(r[0]))}`, plain(r[0]), `Reference · ${plain(t.title)}`, plain(r.slice(1).join(' · ')).slice(0, 100)])),
]
const dir = new URL('../src/search/', import.meta.url)
fs.mkdirSync(dir, { recursive: true })
const sOut = JSON.stringify(entries)
const sPath = new URL('index.json', dir)
if (!fs.existsSync(sPath) || fs.readFileSync(sPath, 'utf8') !== sOut) fs.writeFileSync(sPath, sOut)
console.log(`search index: ${entries.length} entries (${Math.round(sOut.length / 1024)} kB)`)
