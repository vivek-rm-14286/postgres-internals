// Writes src/lessons/manifest.json (slug, module, order, title, file) from the lesson files.
// Runs automatically before dev and build, so the manifest can never drift from the lessons.
import fs from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS } = await server.ssrLoadModule('/src/lessons/all.ts')
await server.close()

const manifest = ALL_LESSONS.map(({ slug, module, order, title, file }) => ({ slug, module, order, title, file }))
const out = JSON.stringify(manifest, null, 1) + '\n'
const path = new URL('../src/lessons/manifest.json', import.meta.url)
if (!fs.existsSync(path) || fs.readFileSync(path, 'utf8') !== out) fs.writeFileSync(path, out)
console.log(`manifest: ${manifest.length} lessons`)
