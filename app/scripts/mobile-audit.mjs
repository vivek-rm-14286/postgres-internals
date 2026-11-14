// Phone-width overflow audit: node scripts/mobile-audit.mjs <base-url> <screenshot-dir> <route…>; every route must report "doc":390
// Mobile audit: for each route at phone width, screenshot full page and report horizontal overflow culprits.
import { chromium, devices } from 'playwright'
const [,, base, outdir, ...routes] = process.argv
const b = await chromium.launch()
const ctx = await b.newContext({ ...devices['iPhone 13'] })
for (const r of routes) {
  const p = await ctx.newPage()
  await p.goto(base + '#' + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  const info = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const doc = document.documentElement.scrollWidth
    const offenders = []
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect()
      if (rect.right > vw + 1 && rect.width > 0) {
        // skip elements inside a horizontal scroller (intended)
        let a = el.parentElement, scrolls = false
        while (a) { const s = getComputedStyle(a); if ((s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden') && a.clientWidth < a.scrollWidth + 1) { scrolls = true; break } a = a.parentElement }
        if (!scrolls) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(rect.right)}`)
      }
    }
    return { vw, doc, offenders: offenders.slice(0, 8) }
  })
  console.log(r, JSON.stringify(info))
  await p.screenshot({ path: `${outdir}/mob${r.replace(/\//g, '_') || '_home'}.png`, fullPage: false })
  await p.close()
}
await b.close()
