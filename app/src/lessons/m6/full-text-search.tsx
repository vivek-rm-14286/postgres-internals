import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { TRY_SQL } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the full-text pipeline (document → tokens → lexemes → tsvector) and a GIN lookup
 * (tsquery → entry per lexeme → posting lists combined). Every token, lexeme, position, tsvector and
 * tsquery below was captured from PostgreSQL 18.6 (PGlite) with ts_debug('english', …),
 * to_tsvector('english', …) and websearch_to_tsquery('english', …) on the playground documents.
 * The match sets were verified with `tsv @@ query` on the same rows.
 * ---------------------------------------------------------------------------------------------- */

type Tok = [string, string, string[]] // alias, token, lexemes ([] = stop word)
const DOCS: { id: number; body: string; toks: Tok[]; tsv: string }[] = [
  { id: 1, body: 'PostgreSQL stores rows in 8 KB pages', tsv: "'8':5 'kb':6 'page':7 'postgresql':1 'row':3 'store':2",
    toks: [['asciiword', 'PostgreSQL', ['postgresql']], ['asciiword', 'stores', ['store']], ['asciiword', 'rows', ['row']], ['asciiword', 'in', []], ['uint', '8', ['8']], ['asciiword', 'KB', ['kb']], ['asciiword', 'pages', ['page']]] },
  { id: 2, body: 'Vacuum removes dead rows and frees the pages', tsv: "'dead':3 'free':6 'page':8 'remov':2 'row':4 'vacuum':1",
    toks: [['asciiword', 'Vacuum', ['vacuum']], ['asciiword', 'removes', ['remov']], ['asciiword', 'dead', ['dead']], ['asciiword', 'rows', ['row']], ['asciiword', 'and', []], ['asciiword', 'frees', ['free']], ['asciiword', 'the', []], ['asciiword', 'pages', ['page']]] },
  { id: 3, body: 'An index lets the planner skip most pages', tsv: "'index':2 'let':3 'page':8 'planner':5 'skip':6",
    toks: [['asciiword', 'An', []], ['asciiword', 'index', ['index']], ['asciiword', 'lets', ['let']], ['asciiword', 'the', []], ['asciiword', 'planner', ['planner']], ['asciiword', 'skip', ['skip']], ['asciiword', 'most', []], ['asciiword', 'pages', ['page']]] },
  { id: 4, body: 'The planner estimates rows from statistics', tsv: "'estim':3 'planner':2 'row':4 'statist':6",
    toks: [['asciiword', 'The', []], ['asciiword', 'planner', ['planner']], ['asciiword', 'estimates', ['estim']], ['asciiword', 'rows', ['row']], ['asciiword', 'from', []], ['asciiword', 'statistics', ['statist']]] },
  { id: 5, body: 'Indexes on text columns speed up searching', tsv: "'column':4 'index':1 'search':7 'speed':5 'text':3",
    toks: [['asciiword', 'Indexes', ['index']], ['asciiword', 'on', []], ['asciiword', 'text', ['text']], ['asciiword', 'columns', ['column']], ['asciiword', 'speed', ['speed']], ['asciiword', 'up', []], ['asciiword', 'searching', ['search']]] },
  { id: 6, body: 'Searching text with LIKE cannot rank results', tsv: "'cannot':5 'like':4 'rank':6 'result':7 'search':1 'text':2",
    toks: [['asciiword', 'Searching', ['search']], ['asciiword', 'text', ['text']], ['asciiword', 'with', []], ['asciiword', 'LIKE', ['like']], ['asciiword', 'cannot', ['cannot']], ['asciiword', 'rank', ['rank']], ['asciiword', 'results', ['result']]] },
]

/** lexeme → doc → positions, parsed from the captured tsvector strings */
const POS = new Map<string, Map<number, number[]>>()
for (const d of DOCS) for (const m of d.tsv.matchAll(/'([^']+)':([\d,]+)/g)) {
  if (!POS.has(m[1])) POS.set(m[1], new Map())
  POS.get(m[1])!.set(d.id, m[2].split(',').map(Number))
}
const LEXEMES = [...POS.keys()].sort()
const docsOf = (l: string) => [...(POS.get(l)?.keys() ?? [])].sort((a, b) => a - b)

type Op = 'one' | 'and' | 'or' | 'andnot' | 'phrase'
const QUERIES: { input: string; tsq: string; terms: string[]; op: Op; text: string }[] = [
  { input: 'pages', tsq: "'page'", terms: ['page'], op: 'one', text: '`pages` is stemmed to the lexeme **page**. One GIN entry, one posting list: docs 1, 2, 3.' },
  { input: 'indexes', tsq: "'index'", terms: ['index'], op: 'one', text: 'The stemmer maps both **index** and **Indexes** to `index`, so docs 3 and 5 match although their words differ.' },
  { input: 'rows pages', tsq: "'row' & 'page'", terms: ['row', 'page'], op: 'and', text: 'Plain words are ANDed. GIN fetches two posting lists and **intersects** them: {1, 2, 4} ∩ {1, 2, 3} = {1, 2}.' },
  { input: 'searching -like', tsq: "'search' & !'like'", terms: ['search', 'like'], op: 'andnot', text: '`-like` becomes `!\'like\'`. The index fetches `search` and **subtracts** `like`, leaving doc 5.' },
  { input: '"dead rows"', tsq: "'dead' <-> 'row'", terms: ['dead', 'row'], op: 'phrase', text: 'Quotes become `<->` (followed by). GIN finds docs with both lexemes; the positions (3 then 4) are checked on the row itself, a **recheck**.' },
  { input: 'planner or vacuum', tsq: "'planner' | 'vacuum'", terms: ['planner', 'vacuum'], op: 'or', text: 'The word `or` becomes `|`: the posting lists are **unioned** into {2, 3, 4}.' },
]

function evaluate(q: (typeof QUERIES)[number]): number[] {
  const [a, b] = q.terms.map(docsOf)
  if (q.op === 'one') return a
  if (q.op === 'and') return a.filter((x) => b.includes(x))
  if (q.op === 'or') return [...new Set([...a, ...b])].sort((x, y) => x - y)
  if (q.op === 'andnot') return a.filter((x) => !b.includes(x))
  return a.filter((x) => b.includes(x) && POS.get(q.terms[0])!.get(x)!.some((p) => POS.get(q.terms[1])!.get(x)!.includes(p + 1)))
}

function FtsViz() {
  const [doc, setDoc] = useState(2)
  const [qi, setQi] = useState(0)
  const d = DOCS.find((x) => x.id === doc)!
  const q = QUERIES[qi]
  const hits = useMemo(() => evaluate(q), [q])
  const candidates = q.op === 'phrase' ? docsOf(q.terms[0]).filter((x) => docsOf(q.terms[1]).includes(x)) : hits
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Legend items={[['tuple', 'token → lexeme'], ['muted', 'stop word (dropped, position kept)'], ['new', 'GIN entry used by the query'], ['ok', 'matching document'], ['dead', 'excluded by NOT']]} />
      <Panel title="1 · to_tsvector('english', document)">
        <div className="mb-2 flex flex-wrap gap-1">
          {DOCS.map((x) => (
            <button key={x.id} onClick={() => setDoc(x.id)} className="rounded-md border px-2 py-0.5 text-xs" style={{ borderColor: x.id === doc ? tone('accent') : 'var(--border)', background: x.id === doc ? toneBg('accent', 14) : 'transparent' }}>doc {x.id}</button>
          ))}
        </div>
        <p className="mb-2 font-mono text-[13px]">“{d.body}”</p>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {d.toks.map(([alias, tok, lex], i) => {
              const stop = lex.length === 0
              const t: Tone = stop ? 'muted' : 'tuple'
              return (
                <motion.div key={`${doc}-${i}`} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="grid min-w-[64px] gap-0.5 rounded-md border px-1.5 py-1 text-center font-mono text-[11.5px]" style={{ borderColor: tone(t), background: toneBg(t, 10), opacity: stop ? 0.7 : 1 }}>
                  <span className="text-[10px] text-muted">pos {i + 1} · {alias}</span>
                  <span>{tok}</span>
                  <span className="text-[10px] text-muted">{alias === 'uint' ? 'simple' : 'english_stem'}</span>
                  <span className="font-bold" style={{ color: stop ? 'var(--muted)' : tone('tuple') }}>{stop ? 'stop word' : lex[0]}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <p className="mt-2 font-mono text-[12px]">tsvector: <span style={{ color: tone.text('tuple') }}>{d.tsv}</span></p>
        <p className="mt-1 text-xs text-muted">Lexemes are sorted and deduplicated, each with its word positions. Stop words vanish but still use up a position, which is why positions skip numbers.</p>
      </Panel>
      <Panel title="2 · websearch_to_tsquery('english', input) → GIN lookup">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button onClick={() => setQi((qi + 1) % QUERIES.length)} data-testid="viz-next" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Next query ({qi + 1}/{QUERIES.length})</button>
          <span className="font-mono text-[13px]">input <b>{q.input}</b> → tsquery <b style={{ color: tone.text('new') }}>{q.tsq}</b></span>
        </div>
        <div className="mb-2 min-h-10 rounded-md bg-surface-2 px-3 py-1.5 text-sm"><AnimatePresence mode="wait"><motion.p key={qi} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Md>{q.text}</Md></motion.p></AnimatePresence></div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">GIN entry tree: lexeme → posting list (doc ids)</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11.5px] sm:grid-cols-3">
              {LEXEMES.map((l) => {
                const used = q.terms.includes(l)
                const neg = used && q.op === 'andnot' && l === q.terms[1]
                return (
                  <motion.div key={l} layout animate={{ scale: used ? 1.04 : 1 }} className="flex justify-between gap-1 rounded px-1"
                    style={used ? { background: toneBg(neg ? 'dead' : 'new', 24), outline: `1px solid ${tone(neg ? 'dead' : 'new')}` } : { opacity: 0.6 }}>
                    <span>{l}</span><span className="text-muted">[{docsOf(l).join(',')}]</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
          <div className="grid content-start gap-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">result</p>
            {DOCS.map((x) => {
              const hit = hits.includes(x.id)
              const cand = candidates.includes(x.id)
              const t: Tone = hit ? 'ok' : cand ? 'new' : 'muted'
              return (
                <motion.div key={x.id} layout className="flex items-center justify-between gap-2 rounded-md border px-2 py-0.5 text-[12px]"
                  style={{ borderColor: hit || cand ? tone(t) : 'var(--border)', background: hit ? toneBg('ok', 14) : 'transparent', opacity: hit || cand ? 1 : 0.55 }}>
                  <span className="truncate">doc {x.id}: {x.body}</span>
                  {hit ? <Tag t="ok">match</Tag> : cand ? <Tag t="new">recheck fails</Tag> : null}
                </motion.div>
              )
            })}
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'full-text-search',
  module: 'm6',
  order: 7,
  title: 'Full-text search',
  tldr: [
    '**Full-text search** turns documents into a `tsvector` of normalized, positioned **lexemes** and queries into a `tsquery` of lexemes joined by AND, OR, NOT and FOLLOWED BY, then matches them with `@@`.',
    'It exists because `LIKE` and regular expressions know nothing about language: they cannot match "indexes" to "index", skip stop words, rank results, or use an index for word searches.',
  ],
  visualizer: {
    title: 'From words to lexemes to a GIN lookup',
    caption: 'Pick a document to see the parser and dictionary at work, then click **Next query** to watch GIN combine posting lists. Every token, lexeme and position is exactly what `ts_debug` and `to_tsvector` return for these documents.',
    Component: FtsViz,
  },
  playground: {
    setup: `
CREATE TABLE docs (
  id int PRIMARY KEY,
  title text,
  body text NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', body), 'D')
  ) STORED
);
INSERT INTO docs (id, title, body) VALUES
  (1, 'Pages', 'PostgreSQL stores rows in 8 KB pages'),
  (2, 'Vacuum', 'Vacuum removes dead rows and frees the pages'),
  (3, 'Indexes', 'An index lets the planner skip most pages'),
  (4, 'Planner', 'The planner estimates rows from statistics'),
  (5, 'Search speed', 'Indexes on text columns speed up searching'),
  (6, 'LIKE', 'Searching text with LIKE cannot rank results');
INSERT INTO docs (id, title, body)
SELECT g, 'note ' || g,
       (ARRAY['buffers','replicas','locks','tuples','backups','queries'])[1 + g % 6] || ' and ' ||
       (ARRAY['checkpoints','snapshots','sequences','triggers','schemas'])[1 + g % 5] || ' in note ' || g
FROM generate_series(7, 5000) g;
CREATE INDEX docs_tsv_gin ON docs USING gin (tsv);
ANALYZE docs;
${TRY_SQL}`,
    presets: [
      { label: 'Document → tsvector', sql: `SELECT id, body, to_tsvector('english', body) AS tsv FROM docs WHERE id <= 6 ORDER BY id;

SELECT alias, token, dictionary, lexemes
FROM ts_debug('english', 'Indexes on text columns speed up searching');

SELECT word, ndoc, nentry FROM ts_stat('SELECT tsv FROM docs WHERE id <= 6')
ORDER BY ndoc DESC, word LIMIT 8;`,
        note: '`ts_debug` shows each token, its type, the dictionary that handled it and the lexemes produced. `{}` means **stop word**: `on` and `up` are dropped, yet positions skip them. `ts_stat` counts documents and occurrences per lexeme: `page` and `row` lead with 3 documents each, and `search` counts "Search", "searching" and "Searching" as one lexeme.' },
      { label: 'Four ways to build a tsquery', sql: `SELECT to_tsquery('english', 'dead & rows') AS to_tsquery,
       plainto_tsquery('english', 'dead rows') AS plainto,
       phraseto_tsquery('english', 'dead rows') AS phraseto,
       websearch_to_tsquery('english', '"dead rows" or vacuum -index') AS websearch;`,
        note: '`to_tsquery` needs operator syntax; `plainto` ANDs words; `phraseto` uses `<->`; `websearch_to_tsquery` understands quotes, `or` and `-` and never raises a syntax error.' },
      { label: 'tsquery operators, and two that do not exist', sql: `SELECT to_tsquery('english', 'plan:*') AS prefix,
       to_tsquery('english', 'dead <-> rows') AS phrase,
       to_tsquery('english', 'pages & !vacuum') AS negation;

SELECT id, body FROM docs WHERE tsv @@ to_tsquery('english', 'plan:*') ORDER BY id;
SELECT id, body FROM docs WHERE tsv @@ to_tsquery('english', 'pages & !vacuum') ORDER BY id;

SELECT try_sql($$SELECT to_tsquery('english', '"dead rows"')$$) AS double_quotes,
       try_sql($$SELECT to_tsquery('english', 'pages -vacuum')$$) AS minus_sign;`,
        note: '`:*` is a **prefix** match (`plan` finds "planner"), `<->` is FOLLOWED BY, `!` is NOT. Double quotes and a leading `-` are **websearch** syntax only: `to_tsquery` rejects both with a syntax error.' },
      { label: 'Match with the GIN index', sql: `EXPLAIN (COSTS OFF)
SELECT id, body FROM docs WHERE tsv @@ websearch_to_tsquery('english', '"dead rows"');

SELECT id, body FROM docs WHERE tsv @@ websearch_to_tsquery('english', '"dead rows"');
SELECT id, body FROM docs WHERE tsv @@ websearch_to_tsquery('english', 'planner or vacuum') ORDER BY id;`,
        note: 'A **Bitmap Index Scan on docs_tsv_gin** finds candidate rows; the `Recheck Cond` verifies them on the heap (needed here for the phrase positions).' },
      { label: 'Ranking with weights', sql: `SELECT id, title,
       ts_rank(tsv, q) AS rank,
       ts_rank_cd(tsv, q) AS rank_cd
FROM docs, websearch_to_tsquery('english', 'indexes') q
WHERE tsv @@ q
ORDER BY rank DESC;`,
        note: 'Both docs contain `index`, but doc 3 also has it in its **title** (weight A = 1.0 versus D = 0.1), so it ranks higher. Ranking reads every matching tsvector, so rank only what you filtered.' },
      { label: 'Highlighting', sql: `SELECT id, ts_headline('english', body, q, 'StartSel=[, StopSel=]') AS snippet
FROM docs, websearch_to_tsquery('english', 'rows pages') q
WHERE tsv @@ q ORDER BY id;`,
        note: '`ts_headline` re-parses the **original text**, not the tsvector, so it is slow on long documents. Its output is not HTML-escaped.' },
      { label: 'Expression index: error, then fix', sql: `-- 1. The one-argument form depends on default_text_search_config.
SELECT try_sql('CREATE INDEX docs_body_bad ON docs USING gin (to_tsvector(body))') AS one_arg_index;

-- 2. Fix: name the configuration.
CREATE INDEX docs_body_fts ON docs USING gin (to_tsvector('english', body));

-- 3. Re-run: only the matching expression uses it.
EXPLAIN (COSTS OFF) SELECT id FROM docs WHERE to_tsvector(body) @@ to_tsquery('english', 'vacuum');
EXPLAIN (COSTS OFF) SELECT id FROM docs WHERE to_tsvector('english', body) @@ to_tsquery('english', 'vacuum');

-- 4. Catalog peek: two GIN indexes now cover the same text.
SELECT indexrelid::regclass AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid = 'docs'::regclass ORDER BY 1;`,
        note: 'The one-argument `to_tsvector` is only STABLE, so indexing it fails: **functions in index expression must be marked IMMUTABLE**. With `\'english\'` it builds, but a query written with the one-argument form still runs a **Seq Scan**; only the identical expression gets the Bitmap Index Scan. An expression index saves the stored column but makes every query repeat the expression.' },
      { label: 'Cast vs to_tsvector', sql: `SELECT 'fat cats ate fat rats'::tsvector AS cast_value,
       to_tsvector('english', 'fat cats ate fat rats') AS parsed,
       'fat cats ate fat rats'::tsvector @@ to_tsquery('english', 'fat & rat') AS cast_matches,
       to_tsvector('english', 'fat cats ate fat rats') @@ to_tsquery('english', 'fat & rat') AS parsed_matches;`,
        note: 'A cast only splits on spaces: no stemming, so `rats` never equals `rat`. Always build tsvectors with `to_tsvector`.' }
    ],
  },
  production: {
    title: 'Replacing ILIKE search in a help-center',
    context: 'A help-center searched 400,000 articles with `WHERE body ILIKE \'%\' || $1 || \'%\'`, sorted by date.',
    problem: 'Every search scanned the whole table. A search for "indexes" missed articles that only said "index", and results came back in date order, not by relevance.',
    solution: 'Add a **stored generated tsvector column** that weights the title above the body, index it with **GIN**, query with `websearch_to_tsquery` (safe for raw user input) and order by `ts_rank`. Highlight snippets only for the page of results shown.',
    sql: `ALTER TABLE articles ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'D')) STORED;
CREATE INDEX CONCURRENTLY articles_tsv_gin ON articles USING gin (tsv);

SELECT id, title, ts_rank(tsv, q) AS rank
FROM articles, websearch_to_tsquery('english', $1) q
WHERE tsv @@ q
ORDER BY rank DESC LIMIT 20;`,
    outcome: 'Searches use a Bitmap Index Scan on the GIN index instead of a full scan, stemming connects word forms, and title hits rank first. In the playground, the same pattern over 5,000 rows plans as `Bitmap Index Scan on docs_tsv_gin`, and the title-weighted doc 3 outranks doc 5 for "indexes".',
  },
  pitfalls: [
    { title: 'The index is never used',
      symptom: '`WHERE to_tsvector(body) @@ q` runs a Seq Scan even though an expression GIN index exists.',
      cause: 'An expression index must use the **two-argument** form with an explicit configuration, and the query must use the same expression. The one-argument form depends on `default_text_search_config`, which can change, so it cannot be indexed.',
      fix: 'Write `to_tsvector(\'english\', body)` in both the index and the query, or index a generated tsvector column and query that column.' },
    { title: 'Casting text to tsvector',
      symptom: 'Searches for "rat" do not find documents that contain "rats".',
      cause: '`\'…\'::tsvector` takes the text as already-normalized lexemes. It does no stemming and no stop-word removal.',
      fix: 'Build documents with `to_tsvector(config, text)` and queries with `websearch_to_tsquery` or `to_tsquery`.' },
    { title: 'Ranking every match',
      symptom: 'A broad search ("the product") with `ORDER BY ts_rank(...)` is slow even with a GIN index.',
      cause: 'GIN finds matches quickly, but **ranking has to read the tsvector of every matching row** before it can sort.',
      fix: 'Narrow first (date range, category), cap the candidate set in a subquery with LIMIT, or accept GIN order for very broad queries.' },
    { title: 'Language-specific stemming of names and codes',
      symptom: 'Product codes and names match too much or too little, for example "Pari" matching "Paris".',
      cause: 'The `english` Snowball stemmer stems everything it recognizes, including proper nouns.',
      fix: 'Use the `simple` configuration for codes and names, or put a synonym dictionary before the stemmer for protected words.' },
    { title: 'Writing web-search syntax into to_tsquery',
      symptom: '`ERROR: syntax error in tsquery` as soon as a user types a quoted phrase, or a search for `pages -vacuum` fails instead of excluding vacuum.',
      cause: 'A common claim is that tsquery uses double quotes for phrases, a trailing `:` for prefixes and `-` for NOT. In `to_tsquery` the phrase operator is `<->` (or `<N>`), the prefix marker is `:*`, and negation is `!`. Quotes, `or` and `-` exist only in `websearch_to_tsquery`.',
      fix: 'Pass raw user input to `websearch_to_tsquery`, which never raises. Use `to_tsquery` only for queries your code builds, with `&`, `|`, `!`, `<->` and `:*`.',
      sql: `SELECT websearch_to_tsquery('english', '"dead rows" -vacuum'),
       to_tsquery('english', 'dead <-> row & !vacuum & plan:*');` },
    { title: 'Leaving out STORED on the tsvector column',
      symptom: '`CREATE INDEX … USING gin (tsv)` fails with `indexes on virtual generated columns are not supported`.',
      cause: 'In PostgreSQL 18 a generated column is **VIRTUAL** by default: computed on every read, never written to disk (`attgenerated = v`). Virtual columns cannot be indexed, so the GIN index has nothing to store.',
      fix: 'Write `GENERATED ALWAYS AS (…) STORED` for a search column, or skip the column and index the expression `to_tsvector(\'english\', body)` directly.',
      sql: `ALTER TABLE articles ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(body, ''))) STORED;` },
  ],
  pointers: [
    'Pipeline: **parser** splits tokens → **dictionaries** normalize to lexemes and drop stop words → **tsvector** of sorted lexemes with positions.',
    'Build queries with `websearch_to_tsquery` for user input: quotes → `<->`, `or` → `|`, `-` → `!`, no syntax errors.',
    'Index with **GIN** (one entry per lexeme, posting lists) on a **stored generated tsvector column**, or on `to_tsvector(\'config\', col)` with the same expression in queries. **GiST** also works (`USING gist (tsv)`): a lossy signature per row that is cheaper to update, but every match is rechecked and it slows down as distinct lexemes grow, so GIN is the usual choice.',
    '**Weights** A–D (default 1.0, 0.4, 0.2, 0.1) let titles outrank bodies in `ts_rank` and `ts_rank_cd`.',
    'Phrase (`<->`) and weighted queries need the row\'s tsvector, so GIN results are **rechecked**.',
  ],
  sources: ['textsearch-intro.html', 'textsearch-controls.html', 'textsearch-tables.html', 'textsearch-indexes.html', 'textsearch-dictionaries.html', 'textsearch-limitations.html'],
}
