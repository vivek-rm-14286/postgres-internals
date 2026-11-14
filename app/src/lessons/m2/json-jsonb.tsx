import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Tag, tone, toneBg } from '../../viz/kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the same text typed into a json and a jsonb column, side by side.
 * json keeps the exact text. jsonb parses it, drops whitespace, keeps the LAST duplicate key and
 * sorts object keys by (length, then bytes). Output text and pg_column_size values were captured
 * from PostgreSQL 18. The last two steps show the items each GIN operator class extracts:
 *   jsonb_ops      one item per key and per value (string array elements count as keys)
 *   jsonb_path_ops one hash per leaf value, of the value together with the keys leading to it
 * ---------------------------------------------------------------------------------------------- */

interface Entry { k: string; v: string; vSorted?: string }
interface Sample {
  id: string; name: string; input: string; entries: Entry[]; out: string; json: number; jsonb: number
  ops: string[]; path: string[]
}

const SAMPLES: Sample[] = [
  { id: 'dup', name: 'duplicate key', input: '{"user": "ana", "plan": "pro", "user": "ana2", "tags": ["x", "y"]}',
    entries: [{ k: 'user', v: '"ana"' }, { k: 'plan', v: '"pro"' }, { k: 'user', v: '"ana2"' }, { k: 'tags', v: '["x", "y"]' }],
    out: '{"plan": "pro", "tags": ["x", "y"], "user": "ana2"}', json: 70, jsonb: 66,
    ops: ['K plan', 'K tags', 'K user', 'K x', 'K y', 'V pro', 'V ana2'], path: ['h(plan, "pro")', 'h(tags, "x")', 'h(tags, "y")', 'h(user, "ana2")'] },
  { id: 'nested', name: 'nested object', input: '{"zeta": 1, "alpha": {"b": true, "a": null}, "mid": [3, 1, 2]}',
    entries: [{ k: 'zeta', v: '1' }, { k: 'alpha', v: '{"b": true, "a": null}', vSorted: '{"a": null, "b": true}' }, { k: 'mid', v: '[3, 1, 2]' }],
    out: '{"mid": [3, 1, 2], "zeta": 1, "alpha": {"a": null, "b": true}}', json: 66, jsonb: 114,
    ops: ['K mid', 'K zeta', 'K alpha', 'K a', 'K b', 'V 1', 'V 2', 'V 3', 'V null', 'V true'], path: ['h(mid, 3)', 'h(mid, 1)', 'h(mid, 2)', 'h(zeta, 1)', 'h(alpha.a, null)', 'h(alpha.b, true)'] },
  { id: 'iot', name: 'sensor reading', input: '{"device":"t-81","temp":21.50,"temp":21.75,"ts":"2026-11-14T09:00:00Z"}',
    entries: [{ k: 'device', v: '"t-81"' }, { k: 'temp', v: '21.50' }, { k: 'temp', v: '21.75' }, { k: 'ts', v: '"2026-11-14T09:00:00Z"' }],
    out: '{"ts": "2026-11-14T09:00:00Z", "temp": 21.75, "device": "t-81"}', json: 75, jsonb: 78,
    ops: ['K ts', 'K temp', 'K device', 'V 2026-11-14T09:00:00Z', 'V 21.75', 'V t-81'], path: ['h(ts, "2026-…")', 'h(temp, 21.75)', 'h(device, "t-81")'] },
  { id: 'product', name: 'product', input: '{"id":7,"name":"Widget","price":19.90,"stock":{"warehouse":"ber","qty":3}}',
    entries: [{ k: 'id', v: '7' }, { k: 'name', v: '"Widget"' }, { k: 'price', v: '19.90' }, { k: 'stock', v: '{"warehouse": "ber", "qty": 3}', vSorted: '{"qty": 3, "warehouse": "ber"}' }],
    out: '{"id": 7, "name": "Widget", "price": 19.90, "stock": {"qty": 3, "warehouse": "ber"}}', json: 78, jsonb: 127,
    ops: ['K id', 'K name', 'K price', 'K stock', 'K qty', 'K warehouse', 'V 7', 'V Widget', 'V 19.90', 'V 3', 'V ber'], path: ['h(id, 7)', 'h(name, "Widget")', 'h(price, 19.90)', 'h(stock.qty, 3)', 'h(stock.warehouse, "ber")'] },
]

/** jsonb key order: shorter keys first, then bytewise. */
const jsonbOrder = (a: string, b: string) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)

type Phase = 'input' | 'parse' | 'dedup' | 'sort' | 'stored' | 'ops' | 'path'
interface S { phase: Phase }

function buildSteps(s: Sample): Step<S>[] {
  const keys = s.entries.map((e) => e.k)
  const hasDup = new Set(keys).size !== keys.length
  const sortedKeys = [...new Set(keys)].sort(jsonbOrder)
  return [
    { title: 'The same text, two columns', body: '`json` stores the input **byte for byte**: whitespace, key order and duplicate keys all survive. `jsonb` is about to parse it.', state: { phase: 'input' } },
    { title: 'jsonb parses into a tree', body: 'Whitespace is gone. Each key/value pair becomes a node in a binary structure, and numbers become `numeric`.', state: { phase: 'parse' } },
    { title: hasDup ? 'Duplicate keys: the last one wins' : 'No duplicate keys here', body: hasDup ? 'jsonb keeps only the **last** value for a repeated key. The earlier one is discarded at input time and can never be read back.' : 'This document has no repeated keys, so nothing is dropped. Try the "duplicate key" sample.', state: { phase: 'dedup' } },
    { title: 'Keys are sorted', body: `Object keys are stored **shorter first, then bytewise**: ${sortedKeys.map((k) => `\`${k}\``).join(', ')}. Nested objects are sorted too; array order is kept.`, state: { phase: 'sort' } },
    { title: 'Stored sizes', body: `\`pg_column_size\`: json **${s.json} B**, jsonb **${s.jsonb} B**. jsonb adds per-node headers and offsets, so small documents are often *bigger*. It wins on processing: no reparsing on every access.`, state: { phase: 'stored' } },
    { title: 'GIN jsonb_ops: keys and values', body: `The default opclass emits **one item per key and per value**: ${s.ops.length} items. It supports \`?\`, \`?|\`, \`?&\`, \`@>\`, \`@?\` and \`@@\`.`, state: { phase: 'ops' } },
    { title: 'GIN jsonb_path_ops: path hashes', body: `One hash per leaf value, mixing in the keys on its path: **${s.path.length} items**. Smaller and more selective for \`@>\`, but it cannot answer \`?\` (key exists).`, state: { phase: 'path' } },
  ]
}

function Kv({ k, v, t, strike }: { k: string; v: string; t: 'tuple' | 'new' | 'dead' | 'muted'; strike?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[12px]" style={{ borderColor: tone(t), background: toneBg(t, 14), textDecoration: strike ? 'line-through' : undefined }}>
      <span className="font-semibold">"{k}"</span><span className="text-muted">:</span><span>{v}</span>
    </span>
  )
}

function JsonView({ s, phase }: { s: Sample; phase: Phase }) {
  const order = ['input', 'parse', 'dedup', 'sort', 'stored', 'ops', 'path'] as Phase[]
  const at = (p: Phase) => order.indexOf(phase) >= order.indexOf(p)
  const lastIdx = new Map(s.entries.map((e, i) => [e.k, i]))
  let rows = s.entries.map((e, i) => ({ ...e, i, dup: lastIdx.get(e.k) !== i }))
  if (at('sort')) rows = rows.filter((r) => !r.dup).sort((a, b) => jsonbOrder(a.k, b.k))
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title={`json · ${s.json} bytes`}>
          <pre className="font-mono text-[12px] break-all whitespace-pre-wrap">{s.input}</pre>
          <p className="mt-2 text-xs text-muted">Reparsed by every function call.</p>
        </Panel>
        <Panel title={at('stored') ? `jsonb · ${s.jsonb} bytes` : 'jsonb'}>
          {phase === 'input' ? <pre className="font-mono text-[12px] break-all whitespace-pre-wrap text-muted">{s.input}</pre> : (
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {rows.map((r) => {
                  const killed = at('dedup') && r.dup
                  return (
                    <motion.span key={`${r.k}-${r.i}`} layout initial={{ opacity: 0 }} animate={{ opacity: killed ? 0.45 : 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }}>
                      <Kv k={r.k} v={at('sort') && r.vSorted ? r.vSorted : r.v} t={killed ? 'dead' : at('sort') ? 'new' : 'tuple'} strike={killed} />
                    </motion.span>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
          {at('stored') && <p className="mt-2 font-mono text-[11px] text-muted break-all">::text → {s.out}</p>}
        </Panel>
      </div>
      {(phase === 'ops' || phase === 'path') && (
        <Panel title={phase === 'ops' ? `GIN items · jsonb_ops (${s.ops.length})` : `GIN items · jsonb_path_ops (${s.path.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {(phase === 'ops' ? s.ops : s.path).map((it, i) => (
              <motion.span key={it} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Tag t={phase === 'path' ? 'pointer' : it.startsWith('K') ? 'header' : 'tuple'}>{it}</Tag>
              </motion.span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{phase === 'ops'
            ? 'K = key item, V = value item. String array elements are indexed as keys so that ? can find them. A query for {"plan":"pro"} must match both K plan and V pro, and V pro could sit under any key, so the heap row is rechecked.'
            : 'A query for {"plan":"pro"} looks up exactly one hash. Documents with no leaf values (such as {"a": {}}) produce no items at all, so searching for them needs a full index scan.'}</p>
        </Panel>
      )}
    </div>
  )
}

function JsonViz() {
  const [id, setId] = useState(SAMPLES[0].id)
  const s = SAMPLES.find((x) => x.id === id)!
  const picker = (
    <select aria-label="Sample document" value={id} onChange={(e) => setId(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs">
      {SAMPLES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
    </select>
  )
  return (
    <Stepper key={id} steps={buildSteps(s)} interval={3000} extra={picker} render={(st) => (
      <div className="grid gap-3">
        <Legend items={[['tuple', 'parsed pair'], ['dead', 'discarded duplicate'], ['new', 'final jsonb order'], ['header', 'GIN key item'], ['pointer', 'GIN path hash']]} />
        <JsonView s={s} phase={st.phase} />
      </div>
    )} />
  )
}

export const lesson: Lesson = {
  slug: 'json-jsonb',
  module: 'm2',
  order: 3,
  title: 'JSON vs JSONB',
  tldr: [
    '`json` stores the exact input text, while `jsonb` parses it once into a **binary tree** that drops whitespace, sorts keys and keeps only the last duplicate key.',
    'Paying that parsing cost on write makes every later read fast and lets **GIN indexes** answer containment and key-existence queries, which makes `jsonb` the right default for most applications.',
  ],
  visualizer: {
    title: 'One document, two storage formats',
    caption: 'Pick a sample document and step through what `jsonb` does to it: parse, de-duplicate, sort and store. The last two steps show which items each GIN operator class extracts.',
    Component: JsonViz,
  },
  playground: {
    setup: `
CREATE TABLE events (id int PRIMARY KEY, raw json, doc jsonb);
INSERT INTO events
SELECT g, d::json, d
FROM (SELECT g, jsonb_build_object(
        'user', jsonb_build_object('id', g % 5000, 'plan', (ARRAY['free','pro','team'])[1 + g % 3]),
        'type', (ARRAY['click','view','purchase','signup'])[1 + g % 4],
        'tags', jsonb_build_array('t' || (g % 40), 't' || (g % 7)),
        'amount', round((g % 1000) / 7.0, 2))
        || CASE WHEN g % 100 = 0 THEN '{"coupon": "WELCOME"}'::jsonb ELSE '{}'::jsonb END AS d
      FROM generate_series(1, 20000) g) s;
CREATE INDEX events_doc_ops ON events USING gin (doc);
ANALYZE events;`,
    presets: [
      { label: 'Normalization & size', sql: `SELECT '{"user": "ana", "plan": "pro", "user": "ana2"}'::json::text  AS as_json,
       '{"user": "ana", "plan": "pro", "user": "ana2"}'::jsonb::text AS as_jsonb,
       '{"color": "white", "size": ["S", "M", "L"]}'::jsonb::text   AS shorter_key_first,
       '{"reading": 1.230e-5}'::jsonb::text                         AS number_as_numeric;

SELECT round(avg(pg_column_size(raw))) AS avg_json_bytes,
       round(avg(pg_column_size(doc))) AS avg_jsonb_bytes
FROM events;`,
        note: 'json keeps both `user` keys and the spacing. jsonb keeps the last `user`, puts `size` before `color` (shorter keys first) and prints numbers as `numeric`. For these small documents jsonb is about 40% **larger** (96 vs 134 bytes).' },
      { label: '-> vs ->>: the quotes tell the type', sql: `SELECT (doc -> 'type')::text AS arrow, pg_typeof(doc -> 'type')  AS arrow_type,
       doc ->> 'type' AS arrow2, pg_typeof(doc ->> 'type') AS arrow2_type,
       (doc -> 'tags' -> 0)::text AS first_tag, doc -> 'tags' ->> -1 AS last_tag,
       doc -> 'tags' -> 5 IS NULL AS past_end_is_null
FROM events WHERE id = 100;

SELECT j -> 'missing' IS NULL       AS missing_key_is_sql_null,
       j -> 'gone' IS NULL          AS json_null_is_sql_null,
       jsonb_typeof(j -> 'gone')    AS json_null_type,
       j ->> 'gone' IS NULL         AS as_text_it_is_null
FROM (SELECT '{"gone": null}'::jsonb AS j) s;`,
        note: '`->` returns **jsonb** (`"click"`, with quotes), `->>` returns **text** (`click`). JSON arrays are **0-based** and `-1` counts from the end, unlike SQL arrays. A missing key is SQL NULL, but a JSON `null` is a real jsonb value until `->>` turns it into SQL NULL.' },
      { label: 'Operators', sql: `SELECT doc -> 'user' ->> 'plan'     AS plan_text,
       doc #>> '{user,id}'          AS user_id_text,
       doc ? 'user'                 AS top_level_key,
       doc ? 'plan'                 AS nested_key,
       doc -> 'user' ? 'plan'       AS navigate_first,
       doc @> '{"type": "click"}'   AS is_click,
       ('{"a": {"x": 1, "y": 2}}'::jsonb || '{"a": {"z": 3}}')::text AS shallow_merge
FROM events WHERE id = 1;`,
        note: '`?` only sees **top-level** keys: `plan` lives under `user`, so navigate first. `@>` tests containment. `||` is a shallow merge: the right-hand `a` replaces the whole left-hand object.' },
      { label: 'Which queries use GIN?', sql: `EXPLAIN (COSTS OFF) SELECT count(*) FROM events WHERE doc @> '{"type": "purchase", "user": {"plan": "pro"}}';
EXPLAIN (COSTS OFF) SELECT count(*) FROM events WHERE doc ? 'coupon';
EXPLAIN (COSTS OFF) SELECT count(*) FROM events WHERE doc ->> 'type' = 'purchase';`,
        note: '`@>` and `?` use the GIN index. `doc ->> \'type\' = …` applies an operator to an *expression*, so it cannot use an index on `doc`.' },
      { label: 'Text is not a number', sql: `SELECT count(*) FILTER (WHERE doc ->> 'amount' > '50')           AS compared_as_text,
       count(*) FILTER (WHERE (doc ->> 'amount')::numeric > 50)    AS compared_as_numeric,
       count(*) FILTER (WHERE doc -> 'amount' > '50'::jsonb)       AS compared_as_jsonb,
       '9.00' > '50'                                               AS why
FROM events;

CREATE INDEX events_type ON events ((doc ->> 'type'));
EXPLAIN (COSTS OFF) SELECT count(*) FROM events WHERE doc ->> 'type' = 'purchase';`,
        note: '`->>` yields text, so `> \'50\'` compares strings and `\'9.00\'` wins: 7,560 rows instead of **12,980**. Cast first, or compare jsonb to jsonb. Comparing `->> \'type\'` to text is fine, and a **B-tree expression index** on exactly that expression turns it into an index scan.' },
      { label: 'jsonb_ops vs jsonb_path_ops', sql: `CREATE INDEX events_doc_path ON events USING gin (doc jsonb_path_ops);

SELECT indexrelid::regclass AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid = 'events'::regclass AND indexrelid::regclass::text LIKE 'events_doc%';

EXPLAIN (COSTS OFF) SELECT count(*) FROM events WHERE doc @> '{"user": {"plan": "pro"}}';`,
        note: 'The path-hash index is smaller, and the planner picks it for `@>`. `?` still needs `events_doc_ops`.' },
      { label: 'jsonb_set: new row, and the NULL trap', sql: `SELECT ctid AS before FROM events WHERE id = 7;
UPDATE events SET doc = jsonb_set(doc, '{user,plan}', '"team"') WHERE id = 7;
SELECT ctid AS after, (doc -> 'user')::text AS user_now FROM events WHERE id = 7;

SELECT jsonb_set(doc, '{coupon}', NULL) IS NULL                          AS strict_returns_null,
       jsonb_set_lax(doc, '{coupon}', NULL) ->> 'coupon' IS NULL          AS lax_sets_json_null,
       jsonb_set_lax(doc, '{coupon}', NULL, true, 'delete_key') ? 'coupon' AS key_still_there
FROM events WHERE id = 100;`,
        note: 'Changing one key wrote a **whole new row version** at a new ctid. And `jsonb_set(…, NULL)` returns SQL NULL for the entire document: in an UPDATE it wipes the column. `jsonb_set_lax` sets a JSON null or deletes the key instead.' },
      { label: 'jsonpath & JSON_TABLE', sql: `SELECT jsonb_path_query_array(doc, 'lax $.tags[*] ? (@ starts with "t1")')  AS lax_filter,
       jsonb_path_query_array(doc, 'lax $.user.plan[0]')                  AS lax_wraps_scalar,
       jsonb_path_query_array(doc, 'strict $.user.plan[0]', '{}', true)   AS strict_silent
FROM events WHERE id = 12;

SELECT jt.*
FROM events,
     JSON_TABLE(doc, '$' COLUMNS (
        event_type text    PATH '$.type',
        plan       text    PATH '$.user.plan',
        amount     numeric PATH '$.amount',
        NESTED PATH '$.tags[*]' COLUMNS (tag text PATH '$'))) AS jt
WHERE id BETWEEN 1 AND 3;`,
        note: 'Lax mode (the default) treats a scalar as a one-element array, so `plan[0]` works; strict mode raises an error there, which `silent => true` turns into an empty result. JSON_TABLE turns documents into rows, one per `NESTED PATH` element.' },
    ],
  },
  production: {
    title: 'Making an event-attribute filter indexable',
    context: 'An analytics product stores event properties in a `jsonb` column and filters dashboards with `WHERE props ->> \'plan\' = $1`, on a 40 M-row table.',
    problem: 'A GIN index on `props` had been created, yet every dashboard query was a sequential scan. The `->>` comparison is not one of the GIN operators: the index only helps `@>`, `?`, `?|`, `?&`, `@?` and `@@` applied to the column itself.',
    solution: 'Rewrite equality filters as containment so the GIN index is used. For one hot attribute that is sorted or range-filtered, add a B-tree expression index instead.',
    sql: `-- containment uses the GIN index (jsonb_path_ops is smaller for @>)
CREATE INDEX events_props_path ON events USING gin (props jsonb_path_ops);
SELECT count(*) FROM events WHERE props @> '{"plan": "pro"}';

-- one hot key, also good for ORDER BY and ranges
CREATE INDEX events_plan ON events ((props ->> 'plan'));`,
    outcome: 'The playground shows the change on 20k rows: Seq Scan before, Bitmap Index Scan on the GIN index after. In the playground the path-ops index is also about 19% smaller than jsonb_ops (792 kB vs 976 kB).',
  },
  pitfalls: [
    { title: 'Expecting a GIN index to serve ->> comparisons',
      symptom: '`EXPLAIN` shows a Seq Scan for `WHERE doc ->> \'type\' = \'purchase\'` despite a GIN index on `doc`.',
      cause: 'GIN indexes on `doc` support operators applied directly to `doc` (`@>`, `?`, `@?`, `@@`). `->>` produces a text expression the index knows nothing about.',
      fix: 'Write `doc @> \'{"type": "purchase"}\'`, or create an expression index on `(doc ->> \'type\')`.' },
    { title: 'Relying on key order or duplicate keys',
      symptom: 'An API returns keys in a different order than they were sent, or a signed payload no longer verifies.',
      cause: 'jsonb sorts keys and keeps only the last duplicate. A common claim is that jsonb rejects duplicate keys: it accepts them silently and discards all but the last. The original text is gone after input.',
      fix: 'Store payloads that must be reproduced byte for byte (signatures, audit copies) in `json` or `text`, and a parsed `jsonb` copy for querying if needed.' },
    { title: 'Updating one key in a large document',
      symptom: 'Frequent `jsonb_set` updates on big documents cause high WAL volume, TOAST churn and row-lock contention.',
      cause: 'A jsonb value is one datum. Changing one key writes a whole new row version, and a new TOAST value if the document is large. Any update also locks the entire row.',
      fix: 'Keep frequently changing fields in ordinary columns, and keep documents small and mostly immutable.' },
    { title: 'Comparing ->> results to numbers',
      symptom: '`WHERE doc ->> \'amount\' > \'50\'` silently returns the wrong rows, or `WHERE doc ->> \'amount\' > 50.0` fails with `operator does not exist: text > numeric`.',
      cause: '`->>` always returns **text**. Against a quoted literal the comparison is a string comparison (`\'9.00\' > \'50\'`); against a number there is no such operator.',
      fix: 'Cast the extracted value: `(doc ->> \'amount\')::numeric > 50`, or compare jsonb to jsonb with `doc -> \'amount\' > \'50\'`. To index it, the index expression must match the cast exactly, and the cast must be immutable (text to `numeric` is; text to `timestamptz` is not).',
      sql: `CREATE INDEX ON events (((doc ->> 'amount')::numeric));
SELECT count(*) FROM events WHERE (doc ->> 'amount')::numeric > 50;` },
    { title: 'jsonb_set with a NULL value',
      symptom: 'After `UPDATE t SET doc = jsonb_set(doc, \'{note}\', to_jsonb($1))` with a NULL parameter, whole documents are NULL.',
      cause: '`jsonb_set` is strict: if any argument is SQL NULL the result is SQL NULL, and the UPDATE writes it over the entire column.',
      fix: 'Use `jsonb_set_lax`, which by default stores a JSON `null` (or can delete the key), or wrap the value in `COALESCE(to_jsonb($1), \'null\')`. Add `CHECK (doc IS NOT NULL)` or `NOT NULL` on document columns.',
      sql: `SELECT jsonb_set('{"a": 1}', '{b}', NULL);      -- NULL: the whole document
SELECT jsonb_set_lax('{"a": 1}', '{b}', NULL);  -- {"a": 1, "b": null}` },
    { title: 'Using jsonb_path_ops for key-existence queries',
      symptom: '`WHERE doc ? \'coupon\'` stays slow after switching the index to `jsonb_path_ops`.',
      cause: '`jsonb_path_ops` only indexes hashed values, not bare keys, so it supports `@>`, `@?` and `@@` only.',
      fix: 'Keep the default `jsonb_ops` index if you need `?`, `?|` or `?&`, or index the expression `((doc ? \'coupon\'))` for a single hot key.' },
  ],
  pointers: [
    '**json** = exact text, reparsed on every use, no GIN support. **jsonb** = parsed binary tree: no whitespace, keys sorted shorter-first, last duplicate wins.',
    'jsonb is not smaller: small documents are often **larger** than json. Its advantage is speed and indexing.',
    '`->` returns jsonb, `->>` returns **text** (cast before comparing numbers), `#>` / `#>>` take a path, `?` tests top-level keys, `@>` tests containment.',
    'GIN **jsonb_ops** indexes keys and values (supports `?`); **jsonb_path_ops** hashes paths (only `@>`, `@?`, `@@`, smaller).',
    'jsonpath runs in **lax** mode by default (auto-wraps and unwraps arrays); **strict** raises structural errors.',
  ],
  sources: ['datatype-json.html', 'functions-json.html', 'gin-builtin-opclasses.html', 'indexes-expressional.html', 'storage-toast.html'],
}
