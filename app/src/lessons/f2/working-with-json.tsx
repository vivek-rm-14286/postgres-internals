import { useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Note, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, three views over the playground data. Every result string below was produced by
 * PostgreSQL 18 on exactly that data:
 *   1. Fold rows: the join rows fold into a nested document, level by level, with the empty-group choice.
 *   2. Paths: click a node of an inbox document, see what JSON_VALUE / JSON_QUERY / JSON_EXISTS return.
 *   3. Index guide: a query shape, its plan and buffer count without and with the right index.
 * ---------------------------------------------------------------------------------------------- */

type View = 'fold' | 'paths' | 'index'
type Empty = 'plain' | 'filter' | 'coalesce'

/* ---------- 1. Fold rows ---------- */

interface JoinRow { name: string; order: number | null; sku: string | null; qty: number | null }
const JOIN_ROWS: JoinRow[] = [
  { name: 'Asha', order: 101, sku: 'mug', qty: 2 }, { name: 'Asha', order: 101, sku: 'tea', qty: 1 },
  { name: 'Asha', order: 102, sku: 'kettle', qty: 1 }, { name: 'Ben', order: 103, sku: 'lid', qty: 4 },
  { name: 'Ben', order: 103, sku: 'mug', qty: 4 }, { name: 'Ben', order: 103, sku: 'tea', qty: 2 },
  { name: 'Chen', order: 104, sku: 'tea', qty: 1 }, { name: 'Dara', order: null, sku: null, qty: null },
]
const CUSTOMERS = ['Asha', 'Ben', 'Chen', 'Dara']

const FROM = `FROM customers c
LEFT JOIN orders o      ON o.customer_id = c.id
LEFT JOIN order_items i ON i.order_id = o.id`
const ITEM = `jsonb_build_object('sku', i.sku, 'qty', i.qty)`
const aggSql = (m: Empty, x: string, ord: string, cond: string) =>
  m === 'plain' ? `jsonb_agg(${x} ORDER BY ${ord})`
    : m === 'filter' ? `jsonb_agg(${x} ORDER BY ${ord})\n         FILTER (WHERE ${cond})`
      : `COALESCE(jsonb_agg(${x} ORDER BY ${ord})\n         FILTER (WHERE ${cond}), '[]')`
const l3Sql = (m: Empty) => `SELECT c.name,
       ${aggSql(m, `jsonb_build_object('id', o.id, 'items', o.items)`, 'o.id', 'o.id IS NOT NULL')} AS orders
FROM customers c
LEFT JOIN (SELECT o.id, o.customer_id,
                  jsonb_agg(${ITEM} ORDER BY i.sku) AS items
           FROM orders o JOIN order_items i ON i.order_id = o.id
           GROUP BY o.id) o ON o.customer_id = c.id
GROUP BY c.id, c.name ORDER BY c.id;`

const LEVELS: { title: string; body: string; sql: (m: Empty) => string }[] = [
  { title: 'Flat join rows', body: 'A **LEFT JOIN** gives one row per order item: 8 rows. Dara has no orders, so her row is all **NULL** on the right-hand side.',
    sql: () => `SELECT c.name, o.id AS order_id, i.sku, i.qty\n${FROM}\nORDER BY c.id, o.id, i.sku;` },
  { title: 'Each row becomes an object', body: '`jsonb_build_object(key, value, …)` turns columns into a JSON **object**. SQL NULL becomes JSON `null`, so Dara gets `{"qty": null, "sku": null}`.',
    sql: () => `SELECT c.name, o.id AS order_id,\n       ${ITEM} AS item\n${FROM}\nORDER BY c.id, o.id, i.sku;` },
  { title: 'Fold items into each order', body: '`GROUP BY` the order and `jsonb_agg(… ORDER BY i.sku)` collects the item objects into one JSON **array** per order. Without the ORDER BY inside the call, array order is not guaranteed.',
    sql: (m) => `SELECT c.name, o.id AS order_id,\n       ${aggSql(m, ITEM, 'i.sku', 'i.sku IS NOT NULL')} AS items\n${FROM}\nGROUP BY c.id, c.name, o.id ORDER BY c.id, o.id;` },
  { title: 'Fold orders into each customer', body: 'Aggregate items per order in a subquery first, then aggregate orders per customer. Two levels of nesting, one statement.',
    sql: l3Sql },
  { title: 'One document, keyed by customer', body: '`jsonb_object_agg(key, value)` folds rows into one **object**. jsonb stores keys shorter-first, so `Ben` comes before `Asha`.',
    sql: (m) => `SELECT jsonb_object_agg(name, orders) AS doc\nFROM (${l3Sql(m).replace(/;$/, '').split('\n').join('\n      ')}) s;` },
]

/* Captured results for levels 2 to 4, per empty-group handling (Dara's value is the only difference). */
const DARA: Record<Empty, { items: string | null; orders: string | null }> = {
  plain: { items: '[{"qty": null, "sku": null}]', orders: '[{"id": null, "items": null}]' },
  filter: { items: null, orders: null },
  coalesce: { items: '[]', orders: '[]' },
}
const EMPTY_NOTE: Record<Empty, string> = {
  plain: 'Plain `jsonb_agg` aggregates the all-NULL row too, so Dara gets an array with one **fake element** made of nulls. `jsonb_agg_strict` does not help, because that object itself is not NULL.',
  filter: '`FILTER (WHERE … IS NOT NULL)` skips the fake row. An aggregate over zero rows returns SQL **NULL**, so Dara gets `null`, not an array.',
  coalesce: '`COALESCE(… FILTER (…), \'[]\')` turns that NULL into an **empty array**. Clients can now loop over `orders` for every customer.',
}

const itemText = (r: JoinRow) => `{"qty": ${r.qty ?? 'null'}, "sku": ${r.sku ? `"${r.sku}"` : 'null'}}`

function Chip({ r, i, level, empty }: { r: JoinRow; i: number; level: number; empty: Empty }) {
  const fake = r.order === null
  const t: Tone = fake ? (level >= 2 && empty !== 'plain' ? 'muted' : 'dead') : 'tuple'
  if (fake && level >= 2 && empty !== 'plain') return null
  return (
    <motion.div layout layoutId={`it-${i}`} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] leading-tight whitespace-nowrap"
      style={{ borderColor: tone(t), background: toneBg(t, 14) }}>
      {level === 0
        ? <>{r.name} · {r.order ?? 'NULL'} · {r.sku ?? 'NULL'} · {r.qty ?? 'NULL'}</>
        : itemText(r)}
    </motion.div>
  )
}

function EmptyTag({ empty, which, json }: { empty: Empty; which: "items" | "orders"; json?: boolean }) {
  if (empty === 'plain') return null
  const v = DARA[empty][which]
  return <motion.span layout><Tag t={v === null ? 'new' : 'ok'}>{v === null ? (json ? "null" : "NULL") : v}</Tag></motion.span>
}

function FoldView() {
  const [level, setLevel] = useState(0)
  const [empty, setEmpty] = useState<Empty>('plain')
  const L = LEVELS[level]
  const orderIds = [101, 102, 103, 104]
  const orderCard = (oid: number | null, name: string) => {
    const idxs = JOIN_ROWS.map((r, i) => [r, i] as const).filter(([r]) => r.order === oid && r.name === name)
    return (
      <motion.div key={`o-${oid}-${name}`} layout layoutId={`ord-${oid ?? name}`} transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="rounded-lg border p-1.5" style={{ borderColor: tone('pointer'), background: toneBg('pointer', 8) }}>
        <p className="mb-1 font-mono text-[10.5px] text-muted">{level >= 3 ? `{"id": ${oid ?? 'null'}, "items": [` : `${name} · order ${oid ?? 'NULL'} · items:`}</p>
        <div className="flex flex-wrap gap-1">
          {idxs.map(([r, i]) => <Chip key={i} r={r} i={i} level={level} empty={empty} />)}
          {oid === null && <EmptyTag empty={empty} which="items" />}
        </div>
      </motion.div>
    )
  }
  const custCard = (name: string) => {
    const oids = name === 'Dara' ? [] : orderIds.filter((o) => JOIN_ROWS.some((r) => r.order === o && r.name === name))
    return (
      <motion.div key={name} layout layoutId={`cu-${name}`} transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="rounded-xl border p-2" style={{ borderColor: tone('header'), background: toneBg('header', 8) }}>
        <p className="mb-1.5 font-mono text-[11px] font-semibold">{level === 4 ? (name === 'Dara' && empty !== 'plain' ? `"${name}":` : `"${name}": [`) : `${name} · orders:`}</p>
        <div className="grid gap-1.5">
          {oids.map((o) => orderCard(o, name))}
          {name === 'Dara' && (empty === 'plain'
            ? <motion.div layout layoutId="ord-Dara" className="rounded-lg border p-1.5 font-mono text-[11px]" style={{ borderColor: tone('dead'), background: toneBg('dead', 12) }}>{'{"id": null, "items": null}'}</motion.div>
            : <div><EmptyTag empty={empty} which="orders" json={level === 4} /></div>)}
        </div>
      </motion.div>
    )
  }
  const daraLine = level === 2 ? `Dara · items = ${DARA[empty].items ?? 'NULL'}` : level >= 3 ? `Dara · orders = ${DARA[empty].orders ?? 'NULL'}` : null

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Empty group" value={empty} onChange={setEmpty} options={[['plain', 'jsonb_agg'], ['filter', '+ FILTER'], ['coalesce', '+ FILTER + COALESCE']]} />
        <Btn onClick={() => setLevel((l) => Math.max(0, l - 1))} disabled={level === 0}>← Back</Btn>
        <Btn primary testid="viz-next" onClick={() => setLevel((l) => (l + 1) % LEVELS.length)}>{level === LEVELS.length - 1 ? 'Start over' : 'Fold one level →'}</Btn>
        <span className="text-xs text-muted">level {level + 1} of {LEVELS.length}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <Panel title={L.title}>
          <p className="mb-2 text-sm"><Md>{L.body}</Md></p>
          <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-bg p-2 font-mono text-[11px] leading-snug whitespace-pre scrollbar-thin">{L.sql(empty)}</pre>
        </Panel>
        <Panel title={level === 4 ? 'Result: one jsonb value' : level >= 2 ? 'Result rows' : `Result: ${JOIN_ROWS.length} rows`}>
          <LayoutGroup>
            <motion.div layout className="grid gap-1.5" style={level === 4 ? { border: `1.5px dashed ${tone('accent')}`, borderRadius: 14, padding: 8 } : undefined}>
              {level === 4 && <p className="font-mono text-[11px] text-muted">{'{'}</p>}
              {level <= 1 && <div className="flex flex-col gap-1">{JOIN_ROWS.map((r, i) => (
                <div key={i} className="flex items-center gap-2">{level === 1 && <span className="w-10 shrink-0 font-mono text-[10.5px] text-muted">{r.name}</span>}<Chip r={r} i={i} level={level} empty={empty} /></div>))}</div>}
              {level === 2 && <>
                {orderIds.map((o) => orderCard(o, JOIN_ROWS.find((r) => r.order === o)!.name))}
                {orderCard(null, 'Dara')}
              </>}
              {level >= 3 && (level === 4 ? ['Ben', 'Asha', 'Chen', 'Dara'] : CUSTOMERS).map(custCard)}
              {level === 4 && <p className="font-mono text-[11px] text-muted">{'}'}</p>}
            </motion.div>
          </LayoutGroup>
        </Panel>
      </div>
      {daraLine && <p className="font-mono text-[12px]" style={{ color: empty === 'coalesce' ? tone('ok') : empty === 'filter' ? tone('new') : tone('dead') }}>{daraLine}</p>}
      <Note>{level >= 2 ? EMPTY_NOTE[empty] : 'Press **Fold one level** to group the rows. Pick the empty-group handling to see what a customer with no orders gets.'}</Note>
      <Legend items={[['tuple', 'item object'], ['pointer', 'order'], ['header', 'customer'], ['dead', 'fake element from the all-NULL row'], ['ok', 'empty array']]} />
    </div>
  )
}

/* ---------- 2. Path explorer ---------- */

// [JSON_VALUE, … ERROR ON ERROR, … RETURNING numeric, JSON_QUERY, … WITH WRAPPER, … WITH CONDITIONAL WRAPPER, JSON_EXISTS, jsonb_path_query rows]
// null = SQL NULL, '!' prefix = the error raised.
const ARR = '[{"qty": 2, "sku": "mug", "price": 8.5}, {"qty": "3", "sku": "tea", "price": 12}, {"sku": "lid", "price": 1.25}]'
const NS = '!JSON path expression in JSON_VALUE must return single scalar item'
const R: Record<string, (string | null)[]> = {
  '$': [null, NS, null, `{"items": ${ARR}, "order": 201, "placed": "2026-11-13", "customer": "Asha"}`, `[{"items": ${ARR}, "order": 201, "placed": "2026-11-13", "customer": "Asha"}]`, `{"items": ${ARR}, "order": 201, "placed": "2026-11-13", "customer": "Asha"}`, 't', '1'],
  '$.order': ['201', '201', '201', '201', '[201]', '201', 't', '1'],
  '$.customer': ['Asha', 'Asha', null, '"Asha"', '["Asha"]', '"Asha"', 't', '1'],
  '$.placed': ['2026-11-13', '2026-11-13', null, '"2026-11-13"', '["2026-11-13"]', '"2026-11-13"', 't', '1'],
  '$.items': [null, NS, null, ARR, `[${ARR}]`, ARR, 't', '1'],
  '$.items[0]': [null, NS, null, '{"qty": 2, "sku": "mug", "price": 8.5}', '[{"qty": 2, "sku": "mug", "price": 8.5}]', '{"qty": 2, "sku": "mug", "price": 8.5}', 't', '1'],
  '$.items[0].sku': ['mug', 'mug', null, '"mug"', '["mug"]', '"mug"', 't', '1'],
  '$.items[0].qty': ['2', '2', '2', '2', '[2]', '2', 't', '1'],
  '$.items[0].price': ['8.5', '8.5', '8.5', '8.5', '[8.5]', '8.5', 't', '1'],
  '$.items[1]': [null, NS, null, '{"qty": "3", "sku": "tea", "price": 12}', '[{"qty": "3", "sku": "tea", "price": 12}]', '{"qty": "3", "sku": "tea", "price": 12}', 't', '1'],
  '$.items[1].sku': ['tea', 'tea', null, '"tea"', '["tea"]', '"tea"', 't', '1'],
  '$.items[1].qty': ['3', '3', '3', '"3"', '["3"]', '"3"', 't', '1'],
  '$.items[1].price': ['12', '12', '12', '12', '[12]', '12', 't', '1'],
  '$.items[2]': [null, NS, null, '{"sku": "lid", "price": 1.25}', '[{"sku": "lid", "price": 1.25}]', '{"sku": "lid", "price": 1.25}', 't', '1'],
  '$.items[2].sku': ['lid', 'lid', null, '"lid"', '["lid"]', '"lid"', 't', '1'],
  '$.items[2].price': ['1.25', '1.25', '1.25', '1.25', '[1.25]', '1.25', 't', '1'],
  '$.items[2].qty': [null, null, null, null, null, null, 'f', '0'],
  '$.items[*].sku': [null, NS, null, null, '["mug", "tea", "lid"]', '["mug", "tea", "lid"]', 't', '3'],
  '$.items[*] ? (@.price > 5)': [null, NS, null, null, '[{"qty": 2, "sku": "mug", "price": 8.5}, {"qty": "3", "sku": "tea", "price": 12}]', '[{"qty": 2, "sku": "mug", "price": 8.5}, {"qty": "3", "sku": "tea", "price": 12}]', 't', '2'],
  '$.items.sku': [null, NS, null, null, '["mug", "tea", "lid"]', '["mug", "tea", "lid"]', 't', '3'],
  '$.items[last].sku': ['lid', 'lid', null, '"lid"', '["lid"]', '"lid"', 't', '1'],
  '$.gift': [null, null, null, null, null, null, 'f', '0'],
  'strict $.gift': [null, '!JSON object does not contain key "gift"', null, null, null, null, 'f', '!JSON object does not contain key "gift"'],
}
const FN_ROWS = ['JSON_VALUE(body, p)', '… ERROR ON ERROR', '… RETURNING numeric', 'JSON_QUERY(body, p)', '… WITH WRAPPER', '… WITH CONDITIONAL WRAPPER', 'JSON_EXISTS(body, p)', 'jsonb_path_query(body, p)']

interface DocNode { p: string; d: number; k: string; v: string; ghost?: boolean }
const NODES: DocNode[] = [
  { p: '$', d: 0, k: '$', v: '{ 4 keys }' },
  { p: '$.order', d: 1, k: 'order', v: '201' },
  { p: '$.customer', d: 1, k: 'customer', v: '"Asha"' },
  { p: '$.placed', d: 1, k: 'placed', v: '"2026-11-13"' },
  { p: '$.items', d: 1, k: 'items', v: '[ 3 elements ]' },
  { p: '$.items[0]', d: 2, k: '[0]', v: '{ 3 keys }' },
  { p: '$.items[0].sku', d: 3, k: 'sku', v: '"mug"' },
  { p: '$.items[0].qty', d: 3, k: 'qty', v: '2' },
  { p: '$.items[0].price', d: 3, k: 'price', v: '8.5' },
  { p: '$.items[1]', d: 2, k: '[1]', v: '{ 3 keys }' },
  { p: '$.items[1].sku', d: 3, k: 'sku', v: '"tea"' },
  { p: '$.items[1].qty', d: 3, k: 'qty', v: '"3"   (a string)' },
  { p: '$.items[1].price', d: 3, k: 'price', v: '12' },
  { p: '$.items[2]', d: 2, k: '[2]', v: '{ 2 keys }' },
  { p: '$.items[2].sku', d: 3, k: 'sku', v: '"lid"' },
  { p: '$.items[2].price', d: 3, k: 'price', v: '1.25' },
  { p: '$.items[2].qty', d: 3, k: 'qty', v: 'missing', ghost: true },
]
const EXTRA: [string, string[]][] = [
  ['$.items[*].sku', ['$.items[0].sku', '$.items[1].sku', '$.items[2].sku']],
  ['$.items[*] ? (@.price > 5)', ['$.items[0]', '$.items[1]']],
  ['$.items.sku', ['$.items[0].sku', '$.items[1].sku', '$.items[2].sku']],
  ['$.items[last].sku', ['$.items[2].sku']],
  ['$.gift', []],
  ['strict $.gift', []],
]
const matchesOf = (p: string) => EXTRA.find(([x]) => x === p)?.[1] ?? (NODES.find((n) => n.p === p && !n.ghost) ? [p] : [])
const TOUR: [string, string][] = [
  ['$.customer', '`JSON_VALUE` returns a scalar as **text** without quotes: `Asha`. `JSON_QUERY` returns **jsonb**, so the quotes stay: `"Asha"`. With `RETURNING numeric` the cast fails, and the default **NULL ON ERROR** hides it.'],
  ['$.items[1].qty', 'This quantity is the **string** `"3"`. `JSON_VALUE … RETURNING numeric` casts it to 3, so the type in the document matters less than the type you ask for.'],
  ['$.items[0]', 'An object is not a scalar. `JSON_VALUE` gives NULL by default; `ERROR ON ERROR` shows the reason. Use `JSON_QUERY` for objects and arrays.'],
  ['$.items[*].sku', 'Three matches. `JSON_QUERY` can return only one item, so without a wrapper the result is NULL. **WITH WRAPPER** packs the matches into one array.'],
  ['$.items[*] ? (@.price > 5)', 'A **filter** `? (…)` keeps the elements where the condition is true. `@` is the element being tested.'],
  ['$.items.sku', 'In the default **lax** mode, a key step on an array is applied to each element, so this equals `$.items[*].sku`.'],
  ['$.items[2].qty', 'A missing key is an **empty** result, not an error: NULL everywhere, `JSON_EXISTS` is false and `jsonb_path_query` returns zero rows.'],
  ['strict $.gift', 'In **strict** mode a missing key is an error. `JSON_VALUE` and `JSON_QUERY` still return NULL (and `JSON_EXISTS` false) unless you add `ERROR ON ERROR`; `jsonb_path_query` raises it.'],
]

function cellOf(v: string | null, row: number) {
  if (v === null) return <span className="text-muted">NULL</span>
  if (v.startsWith('!')) return <span style={{ color: tone.text('dead') }}>ERROR: {v.slice(1)}</span>
  if (row === 7) return <span style={{ color: tone.text('ok') }}>{v} row{v === '1' ? '' : 's'}</span>
  return <span style={{ color: tone.text('ok') }}>{v}</span>
}

function PathView() {
  const [p, setP] = useState('$.customer')
  const [tour, setTour] = useState(0)
  const res = R[p]
  const hits = matchesOf(p)
  const note = TOUR.find(([x]) => x === p)?.[1] ?? 'Click any node or path. Each line shows what that function returns for this path on the document above.'
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => { const n = (tour + 1) % TOUR.length; setTour(n); setP(TOUR[n][0]) }}>Next path →</Btn>
        {EXTRA.map(([x]) => <Btn key={x} active={p === x} onClick={() => setP(x)}><span className="font-mono">{x}</span></Btn>)}
      </div>
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="inbox.body for id = 1 (click a node)">
          <div className="grid gap-0.5 font-mono text-[12px]">
            {NODES.map((n) => {
              const on = hits.includes(n.p), sel = p === n.p
              return (
                <motion.button key={n.p} type="button" layout onClick={() => setP(n.p)}
                  animate={{ scale: on ? 1.01 : 1 }}
                  className="flex items-center gap-2 rounded px-1.5 py-0.5 text-left"
                  style={{ paddingLeft: 6 + n.d * 16, background: on ? toneBg('new', 22) : sel ? toneBg('dead', 12) : 'transparent', border: `1px solid ${sel ? tone(n.ghost ? 'dead' : 'new') : 'transparent'}`, opacity: n.ghost ? 0.6 : 1 }}>
                  <span className="font-semibold">{n.k}</span>
                  <span className={n.ghost ? 'italic text-muted' : 'text-muted'}>{n.v}</span>
                </motion.button>
              )
            })}
          </div>
        </Panel>
        <Panel title="p =">
          <p className="mb-2 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[13px] font-semibold break-all">'{p}'</p>
          <table className="w-full border-collapse font-mono text-[11.5px]">
            <tbody>
              {FN_ROWS.map((f, i) => (
                <tr key={f} className="border-b border-line last:border-0 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap text-ink">{f}</td>
                  <td className="py-1 [overflow-wrap:anywhere]"><motion.span key={p + i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="inline-block">{cellOf(res[i], i)}</motion.span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Note>{note}</Note>
      <Legend items={[['new', 'items the path matches'], ['ok', 'returned value'], ['dead', 'error raised'], ['muted', 'SQL NULL']]} />
    </div>
  )
}

/* ---------- 3. Index decision guide ---------- */

interface Shape { q: string; rows: number; before: [string, number]; ddl: string; after: [string, number]; verdict: string; t: Tone; note: string }
const SHAPES: Shape[] = [
  { q: `WHERE attrs @> '{"brand": "brand007"}'`, rows: 50, before: ['Seq Scan', 500], ddl: 'CREATE INDEX products_attrs_path\n  ON products USING gin (attrs jsonb_path_ops);', after: ['Bitmap Index Scan on products_attrs_path', 53], verdict: 'GIN', t: 'ok',
    note: '**Containment** is what GIN is for. Both GIN opclasses serve it; with both present the planner picks the smaller `jsonb_path_ops` index (3 index pages read, against 11 for `jsonb_ops`).' },
  { q: `WHERE attrs ? 'recalled'`, rows: 80, before: ['Seq Scan', 500], ddl: 'CREATE INDEX products_attrs_gin\n  ON products USING gin (attrs);', after: ['Bitmap Index Scan on products_attrs_gin', 83], verdict: 'GIN jsonb_ops', t: 'ok',
    note: '**Key existence** (`?`, `?|`, `?&`) needs the default `jsonb_ops` opclass. `jsonb_path_ops` stores hashes of path-to-value, not bare keys, so it cannot answer this.' },
  { q: `WHERE attrs @@ '$.sku == "SKU-00042"'`, rows: 1, before: ['Seq Scan', 500], ddl: '-- the same GIN index', after: ['Bitmap Index Scan on products_attrs_path', 4], verdict: 'GIN', t: 'ok',
    note: 'jsonpath **equality** through `@@` or `@?` is indexable by GIN. 500 pages read become 4.' },
  { q: `WHERE attrs ->> 'sku' = 'SKU-00042'`, rows: 1, before: ['Seq Scan (even with both GIN indexes)', 500], ddl: "CREATE INDEX products_sku\n  ON products ((attrs ->> 'sku'));", after: ['Index Scan using products_sku', 3], verdict: 'B-tree expression', t: 'pointer',
    note: '`->>` produces a **text expression**; GIN on `attrs` knows nothing about it. A B-tree on exactly that expression turns it into a 3-page index scan.' },
  { q: `WHERE (attrs ->> 'price')::numeric BETWEEN 10 AND 10.5`, rows: 102, before: ['Seq Scan', 500], ddl: "CREATE INDEX products_price\n  ON products (((attrs ->> 'price')::numeric));", after: ['Bitmap Index Scan on products_price', 104], verdict: 'B-tree expression', t: 'pointer',
    note: '**Ranges** need an ordered index. Index the cast expression, and write the query with the identical expression.' },
  { q: `WHERE attrs @? '$.price ? (@ >= 10 && @ <= 10.5)'`, rows: 102, before: ['Seq Scan', 500], ddl: '-- no index helps this form', after: ['Seq Scan (with every index above)', 500], verdict: 'rewrite', t: 'dead',
    note: 'GIN indexes only **equality** inside jsonpath. A range filter in jsonpath stays a sequential scan; rewrite it as the cast comparison above.' },
  { q: `ORDER BY (attrs ->> 'price')::numeric DESC LIMIT 5`, rows: 5, before: ['Sort over Seq Scan', 503], ddl: '-- products_price, read backwards', after: ['Index Scan Backward using products_price', 7], verdict: 'B-tree expression', t: 'pointer',
    note: 'A B-tree also returns rows **in order**, so a top-N query reads 7 pages instead of scanning all 20,000 rows into a sort.' },
  { q: `WHERE brand = 'brand007'   -- promoted column`, rows: 50, before: ["Seq Scan on attrs ->> 'brand'", 500], ddl: "ALTER TABLE products ADD COLUMN brand text\n  GENERATED ALWAYS AS (attrs ->> 'brand') STORED;\nCREATE INDEX products_brand ON products (brand);", after: ['Bitmap Index Scan on products_brand', 52], verdict: 'promote to a column', t: 'header',
    note: 'A **stored generated column** stays in sync with the document and gets real statistics: the planner estimates 50 rows (exact), against a guess of 100 for `->>` and 2 for `@>`. A `VIRTUAL` generated column cannot be indexed.' },
]

function Bar({ n, max, t, label }: { n: number; max: number; t: Tone; label: string }) {
  return (
    <div className="grid gap-0.5">
      <div className="flex justify-between text-[11px] text-muted"><span>{label}</span><span className="font-mono">{n} pages</span></div>
      <div className="h-3 rounded-full bg-surface-2">
        <motion.div className="h-3 rounded-full" initial={false} animate={{ width: `${Math.max(1.2, (n / max) * 100)}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} style={{ background: tone(t) }} />
      </div>
    </div>
  )
}

function IndexView() {
  const [i, setI] = useState(0)
  const s = SHAPES[i]
  const ratio = s.before[1] / s.after[1]
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setI((i + 1) % SHAPES.length)}>Next query shape →</Btn>
        <span className="text-xs text-muted">products: 20,000 rows, 500 heap pages</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Query shape">
          <div className="grid gap-1">
            {SHAPES.map((x, k) => (
              <button key={k} type="button" onClick={() => setI(k)}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-left font-mono text-[11px]"
                style={{ borderColor: k === i ? tone(x.t) : 'var(--line)', background: k === i ? toneBg(x.t, 14) : 'transparent' }}>
                <span className="[overflow-wrap:anywhere]">{x.q}</span>
                <span className="shrink-0 rounded px-1 font-sans text-[10px] font-semibold" style={{ color: tone.text(x.t) }}>{x.verdict}</span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Measured: EXPLAIN (ANALYZE, BUFFERS)">
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2">
            <p className="font-mono text-[11.5px]"><span className="text-muted">no index → </span>{s.before[0]}</p>
            <Bar n={s.before[1]} max={503} t="dead" label="without the index" />
            <pre className="overflow-x-auto rounded-lg border border-line bg-bg p-2 font-mono text-[11px] whitespace-pre scrollbar-thin">{s.ddl}</pre>
            <p className="font-mono text-[11.5px]"><span className="text-muted">plan → </span>{s.after[0]}</p>
            <Bar n={s.after[1]} max={503} t={s.t === 'dead' ? 'dead' : 'ok'} label="with it" />
            <div className="grid grid-cols-3 gap-2">
              <Stat k="rows" v={s.rows} />
              <Stat k="pages before" v={s.before[1]} t={tone('dead')} />
              <Stat k="fewer pages" v={ratio >= 1.05 ? `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×` : 'none'} t={tone(ratio >= 1.05 ? 'ok' : 'dead')} />
            </div>
          </motion.div>
        </Panel>
      </div>
      <Note>{s.note}</Note>
      <Legend items={[['ok', 'GIN on the whole document'], ['pointer', 'B-tree on one extracted key'], ['header', 'promote the key to a column'], ['dead', 'no index can serve it']]} />
    </div>
  )
}

function JsonViz() {
  const [view, setView] = useState<View>('fold')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={view} onChange={setView} options={[['fold', 'Rows → document'], ['paths', 'Path explorer'], ['index', 'Index guide']]} />
      {view === 'fold' ? <FoldView /> : view === 'paths' ? <PathView /> : <IndexView />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'working-with-json',
  module: 'f2',
  order: 6,
  title: 'Working with JSON',
  tldr: [
    'PostgreSQL can build JSON documents from ordinary rows, query them with path expressions, turn them back into rows, change parts of them and validate them with constraints.',
    'Applications speak JSON, so doing this shaping in one SQL statement replaces many round trips and loops in application code, as long as you pick the right function and the right index.',
  ],
  visualizer: {
    title: 'Rows, paths and indexes',
    caption: '**Rows → document**: press **Fold one level** and watch join rows nest into one document; switch the empty-group handling to see what a customer with no orders gets. **Path explorer**: click a node. **Index guide**: pick a query shape.',
    Component: JsonViz,
  },
  playground: {
    setup: `
-- a small shop: relational tables, an inbox of JSON orders, and a product catalog in jsonb
CREATE TABLE customers (id int PRIMARY KEY, name text NOT NULL, city text);
INSERT INTO customers VALUES (1, 'Asha', 'Pune'), (2, 'Ben', 'Leeds'), (3, 'Chen', 'Taipei'), (4, 'Dara', NULL);

CREATE TABLE orders (
  id int PRIMARY KEY, customer_id int NOT NULL REFERENCES customers,
  placed_on date NOT NULL, status text NOT NULL);
INSERT INTO orders VALUES (101, 1, '2026-11-02', 'shipped'), (102, 1, '2026-11-09', 'open'),
                          (103, 2, '2026-11-05', 'shipped'), (104, 3, '2026-11-11', 'cancelled');

CREATE TABLE order_items (
  order_id int REFERENCES orders, sku text, qty int NOT NULL, price numeric(8,2) NOT NULL,
  PRIMARY KEY (order_id, sku));
INSERT INTO order_items VALUES (101, 'mug', 2, 8.50), (101, 'tea', 1, 12.00), (102, 'kettle', 1, 39.90),
  (103, 'mug', 4, 8.50), (103, 'lid', 4, 1.25), (103, 'tea', 2, 12.00), (104, 'tea', 1, 12.00);

-- orders arriving from a web form, not yet loaded
CREATE TABLE inbox (id int PRIMARY KEY, body jsonb NOT NULL);
INSERT INTO inbox VALUES
  (1, '{"order": 201, "customer": "Asha", "placed": "2026-11-13", "items": [{"sku": "mug", "qty": 2, "price": 8.5}, {"sku": "tea", "qty": "3", "price": 12}, {"sku": "lid", "price": 1.25}]}'),
  (2, '{"order": 202, "customer": "Ben", "placed": "13/11/2026", "items": [], "gift": true}');

-- 20,000 products whose attributes live in one jsonb column
CREATE TABLE products (id int PRIMARY KEY, attrs jsonb NOT NULL);
INSERT INTO products
SELECT g, jsonb_build_object(
    'sku',   'SKU-' || lpad(g::text, 5, '0'),
    'brand', 'brand' || lpad(((g * 7919) % 400)::text, 3, '0'),
    'color', (ARRAY['red','green','blue','black','white','grey','teal','gold'])[1 + (g * 31) % 8],
    'price', round(((g * 3779) % 10000) / 100.0, 2),
    'tags',  CASE WHEN g % 10 = 0 THEN '["eco", "sale"]'::jsonb WHEN g % 3 = 0 THEN '["sale"]' ELSE '[]' END,
    'dims',  jsonb_build_object('w', g % 40, 'h', g % 25))
  || CASE WHEN g % 250 = 0 THEN '{"recalled": true}'::jsonb ELSE '{}' END
FROM generate_series(1, 20000) g;
ANALYZE products;`,
    presets: [
      { label: 'Rows become JSON', sql: `SELECT to_jsonb(c)     AS as_jsonb,
       row_to_json(c)  AS as_json
FROM customers c WHERE id = 1;

SELECT o.id,
       jsonb_build_object(
         'order',  o.id,
         'status', o.status,
         'items',  jsonb_agg(jsonb_build_object('sku', i.sku, 'qty', i.qty) ORDER BY i.sku)) AS doc
FROM orders o JOIN order_items i ON i.order_id = o.id
GROUP BY o.id ORDER BY o.id;

SELECT jsonb_object_agg(status, n) AS orders_by_status
FROM (SELECT status, count(*) AS n FROM orders GROUP BY status) s;`,
        note: '`to_jsonb(row)` turns a whole row into an object keyed by column name. `jsonb_build_object` picks the keys, `jsonb_agg(… ORDER BY …)` folds rows into an ordered array, and `jsonb_object_agg(key, value)` folds rows into one object.' },
      { label: 'Empty groups: [null], NULL or []', sql: `SELECT c.name,
       jsonb_agg(o.id ORDER BY o.id)                                  AS plain,
       jsonb_agg(o.id ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL)  AS filtered,
       COALESCE(jsonb_agg(o.id ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL), '[]') AS safe,
       jsonb_agg_strict(jsonb_build_object('id', o.id))               AS strict_objects
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name ORDER BY c.id;

SELECT jsonb_object_agg(name, city)        AS keeps_null_values,
       jsonb_object_agg_strict(name, city) AS drops_null_values
FROM customers;`,
        note: 'Dara has no orders. Plain `jsonb_agg` gives `[null]`, `FILTER` gives SQL NULL, and `COALESCE(…, \'[]\')` gives an empty array. `jsonb_agg_strict` skips NULL values but not an object full of nulls. A NULL **key** in `jsonb_object_agg` is an error; a NULL value is kept unless you use the `_strict` form.' },
      { label: 'Operators: reach into a document', sql: `SELECT id,
       body -> 'items' -> 0 ->> 'sku' AS arrow,
       body #>> '{items,0,sku}'       AS path_text,
       body['items'][0]['sku']        AS subscript,
       body @> '{"gift": true}'       AS contains,
       body ? 'gift'                  AS has_key
FROM inbox ORDER BY id;`,
        note: '`->` returns jsonb, `->>` and `#>>` return text, and a subscript returns jsonb (`"mug"` keeps its quotes). `@>` tests containment and `?` tests for a top-level key. Row 2 has no items, so its first three columns are NULL.' },
      { label: 'SQL/JSON standard functions', sql: `SELECT JSON_OBJECT('order': o.id, 'status': o.status,
         'items': JSON_ARRAYAGG(JSON_OBJECT('sku': i.sku, 'qty': i.qty) ORDER BY i.sku RETURNING jsonb)
         RETURNING jsonb) AS doc
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE o.id = 103 GROUP BY o.id;

SELECT JSON_OBJECT('a': 1, 'b': NULL)::text                AS object_keeps_null,
       JSON_OBJECT('a': 1, 'b': NULL ABSENT ON NULL)::text  AS object_drops_null,
       JSON_ARRAY(1, NULL, 'x')::text                       AS array_drops_null,
       pg_typeof(JSON_OBJECT('a': 1))                       AS default_type;

SELECT id,
       JSON_VALUE(body, '$.customer')                                       AS customer,
       JSON_VALUE(body, '$.placed' RETURNING date)                          AS placed,
       JSON_VALUE(body, '$.placed' RETURNING date DEFAULT '1900-01-01' ON ERROR) AS placed_or_default,
       JSON_VALUE(body, '$.gift' RETURNING boolean DEFAULT false ON EMPTY)  AS gift,
       JSON_QUERY(body, '$.items[*].sku' WITH WRAPPER)                      AS skus,
       JSON_EXISTS(body, '$.items[*] ? (@.price > $p)' PASSING 10 AS p)     AS has_item_over_10
FROM inbox ORDER BY id;`,
        note: 'The standard constructors return `json` unless you say `RETURNING jsonb`. `JSON_OBJECT` keeps NULLs by default, `JSON_ARRAY` drops them. Inbox row 2 has `13/11/2026`, which is not a valid date: `JSON_VALUE … RETURNING date` quietly returns NULL, unless you give a `DEFAULT … ON ERROR`.' },
      { label: 'Shred JSON into rows and load it', sql: `SELECT b.id AS inbox_id, x.*
FROM inbox b, jsonb_to_recordset(b.body -> 'items') AS x(sku text, qty int, price numeric);

SELECT b.id AS inbox_id, jt.*
FROM inbox b,
     JSON_TABLE(b.body, '$.items[*]' COLUMNS (
       line_no FOR ORDINALITY,
       sku   text    PATH '$.sku',
       qty   int     PATH '$.qty' DEFAULT 1 ON EMPTY,
       price numeric PATH '$.price')) AS jt;

SELECT b.id AS inbox_id, e.n AS line_no, e.item ->> 'sku' AS sku, e.item
FROM inbox b
LEFT JOIN LATERAL jsonb_array_elements(b.body -> 'items') WITH ORDINALITY AS e(item, n) ON true
ORDER BY b.id, e.n;

INSERT INTO orders VALUES (201, 1, '2026-11-13', 'open');
INSERT INTO order_items (order_id, sku, qty, price)
SELECT (b.body ->> 'order')::int, x.sku, COALESCE(x.qty, 1), x.price
FROM inbox b, jsonb_to_recordset(b.body -> 'items') AS x(sku text, qty int, price numeric)
WHERE b.id = 1;
SELECT * FROM order_items WHERE order_id = 201 ORDER BY sku;`,
        note: '`jsonb_to_recordset` maps each array element to a typed row: the string `"3"` becomes the integer 3 and a missing `qty` becomes NULL. `JSON_TABLE` is the SQL-standard form: one path for the rows, one per column, and `DEFAULT … ON EMPTY` for missing keys. `WITH ORDINALITY` numbers the elements from 1. The `LEFT JOIN LATERAL … ON true` keeps inbox row 2, whose array is empty.' },
      { label: 'Update toolkit', sql: `SELECT d || '{"status": "paid"}'                        AS add_or_replace_key,
       d - 'gift'                                       AS remove_key,
       d #- '{items,0}'                                 AS remove_at_path,
       jsonb_insert(d, '{items,0}', '"gift-wrap"')       AS insert_before_first,
       jsonb_insert(d, '{items,-1}', '"card"', true)     AS insert_after_last,
       jsonb_set(d, '{meta,source}', '"web"')            AS set_missing_parent,
       jsonb_set(d, '{meta}', COALESCE(d -> 'meta', '{}') || '{"source": "web"}') AS set_parent_first,
       jsonb_set(d, '{order}', NULL)                     AS null_wipes_document
FROM (SELECT '{"order": 202, "gift": true, "items": ["mug", "tea"]}'::jsonb AS d) s;

UPDATE inbox SET body = (body || '{"status": "received"}') - 'gift'
WHERE id = 2
RETURNING body;`,
        note: '`||` adds or replaces top-level keys, `-` removes a key, `#-` removes whatever sits at a path. `jsonb_insert` inserts into arrays (and refuses to overwrite an existing object key). `jsonb_set` with a missing **parent** returns the document unchanged, with no error. A SQL NULL as the new value makes the whole result NULL; pass `\'null\'::jsonb` or use `jsonb_set_lax`. Mind the parentheses: `-` binds tighter than `||`.' },
      { label: 'Validate documents', sql: `SELECT v,
       v IS JSON                   AS is_json,
       v IS JSON OBJECT            AS is_object,
       v IS JSON ARRAY             AS is_array,
       v IS JSON SCALAR            AS is_scalar,
       v IS JSON WITH UNIQUE KEYS  AS unique_keys
FROM (VALUES ('{"a": 1}'), ('{"a": 1, "a": 2}'), ('[1, 2]'), ('42'), ('{a: 1}'), ('')) AS t(v);

CREATE TABLE carts (
  id  int PRIMARY KEY,
  doc jsonb NOT NULL,
  CONSTRAINT doc_is_object CHECK (jsonb_typeof(doc) = 'object'),
  CONSTRAINT doc_has_keys  CHECK (doc ?& ARRAY['customer', 'items']),
  CONSTRAINT items_array   CHECK (jsonb_typeof(doc -> 'items') = 'array'),
  CONSTRAINT items_valid   CHECK (NOT JSON_EXISTS(doc,
    '$.items[*] ? (!exists(@.qty) || @.qty.type() != "number" || @.qty < 1)')));

DO $$
DECLARE d text;
BEGIN
  FOREACH d IN ARRAY ARRAY[
    '{"customer": "Ben", "items": [{"sku": "tea", "qty": 2}]}',
    '[1, 2]',
    '{"customer": "Ben", "items": {"sku": "tea"}}',
    '{"customer": "Ben", "items": [{"sku": "tea", "qty": "2"}]}',
    '{"customer": "Ben", "items": [{"sku": "tea"}]}',
    '{"customer": "Ben", "items": [{"sku": "tea", "qty": 0}]}'] LOOP
    BEGIN
      INSERT INTO carts VALUES ((SELECT count(*) + 1 FROM carts), d::jsonb);
      RAISE NOTICE 'accepted %', d;
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'rejected % (%)', d, SQLERRM;
    END;
  END LOOP;
END $$;`,
        note: '`IS JSON` tests text without raising an error; `WITH UNIQUE KEYS` catches duplicate keys that jsonb would silently collapse. The CHECK constraints accept only the first cart: watch the notices for which constraint rejected each of the others.' },
      { label: 'Index decision guide', sql: `CREATE INDEX products_attrs_gin  ON products USING gin (attrs);
CREATE INDEX products_attrs_path ON products USING gin (attrs jsonb_path_ops);
CREATE INDEX products_sku   ON products ((attrs ->> 'sku'));
CREATE INDEX products_price ON products (((attrs ->> 'price')::numeric));
ANALYZE products;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products WHERE attrs @> '{"brand": "brand007"}';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products WHERE attrs ? 'recalled';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products WHERE attrs ->> 'sku' = 'SKU-00042';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products WHERE (attrs ->> 'price')::numeric BETWEEN 10 AND 10.5;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products WHERE attrs @? '$.price ? (@ >= 10 && @ <= 10.5)';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM products ORDER BY (attrs ->> 'price')::numeric DESC LIMIT 5;

-- promote a hot key to a real column
ALTER TABLE products ADD COLUMN brand text GENERATED ALWAYS AS (attrs ->> 'brand') STORED;
CREATE INDEX products_brand ON products (brand);
ANALYZE products;
EXPLAIN SELECT id FROM products WHERE attrs ->> 'brand' = 'brand007';
EXPLAIN SELECT id FROM products WHERE brand = 'brand007';`,
        note: 'A GIN index is built with an operator class (opclass) that decides which operators it serves. Containment and `?` use the GIN indexes; `->>` equality, the numeric range and top-N need the B-tree expression indexes; the jsonpath range stays a Seq Scan. In the last two plans compare the `rows=` estimate: a guess of 100 for `->>` against 50 (the true count) for the promoted column.' },
    ],
  },
  production: {
    title: 'One query for an account page, with no [null]',
    context: 'A storefront API returns each customer with their orders and the items of each order. The first version ran one query for the customers, one per customer for orders, and one per order for items.',
    problem: 'The page made 1 + 4 + 4 = **9** round trips for the 4 customers here, and it grew with every order. A rewrite with `LEFT JOIN` and `jsonb_agg` cut that to one, but customers without orders came back as `"orders": [{"id": null, "items": null}]` and the mobile app crashed reading the fake order.',
    solution: 'Aggregate items per order in a subquery, then orders per customer, with `FILTER` to drop the all-NULL row and `COALESCE` to turn "no rows" into an empty array. Put `ORDER BY` inside each aggregate so the arrays have a stable order.',
    sql: `SELECT jsonb_build_object(
         'customer', c.name,
         'orders', COALESCE(jsonb_agg(jsonb_build_object('id', o.id, 'status', o.status, 'items', o.items)
                                      ORDER BY o.placed_on)
                            FILTER (WHERE o.id IS NOT NULL), '[]')) AS doc
FROM customers c
LEFT JOIN (SELECT o.*, jsonb_agg(jsonb_build_object('sku', i.sku, 'qty', i.qty, 'price', i.price)
                                 ORDER BY i.sku) AS items
           FROM orders o JOIN order_items i ON i.order_id = o.id
           GROUP BY o.id) o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;`,
    outcome: 'One statement replaces nine on the playground data, and the count no longer grows with the number of orders. Dara now gets `"orders": []`, which every client can loop over.',
  },
  pitfalls: [
    { title: 'Customers with no children get [null]',
      symptom: 'A JSON API returns `"orders": [null]` or `[{"id": null}]` for customers without orders, and clients crash on the fake element.',
      cause: 'A `LEFT JOIN` produces one all-NULL row for an unmatched parent, and `jsonb_agg` aggregates it. `jsonb_agg_strict` skips only NULL values, not objects whose fields are NULL.',
      fix: 'Filter the fake row and default the empty case: `COALESCE(jsonb_agg(x) FILTER (WHERE child.id IS NOT NULL), \'[]\')`, or aggregate in a correlated subquery, which sees no fake row but still needs `COALESCE(…, \'[]\')`.',
      sql: `SELECT c.name, COALESCE(jsonb_agg(o.id) FILTER (WHERE o.id IS NOT NULL), '[]') AS orders
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name;` },
    { title: 'JSON_VALUE turns bad data into NULL',
      symptom: 'After a load, some order dates are NULL although every document had a `placed` value.',
      cause: 'The default for `JSON_VALUE` and `JSON_QUERY` is **NULL ON ERROR**: a value that does not convert to the `RETURNING` type, or a path that finds an object or several items, gives NULL instead of an error.',
      fix: 'In loads, write `ERROR ON ERROR` so bad documents fail loudly, or `DEFAULT … ON ERROR` plus a check that counts the defaults. Use `ON EMPTY` for keys that may be missing.',
      sql: `SELECT JSON_VALUE(body, '$.placed' RETURNING date ERROR ON ERROR) FROM inbox WHERE id = 2;  -- fails: "13/11/2026" is not a date` },
    { title: 'jsonb_set silently does nothing',
      symptom: 'An `UPDATE … SET doc = jsonb_set(doc, \'{meta,source}\', \'"web"\')` reports rows updated, but the key never appears.',
      cause: '`jsonb_set` creates only the **last** step of the path. If a parent such as `meta` is missing, it returns the document unchanged, without an error.',
      fix: 'Create the parent first: `jsonb_set(doc, \'{meta}\', COALESCE(doc -> \'meta\', \'{}\') || \'{"source": "web"}\')`, or rebuild the sub-object with `||`.' },
    { title: 'Expecting one index to serve every JSON query',
      symptom: 'A GIN index exists on the document, yet `->>` filters, numeric ranges and `ORDER BY` on a JSON key are still sequential scans.',
      cause: 'GIN on the column serves `@>`, `?`, `?|`, `?&` and jsonpath **equality** (`@?`, `@@`). It cannot serve an extracted expression, a range, or ordering. A `VIRTUAL` generated column cannot be indexed at all.',
      fix: 'Add a B-tree on the exact expression (`((attrs ->> \'sku\'))`, `(((attrs ->> \'price\')::numeric))`), or promote a hot key to a `STORED` generated column with its own index and statistics.' },
  ],
  pointers: [
    'Build: `to_jsonb(row)`, `jsonb_build_object`, `jsonb_agg(x ORDER BY …)`, `jsonb_object_agg(k, v)`. Empty groups: `COALESCE(jsonb_agg(x) FILTER (WHERE … IS NOT NULL), \'[]\')`.',
    'Query: `JSON_VALUE` for one scalar (`RETURNING` a type), `JSON_QUERY` for objects, arrays or several items (`WITH WRAPPER`), `JSON_EXISTS` for a yes/no. `JSON_VALUE` and `JSON_QUERY` return NULL on error and `JSON_EXISTS` returns false, unless told otherwise.',
    'Shred with `jsonb_to_recordset` or `jsonb_array_elements … WITH ORDINALITY`; update with `||`, `-`, `#-`, `jsonb_insert`, `jsonb_set`; validate with `IS JSON` and CHECK constraints.',
    'Index guide: GIN for `@>`, `?` and jsonpath equality; B-tree on the expression for `->>`, ranges and sorting; a stored generated column for keys you filter, join or group on all the time.',
    'Going deeper: [JSON vs JSONB](/m2/json-jsonb) shows how jsonb is stored and the `jsonb_set` NULL trap, and [GIN indexes](/m4/gin) shows what the GIN opclasses actually store. Background: [Joins, visualized](/m3/joins), [LATERAL joins](/m3/lateral), [Indexes for beginners](/f3/indexes-101), [Reading EXPLAIN](/m4/explain-analyze).',
  ],
  sources: ['functions-json.html', 'functions-aggregate.html', 'datatype-json.html', 'sql-expressions.html', 'ddl-generated-columns.html', 'ddl-constraints.html', 'indexes-expressional.html', 'gin-builtin-opclasses.html'],
}
