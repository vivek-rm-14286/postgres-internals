// Exports the site's content as JSON for the pg-internals MCP server (../mcp/data/).
//   lessons.json    every lesson's text fields + playground (setup, presets) — no React components
//   reference.json  the Reference tables
//   notes.json      searchable knowledge chunks: per-module lesson plans + distilled PostgreSQL 18 docs notes
// usage: node scripts/export-for-mcp.mjs
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const root = path.resolve(import.meta.dirname, '../..')
const out = path.join(root, 'mcp/data')
fs.mkdirSync(out, { recursive: true })

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS } = await server.ssrLoadModule('/src/lessons/all.ts')
const { MODULES } = await server.ssrLoadModule('/src/lessons/modules.ts')
await server.close()

const lessons = ALL_LESSONS.map((l) => ({
  slug: l.slug, module: l.module, order: l.order, title: l.title, tldr: l.tldr,
  visualizer: { title: l.visualizer.title, caption: l.visualizer.caption },
  playground: l.playground, production: l.production, pitfalls: l.pitfalls, pointers: l.pointers,
  url: `https://vivek-rm-14286.github.io/postgres-internals/#/${l.module}/${l.slug}`,
}))
fs.writeFileSync(path.join(out, 'lessons.json'), JSON.stringify({ modules: MODULES, lessons }))
fs.copyFileSync(path.join(root, 'app/src/reference/data.json'), path.join(out, 'reference.json'))

// Knowledge chunks, split on ### headings. Working sections (ledgers, lesson-building ideas, integration logs) are dropped.
const DROP = /^##\s+(coverage ledger|lesson ideas|tutorial integration|reusable sample schemas|discrepancies)/i
function chunk(file, kind) {
  const text = fs.readFileSync(file, 'utf8')
  const chunks = []
  let section = '', title = '', buf = [], skip = false
  const flush = () => {
    const body = buf.join('\n').trim()
    if (!skip && body.length > 80) chunks.push({ kind, file: path.basename(file), section, title: title || section, text: body })
    buf = []
  }
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line) && !/^###/.test(line)) { flush(); section = line.replace(/^##\s+/, '').trim(); title = ''; skip = DROP.test(line); continue }
    if (/^###\s/.test(line)) { flush(); title = line.replace(/^###\s+/, '').replace(/\s*\(source:[^)]*\)\s*$/i, '').trim(); continue }
    buf.push(line)
  }
  flush()
  return chunks
}
const notes = []
for (const f of fs.readdirSync(path.join(root, 'curriculum/modules')).filter((f) => /^m\d\.md$/.test(f)).sort())
  notes.push(...chunk(path.join(root, 'curriculum/modules', f), 'lesson-plan'))
for (const f of fs.readdirSync(path.join(root, 'curriculum/research')).filter((f) => /^[A-O]-.*\.md$/.test(f)).sort())
  notes.push(...chunk(path.join(root, 'curriculum/research', f), 'docs'))
fs.writeFileSync(path.join(out, 'notes.json'), JSON.stringify(notes))

const kb = (f) => Math.round(fs.statSync(path.join(out, f)).size / 1024) + ' kB'
console.log(`lessons: ${lessons.length} (${kb('lessons.json')}), reference tables: ${JSON.parse(fs.readFileSync(path.join(out, 'reference.json'))).length} (${kb('reference.json')}), note chunks: ${notes.length} (${kb('notes.json')})`)
