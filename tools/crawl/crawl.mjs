// Headless-Chromium crawl of the official PostgreSQL docs (current version).
// Renders every page under /docs/current/, saves the visible text, and writes a manifest in reading order.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const BASE = 'https://www.postgresql.org/docs/current/';
const CONC = 6;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (docs-reader; headless Chromium)' });
await ctx.route('**/*', (r) => {
  const t = r.request().resourceType();
  return ['image', 'font', 'stylesheet', 'media', 'script'].includes(t) ? r.abort() : r.continue();
});

const seen = new Set(['index.html']);
const queue = ['index.html'];
const meta = {};
let done = 0, failed = [];

async function visit(page, name) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await page.goto(BASE + name, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (!resp || resp.status() >= 400) throw new Error('HTTP ' + (resp && resp.status()));
      const data = await page.evaluate(() => {
        const root = document.querySelector('#docContent') || document.body;
        const links = [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
        const nav = (rel) => { const a = root.querySelector(`.navheader a[accesskey="${rel}"], .navfooter a[accesskey="${rel}"]`); return a ? a.getAttribute('href') : null; };
        return { title: document.title, text: root.innerText, links, next: nav('n'), prev: nav('p'), up: nav('u') };
      });
      fs.writeFileSync(path.join(OUT, name.replace(/\.html$/, '.txt')), data.text);
      meta[name] = { title: data.title.replace(/^PostgreSQL: Documentation: \d+: /, ''), next: data.next, up: data.up, chars: data.text.length };
      for (const h of data.links) {
        const f = h.split('#')[0];
        if (/^[a-z0-9._-]+\.html$/i.test(f) && !seen.has(f)) { seen.add(f); queue.push(f); }
      }
      return;
    } catch (e) {
      if (attempt === 3) failed.push(name + ' :: ' + e.message);
      else await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

let active = 0;
await new Promise((resolve) => {
  const pages = [];
  const pump = async (page) => {
    while (true) {
      const name = queue.shift();
      if (!name) { if (active === 0) return; await new Promise((r) => setTimeout(r, 200)); if (!queue.length && active === 0) return; continue; }
      active++;
      await visit(page, name);
      active--; done++;
      if (done % 100 === 0) console.log(`${done} done, ${queue.length} queued`);
    }
  };
  (async () => {
    for (let i = 0; i < CONC; i++) pages.push(await ctx.newPage());
    await Promise.all(pages.map(pump));
    resolve();
  })();
});

// reading order by following "next" links from index.html
const order = []; let cur = 'index.html'; const guard = new Set();
while (cur && meta[cur] && !guard.has(cur)) { guard.add(cur); order.push(cur); cur = meta[cur].next; }
const rest = Object.keys(meta).filter((k) => !guard.has(k));
fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify({ order, rest, meta, failed }, null, 1));
fs.writeFileSync(path.join(OUT, '_order.tsv'), order.concat(rest).map((n, i) => `${i}\t${n.replace(/\.html$/, '.txt')}\t${meta[n].chars}\t${meta[n].up || ''}\t${meta[n].title}`).join('\n'));
console.log(`DONE pages=${Object.keys(meta).length} ordered=${order.length} unordered=${rest.length} failed=${failed.length}`);
if (failed.length) console.log(failed.slice(0, 20).join('\n'));
await browser.close();
