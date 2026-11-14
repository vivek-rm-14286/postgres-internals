// Render a list of URLs with headless Chromium (JS enabled) and save the main-content text.
// usage: node crawl-list.mjs <urls.txt> <outdir> <prefix-to-strip>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [, , LIST, OUT, PREFIX] = process.argv;
const urls = fs.readFileSync(LIST, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (tutorial-reader; headless Chromium)' });
await ctx.route('**/*', (r) => (['image', 'font', 'media'].includes(r.request().resourceType()) ? r.abort() : r.continue()));

const rows = []; const failed = []; let i = 0;
async function worker() {
  const page = await ctx.newPage();
  while (i < urls.length) {
    const idx = i++; const url = urls[idx];
    const name = (url.replace(PREFIX, '').replace(/^\/+|\/+$/g, '') || 'index').replace(/[^a-z0-9._-]+/gi, '__') + '.txt';
    let ok = false;
    for (let a = 0; a < 3 && !ok; a++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(800);
        const d = await page.evaluate(() => {
          const pick = document.querySelector('main article') || document.querySelector('article') || document.querySelector('main') || document.body;
          pick.querySelectorAll('nav, header, footer, aside, script, style, noscript').forEach((n) => n.remove());
          return { title: document.title, text: pick.innerText };
        });
        fs.writeFileSync(path.join(OUT, name), `URL: ${url}\nTITLE: ${d.title}\n\n${d.text}`);
        rows.push([idx, name, d.text.length, d.title.replace(/\t/g, ' '), url]);
        ok = true;
      } catch (e) { if (a === 2) failed.push(url + ' :: ' + e.message.split('\n')[0]); }
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
rows.sort((a, b) => a[0] - b[0]);
fs.writeFileSync(path.join(OUT, '_order.tsv'), rows.map((r) => r.join('\t')).join('\n'));
console.log(`DONE ok=${rows.length} failed=${failed.length} chars=${rows.reduce((s, r) => s + r[2], 0)}`);
if (failed.length) console.log(failed.join('\n'));
await browser.close();
