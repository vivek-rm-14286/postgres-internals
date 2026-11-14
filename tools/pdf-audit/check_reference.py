#!/usr/bin/env python3
"""
Cross-check the site's Reference tables against the official PostgreSQL PDF.

  1. Download the PDF:   curl -LO https://www.postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf
  2. Extract the text:   (cd tools/pdf-audit && npm i pdfjs-dist@4) && node tools/pdf-audit/extract.mjs postgresql-18-A4.pdf <outdir>
  3. Run this script:    python3 tools/pdf-audit/check_reference.py <outdir>/postgresql-18.txt <outdir>/outline.txt

Checks: every PDF outline entry exists in the crawled HTML docs (sources/postgresql-18.7-docs); every SQLSTATE,
catalog, view, statistics view, SQL command, glossary term, data type and configuration parameter in
app/src/reference/data.json appears in the PDF; and each parameter's documented default is found in its own
entry. Defaults the PDF never states in a sentence should then be compared with pg_settings.boot_val.
(November 2026 result on 18.7: 4030/4030 outline entries found; all names confirmed; no default contradicted.)
"""
import json, os, re, sys, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
pdf_txt, outline_txt = sys.argv[1], sys.argv[2]
flat = re.sub(r'\s+', ' ', open(pdf_txt, encoding='utf8').read())
ref = {t['id']: t for t in json.load(open(os.path.join(ROOT, 'app/src/reference/data.json'), encoding='utf8'))}

def norm(s):
    s = unicodedata.normalize('NFKC', s).replace('—', '-').replace('–', '-').replace('’', "'")
    return re.sub(r'\s+', ' ', s).strip().lower()

# 1. outline coverage against the crawled HTML text
docs_dir = os.path.join(ROOT, 'sources/postgresql-18.7-docs')
crawl = ' '.join(norm(open(os.path.join(docs_dir, f), encoding='utf8', errors='ignore').read()) for f in os.listdir(docs_dir) if f.endswith('.txt'))
outline = [l.strip() for l in open(outline_txt, encoding='utf8') if l.strip()]
missing = []
for t in outline:
    n = norm(t)
    bare = re.sub(r'^([ivxlcdm]+\.|[a-z]?\.?[\d.]+\.?|part [ivx]+\.|appendix [a-z]\.|chapter \d+\.)\s*', '', n)
    if n not in crawl and not (bare and bare in crawl):
        missing.append(t)
print(f'outline entries: {len(outline)}, found in crawl: {len(outline) - len(missing)}')
for m in missing[:40]: print('  missing:', m)

# 2. names in the Reference tables
def check(name, rows, pattern):
    bad = [r[0] for r in rows if not re.search(pattern(r), flat, re.I if name == 'glossary' else 0)]
    print(f'{name}: {len(rows) - len(bad)}/{len(rows)} confirmed' + (f'; not found: {bad[:15]}' if bad else ''))

check('error codes', ref['error-codes']['rows'], lambda r: re.escape(r[0]) + r'\s+' + re.escape(r[1]))
check('system catalogs', ref['system-catalogs']['rows'], lambda r: r'\b' + re.escape(r[0]) + r'\b')
check('system views', ref['system-views']['rows'], lambda r: r'\b' + re.escape(r[0]) + r'\b')
check('statistics views', ref['statistics-views']['rows'], lambda r: r'\b' + re.escape(r[0].split()[0]) + r'\b')
check('sql commands', ref['sql-commands']['rows'], lambda r: re.escape(r[0]))
check('glossary', ref['glossary']['rows'], lambda r: re.escape(r[0].split(' (')[0]))
check('data types', ref['data-types']['rows'], lambda r: re.escape(r[0].split(' (')[0].split(' [')[0].strip('`')))
types = r'(?:integer|boolean|string|enum|floating point|real|timestamp|pg_lsn)'
check('config parameters', ref['config-parameters']['rows'], lambda r: r'(?<![\w.])' + re.escape(r[0]) + r' (?:\(' + types + r"\)|= ')")

# 3. each parameter's default inside its own doc entry
rows = ref['config-parameters']['rows']
hdr = re.compile(r'(?<![\w.])(' + '|'.join(sorted(map(re.escape, [r[0] for r in rows]), key=len, reverse=True)) + r') (\(' + types + r"\)|= ')")
pos = [(m.start(), m.group(1)) for m in hdr.finditer(flat)]
seg = {}
for i, (p, n) in enumerate(pos):
    if n not in seg:
        seg[n] = flat[p:min(pos[i + 1][0] if i + 1 < len(pos) else len(flat), p + 4000)].lower()
words = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '5': 'five', '8': 'eight', '10': 'ten', '100': 'one hundred', '1000': 'one thousand'}
ok = empty = 0
review = []
for name, default, *_ in rows:
    core = re.sub(r'\([^)]*\)', '', default.replace('**', '').replace('`', '')).strip()
    core = re.sub(r'^(typically|normally)\s+', '', core, flags=re.I).split(' ')[0].strip("'\",;").lower()
    if not core or core in ("''", '—'):
        empty += 1
        continue
    s = seg.get(name, '')
    num = re.fullmatch(r'(-?[\d.]+)\s*[a-z]*', core)
    if core in s or (num and (re.search(r'(?<![\w.])' + re.escape(num.group(1).rstrip('0').rstrip('.') if '.' in num.group(1) else num.group(1)) + r'(?!\d)', s) or words.get(num.group(1), '#') in s)):
        ok += 1
    else:
        review.append(f'{name}: ours {default!r}')
print(f'defaults: {ok} found in their doc entry, {empty} empty-string defaults, {len(review)} to compare with pg_settings.boot_val')
for r in review: print('  review:', r)
