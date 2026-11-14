// Screenshot a page or one element: node scripts/screenshot.mjs <url> <out.png> [width] [light|dark] [viz-next clicks] [css selector]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const [,, url, out, w = '1280', theme = 'dark', clicks = '0', sel = ''] = process.argv
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w, height: 900 }, colorScheme: theme })
await p.goto(url, { waitUntil: 'networkidle' })
for (let i = 0; i < +clicks; i++) await p.locator('[data-testid=viz-next]').first().click()
await p.waitForTimeout(900)
if (sel) await p.locator(sel).first().screenshot({ path: out })
else await p.screenshot({ path: out, fullPage: false })
await b.close()
