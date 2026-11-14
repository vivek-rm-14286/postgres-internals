// Extract the PDF outline (TOC) and the full text, page by page.
import fs from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
const [, , pdfPath, outDir] = process.argv
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0 }).promise
const meta = await doc.getMetadata()
console.log('pages', doc.numPages, 'title', meta.info?.Title, 'created', meta.info?.CreationDate)
// outline
const outline = await doc.getOutline()
const flat = []
const walk = (items, depth) => { for (const it of items ?? []) { flat.push('  '.repeat(depth) + it.title); walk(it.items, depth + 1) } }
walk(outline, 0)
fs.writeFileSync(`${outDir}/outline.txt`, flat.join('\n'))
console.log('outline entries', flat.length)
// text
const out = fs.createWriteStream(`${outDir}/postgresql-18.txt`)
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i)
  const tc = await page.getTextContent()
  let line = '', lastY = null
  const lines = []
  for (const it of tc.items) {
    const y = it.transform?.[5]
    if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(line); line = '' }
    line += it.str; lastY = y
  }
  lines.push(line)
  out.write(`\n\f[[page ${i}]]\n` + lines.join('\n'))
  page.cleanup()
}
out.end()
await new Promise((r) => out.on('finish', r))
console.log('text bytes', fs.statSync(`${outDir}/postgresql-18.txt`).size)
