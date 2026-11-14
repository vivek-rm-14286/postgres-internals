// Accessibility audit (axe-core) of built pages in light and dark: node scripts/a11y-audit.mjs <base-url> <screenshot-dir> <route…>
import { chromium } from 'playwright'
import fs from 'node:fs'
const [,, base, out, ...routes] = process.argv
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const b = await chromium.launch()
for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme })
  for (const r of routes) {
    const p = await ctx.newPage()
    const reqs = []
    p.on('request', (q) => { const u = new URL(q.url()); if (u.hostname !== 'localhost') reqs.push(u.hostname) })
    await p.goto(base + '#' + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
    if (scheme === 'light') await p.screenshot({ path: `${out}/d${r.replace(/\//g, '_')}.png` })
    await p.evaluate(axe)
    const res = await p.evaluate(() => axe.run(document, { resultTypes: ['violations'] }))
    console.log(scheme, r, [...new Set(reqs)].join(','), JSON.stringify(res.violations.map((v) => [v.id, v.impact, v.nodes.length, v.nodes[0].target.join(' ').slice(0, 90), (v.nodes[0].any[0]?.message ?? '').slice(0, 110)])))
    await p.close()
  }
}
await b.close()
