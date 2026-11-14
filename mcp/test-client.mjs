// End-to-end test: launches the server over stdio and calls every tool, like an MCP client would.
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const client = new Client({ name: 'test', version: '1.0.0' })
await client.connect(new StdioClientTransport({ command: process.execPath, args: [new URL('./server.mjs', import.meta.url).pathname] }))
const call = async (name, args) => { const t0 = Date.now(); const r = await client.callTool({ name, arguments: args }); return { ms: Date.now() - t0, isError: r.isError, text: r.content[0].text } }
let fail = 0
const check = (label, r, ok) => { const pass = ok(r); if (!pass) fail++; console.log(`${pass ? '✓' : '✗'} ${label} (${r.ms} ms)${pass ? '' : '\n' + r.text.slice(0, 600)}`) }

const tools = await client.listTools()
console.log('tools:', tools.tools.map((t) => t.name).join(', '))
check('search HOT fillfactor', await call('search', { query: 'HOT update fillfactor' }), (r) => /hot-fillfactor/.test(r.text))
check('search SQLSTATE 40P01', await call('search', { query: '40P01', kind: 'reference' }), (r) => /deadlock_detected/.test(r.text))
const s = await call('search', { query: 'visibility map all-frozen', kind: 'docs', limit: 3 })
check('search docs', s, (r) => /note:\d+/.test(r.text))
check('read note', await call('read', { id: s.text.match(/note:\d+/)[0] }), (r) => r.text.length > 200)
check('list_lessons m5', await call('list_lessons', { module: 'm5' }), (r) => /isolation-levels/.test(r.text))
check('list_lessons e1', await call('list_lessons', { module: 'e1' }), (r) => /hnsw/.test(r.text))
const ex = await call('search', { query: 'latest order per customer', kind: 'exercise' })
check('search exercises', ex, (r) => /exercise:/.test(r.text))
check('read exercise', await call('read', { id: ex.text.match(/exercise:[\w-]+/)[0] }), (r) => /Reference solution/.test(r.text) && /CREATE TABLE/.test(r.text))
check('get_lesson', await call('get_lesson', { slug: 'slotted-page' }), (r) => /## Pitfalls/.test(r.text) && /```sql/.test(r.text))
check('lookup work_mem', await call('lookup_reference', { query: 'work_mem', table: 'config-parameters' }), (r) => /^\[config-parameters\] Parameter: work_mem/.test(r.text))
check('run_sql pageinspect', await call('run_sql', { sql: `create extension pageinspect; create table t(id int primary key, v text);
insert into t values (1,'a'),(2,'b'); update t set v='bb' where id=2;
select lp, lp_off, t_xmin, t_xmax, t_ctid from heap_page_items(get_raw_page('t',0));` }), (r) => /\(0,3\)/.test(r.text) && !r.isError)
check('state persists', await call('run_sql', { sql: 'select count(*) from t' }), (r) => /\b2\b/.test(r.text))
check('notices', await call('run_sql', { sql: 'vacuum (verbose) t' }), (r) => /INFO:\s+vacuuming/.test(r.text))
check('explain', await call('run_sql', { sql: 'explain (analyze, buffers, costs off) select * from t where id = 1' }), (r) => /actual time=/.test(r.text) && /Buffers: shared hit/.test(r.text))
check('error + sqlstate', await call('run_sql', { sql: 'insert into t values (1, \'dup\')' }), (r) => r.isError && /23505/.test(r.text))
check('isolated sessions', await call('run_sql', { sql: "select to_regclass('t')", session: 'other' }), (r) => /NULL/.test(r.text))
check('vector', await call('run_sql', { sql: "create extension vector; select '[1,2,3]'::vector <-> '[1,2,4]'", session: 'other' }), (r) => /\b1\b/.test(r.text))
check('timeout kills runaway query', await call('run_sql', { sql: 'select count(*) from generate_series(1, 1e12)', session: 'spin', timeout_ms: 2000 }), (r) => r.isError && /timed out/.test(r.text))
check('reset', await call('reset_sandbox', { session: 'default' }), (r) => /reset/.test(r.text))
check('fresh after reset', await call('run_sql', { sql: "select to_regclass('t')" }), (r) => /NULL/.test(r.text))
await client.close()
console.log(fail ? `\n${fail} failed` : '\nAll checks pass.')
process.exit(fail ? 1 : 0)
