// Headless-Chromium smoke test of the BUILT site, served from a sub-path like GitHub Pages (/<repo>/).
// For every lesson: load the route, step the visualizer, wait for PGlite to boot, run the first preset,
// and assert results render with no console errors and no failed requests.
// usage: npm run build && node scripts/smoke.mjs [slug-filter]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const DIST = path.resolve('dist')
const BASE = '/postgres-internals/'
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.gz': 'application/gzip', '.json': 'application/json' }
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (!url.startsWith(BASE)) { res.writeHead(404); return res.end() }
  let f = path.join(DIST, url.slice(BASE.length) || 'index.html')
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
}).listen(0)
const origin = `http://localhost:${srv.address().port}${BASE}`

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ALL_LESSONS: LESSONS } = await vite.ssrLoadModule('/src/lessons/all.ts')
const { EXERCISES } = await vite.ssrLoadModule('/src/cookbook/registry.ts')
await vite.close()
const filter = process.argv[2]
const lessons = LESSONS.filter((l) => !filter || l.slug.includes(filter) || l.module === filter)

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
let failures = 0

async function check(route, fn) {
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push('requestfailed: ' + r.url()) })
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`) })
  const t0 = Date.now()
  try {
    await page.goto(origin + '#' + route, { waitUntil: 'load' })
    await fn(page)
  } catch (e) { errors.push('assert: ' + e.message.split('\n')[0]) }
  if (errors.length) { failures++; console.log(`  ✗ ${route}\n      ${errors.slice(0, 5).join('\n      ')}`) }
  else console.log(`  ✓ ${route} (${Date.now() - t0} ms)`)
  await page.close()
}

await check('/', async (p) => { await p.getByText('Learn PostgreSQL, from first query to internals.').waitFor({ timeout: 10000 }) })
await check('/reference', async (p) => { await p.locator('table').first().waitFor({ timeout: 10000 }) })
for (const l of lessons) {
  await check(`/${l.module}/${l.slug}`, async (p) => {
    await p.locator('[data-testid=lesson]').waitFor({ timeout: 10000 })
    for (let i = 0; i < 3; i++) { const b = p.locator('[data-testid=viz-next]').first(); if (await b.count() && await b.isEnabled()) await b.click() }
    const pg = p.locator('[data-testid=playground]')
    await pg.scrollIntoViewIfNeeded()
    await p.locator('[data-testid=playground][data-status=ready]').waitFor({ timeout: 60000 })
    await p.locator('[data-testid=run]').click()
    await p.locator('[data-testid=results]').waitFor({ timeout: 30000 })
    const err = await p.locator('[data-testid=results] .text-dead').count()
    if (err) throw new Error('first preset returned an SQL error: ' + (await p.locator('[data-testid=results] .text-dead').first().innerText()))
  })
}
// Cookbook: one exercise per dataset × level, end to end in the browser (solution → Check → "Correct")
if (!filter || filter === 'cookbook') {
  await check('/cookbook', async (p) => { await p.getByText('Practise SQL, beginner to expert').waitFor({ timeout: 10000 }) })
  const seen = new Set()
  for (const e of EXERCISES) {
    const k = e.dataset + e.level
    if (seen.has(k)) continue
    seen.add(k)
    await check(`/cookbook/${e.id}`, async (p) => {
      await p.locator('[data-testid=exercise]').waitFor({ timeout: 10000 })
      await p.locator('[data-testid=show-solution]').click()
      await p.getByText('Copy into the editor').click()
      await p.locator('[data-testid=check]').click()
      const v = p.locator('[data-testid=verdict]')
      await v.waitFor({ timeout: 60000 })
      if ((await v.getAttribute('data-ok')) !== 'true') throw new Error('solution not accepted in the browser: ' + (await v.innerText()))
    })
  }
}
await browser.close()
srv.close()
console.log(failures ? `\n${failures} route(s) failed` : `\nAll routes pass.`)
process.exit(failures ? 1 : 0)
