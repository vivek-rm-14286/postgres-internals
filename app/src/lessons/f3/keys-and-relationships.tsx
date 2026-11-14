import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Null, OutcomeBox, TableCard, TRY_FN, type Outcome } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: four relationship shapes. Top: a crow's-foot ER diagram. Bottom: the actual rows.
 * Click a row to light up the rows it links to. Each shape has a small lab whose results (error
 * text, SQLSTATE, cascaded rows) match what PostgreSQL 18 returns for the same schema.
 * ---------------------------------------------------------------------------------------------- */

type Mode = '1n' | 'mn' | '11' | 'self'
type Val = string | number | null
interface Row { key: string; v: Val[] }
interface Tbl { cols: string[]; pk: number[]; fk: number[]; rows: Row[] }
type DB = Record<string, Tbl>
type FkAction = 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL'

const r = (v: Val[]): Row => ({ key: v.slice(0, 2).join('|'), v })

function seed(mode: Mode): DB {
  switch (mode) {
    case '1n': return {
      authors: { cols: ['id', 'name'], pk: [0], fk: [], rows: [r([1, 'Ursula Le Guin']), r([2, 'Octavia Butler']), r([3, 'Ted Chiang'])] },
      books: { cols: ['id', 'title', 'author_id'], pk: [0], fk: [2], rows: [r([1, 'A Wizard of Earthsea', 1]), r([2, 'The Dispossessed', 1]), r([3, 'Kindred', 2]), r([4, 'Parable of the Sower', 2]), r([5, 'Exhalation', 3])] },
    }
    case 'mn': return {
      books: { cols: ['id', 'title'], pk: [0], fk: [], rows: [r([1, 'A Wizard of Earthsea']), r([2, 'The Dispossessed']), r([3, 'Kindred'])] },
      book_tags: { cols: ['book_id', 'tag_id'], pk: [0, 1], fk: [0, 1], rows: [r([1, 1]), r([1, 3]), r([2, 2]), r([2, 3]), r([3, 2])] },
      tags: { cols: ['id', 'name'], pk: [0], fk: [], rows: [r([1, 'fantasy']), r([2, 'sci-fi']), r([3, 'classic'])] },
    }
    case '11': return {
      users: { cols: ['id', 'username'], pk: [0], fk: [], rows: [r([1, 'ana']), r([2, 'raj']), r([3, 'li'])] },
      user_profiles: { cols: ['user_id', 'city'], pk: [0], fk: [0], rows: [r([1, 'Lisbon']), r([2, 'Pune'])] },
    }
    case 'self': return {
      employees: { cols: ['id', 'name', 'manager_id'], pk: [0], fk: [2], rows: [r([1, 'Maya', null]), r([2, 'Omar', 1]), r([3, 'Lena', 1]), r([4, 'Kofi', 2])] },
    }
  }
}

/** Which rows a clicked row links to. Links run from an FK value to the referenced id. */
function linked(mode: Mode, db: DB, table: string, key: string): Set<string> {
  const out = new Set<string>()
  const row = db[table].rows.find((x) => x.key === key)
  if (!row) return out
  const add = (t: string, pred: (x: Row) => boolean) => db[t]?.rows.filter(pred).forEach((x) => out.add(`${t}:${x.key}`))
  if (mode === '1n') {
    if (table === 'authors') add('books', (b) => b.v[2] === row.v[0])
    else add('authors', (a) => a.v[0] === row.v[2])
  } else if (mode === 'mn') {
    if (table === 'book_tags') { add('books', (b) => b.v[0] === row.v[0]); add('tags', (t) => t.v[0] === row.v[1]) }
    else {
      const col = table === 'books' ? 0 : 1, other = table === 'books' ? 'tags' : 'books', ocol = table === 'books' ? 1 : 0
      const links = db.book_tags.rows.filter((j) => j.v[col] === row.v[0])
      links.forEach((j) => { out.add(`book_tags:${j.key}`); add(other, (o) => o.v[0] === j.v[ocol]) })
    }
  } else if (mode === '11') {
    if (table === 'users') add('user_profiles', (p) => p.v[0] === row.v[0])
    else add('users', (u) => u.v[0] === row.v[0])
  } else {
    add('employees', (e) => e.v[2] === row.v[0] || e.v[0] === row.v[2])
  }
  return out
}

/* ---------- ER diagram ---------- */

const EW = 140, HEAD = 22, LINE = 17
interface Ent { name: string; x: number; y: number; cols: [string, string][] }
const colY = (e: Ent, i: number) => e.y + HEAD + i * LINE + LINE / 2 + 2

const ER: Record<Mode, { ents: Ent[]; h: number; w: number }> = {
  '1n': { h: 108, w: 480, ents: [
    { name: 'authors', x: 16, y: 14, cols: [['id', 'PK'], ['name', '']] },
    { name: 'books', x: 324, y: 14, cols: [['id', 'PK'], ['title', ''], ['author_id', 'FK']] }] },
  mn: { h: 108, w: 560, ents: [
    { name: 'books', x: 6, y: 14, cols: [['id', 'PK'], ['title', '']] },
    { name: 'book_tags', x: 210, y: 14, cols: [['book_id', 'PK FK'], ['tag_id', 'PK FK']] },
    { name: 'tags', x: 414, y: 14, cols: [['id', 'PK'], ['name', '']] }] },
  '11': { h: 108, w: 480, ents: [
    { name: 'users', x: 16, y: 14, cols: [['id', 'PK'], ['username', 'UQ']] },
    { name: 'user_profiles', x: 324, y: 14, cols: [['user_id', 'PK FK'], ['city', '']] }] },
  self: { h: 108, w: 480, ents: [
    { name: 'employees', x: 140, y: 14, cols: [['id', 'PK'], ['name', ''], ['manager_id', 'FK']] }] },
}

/** Crow's-foot ends. `dir` is the side the line leaves the box on: +1 right, -1 left. */
function End({ x, y, dir, many, optional }: { x: number; y: number; dir: 1 | -1; many?: boolean; optional?: boolean }) {
  const c = 'var(--c-pointer)'
  return (
    <g stroke={c} strokeWidth={1.6} fill="none">
      {many
        ? <><line x1={x + dir * 14} y1={y} x2={x} y2={y - 7} /><line x1={x + dir * 14} y1={y} x2={x} y2={y} /><line x1={x + dir * 14} y1={y} x2={x} y2={y + 7} /></>
        : <line x1={x + dir * 8} y1={y - 7} x2={x + dir * 8} y2={y + 7} />}
      {optional
        ? <circle cx={x + dir * 21} cy={y} r={4} fill="var(--surface)" />
        : <line x1={x + dir * 18} y1={y - 7} x2={x + dir * 18} y2={y + 7} />}
    </g>
  )
}

function ErDiagram({ mode }: { mode: Mode }) {
  const { ents, h, w: W } = ER[mode]
  const e = (n: string) => ents.find((x) => x.name === n)!
  const txt = { fontFamily: 'var(--font-mono)' }
  const link = (d: string) => <motion.path key={d} d={d} fill="none" stroke="var(--c-pointer)" strokeWidth={1.6} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
  const label = (x: number, y: number, s: string) => <text x={x} y={y} fontSize={10} textAnchor="middle" fill="var(--c-pointer)" style={txt}>{s}</text>
  let rel = null
  if (mode === '1n') {
    const a = e('authors'), b = e('books'), y1 = colY(a, 0), y2 = colY(b, 2)
    rel = <g>{link(`M${a.x + EW} ${y1} C ${a.x + EW + 70} ${y1}, ${b.x - 70} ${y2}, ${b.x} ${y2}`)}
      <End x={a.x + EW} y={y1} dir={1} optional /><End x={b.x} y={y2} dir={-1} many optional />
      {label(a.x + EW + 40, y1 - 9, 'zero or one')}{label(b.x - 34, y2 + 18, 'many')}</g>
  } else if (mode === 'mn') {
    const a = e('books'), j = e('book_tags'), t = e('tags')
    rel = <g>{link(`M${a.x + EW} ${colY(a, 0)} L ${j.x} ${colY(j, 0)}`)}{link(`M${t.x} ${colY(t, 0)} C ${t.x - 6} ${colY(t, 0)}, ${j.x + EW + 6} ${colY(j, 1)}, ${j.x + EW} ${colY(j, 1)}`)}
      <End x={a.x + EW} y={colY(a, 0)} dir={1} /><End x={j.x} y={colY(j, 0)} dir={-1} many optional />
      <End x={t.x} y={colY(t, 0)} dir={-1} /><End x={j.x + EW} y={colY(j, 1)} dir={1} many optional /></g>
  } else if (mode === '11') {
    const a = e('users'), b = e('user_profiles'), y = colY(a, 0)
    rel = <g>{link(`M${a.x + EW} ${y} L ${b.x} ${y}`)}<End x={a.x + EW} y={y} dir={1} /><End x={b.x} y={y} dir={-1} optional />
      {label(a.x + EW + 34, y - 9, 'one')}{label(b.x - 40, y - 9, 'zero or one')}</g>
  } else {
    const a = e('employees'), y1 = colY(a, 2), y2 = colY(a, 0), x = a.x + EW
    rel = <g>{link(`M${x} ${y1} C ${x + 120} ${y1 + 10}, ${x + 120} ${y2 - 10}, ${x} ${y2}`)}<End x={x} y={y1} dir={1} many optional /><End x={x} y={y2} dir={1} optional />
      <text x={x + 100} y={(y1 + y2) / 2 + 4} fontSize={10} fill="var(--c-pointer)" style={txt}>reports to</text></g>
  }
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="mx-auto w-full min-w-[480px]" style={{ maxWidth: W * 1.3 }} role="img" aria-label="Entity relationship diagram">
      {ents.map((en) => (
        <motion.g key={en.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
          <rect x={en.x} y={en.y} width={EW} height={HEAD + en.cols.length * LINE + 6} rx={6} fill="var(--surface)" stroke="var(--border)" />
          <rect x={en.x} y={en.y} width={EW} height={HEAD} rx={6} fill={toneBg('header', 22)} />
          <text x={en.x + 8} y={en.y + 15} fontSize={12} fontWeight={700} fill="var(--text)" style={txt}>{en.name}</text>
          {en.cols.map(([c, k], i) => (
            <g key={c}>
              <text x={en.x + 8} y={colY(en, i) + 4} fontSize={11} fill="var(--text)" style={txt}>{c}</text>
              {k && <text x={en.x + EW - 8} y={colY(en, i) + 4} fontSize={10} textAnchor="end" fontWeight={700} fill={k.includes('FK') ? 'var(--c-pointer)' : 'var(--c-header)'} style={txt}>{k}</text>}
            </g>
          ))}
        </motion.g>
      ))}
      {rel}
    </svg>
  )
}

/* ---------- labs ---------- */

const MSG = {
  noAction: (t: string, fk: string, child: string, id: Val): Outcome => ({ ok: false, code: '23503', title: `ERROR: update or delete on table "${t}" violates foreign key constraint "${fk}" on table "${child}"`, detail: `DETAIL: Key (id)=(${id}) is still referenced from table "${child}".` }),
  restrict: (t: string, fk: string, child: string, id: Val): Outcome => ({ ok: false, code: '23001', title: `ERROR: update or delete on table "${t}" violates RESTRICT setting of foreign key constraint "${fk}" on table "${child}"`, detail: `DETAIL: Key (id)=(${id}) is referenced from table "${child}".` }),
  dup: (c: string, cols: string, vals: string): Outcome => ({ ok: false, code: '23505', title: `ERROR: duplicate key value violates unique constraint "${c}"`, detail: `DETAIL: Key (${cols})=(${vals}) already exists.` }),
  missing: (t: string, fk: string, col: string, v: Val, parent: string): Outcome => ({ ok: false, code: '23503', title: `ERROR: insert or update on table "${t}" violates foreign key constraint "${fk}"`, detail: `DETAIL: Key (${col})=(${v}) is not present in table "${parent}".` }),
}

interface Action { label: string; sql: string; run: (db: DB) => { db: DB; o: Outcome; gone?: string[] } }
const clone = (db: DB): DB => Object.fromEntries(Object.entries(db).map(([k, t]) => [k, { ...t, rows: t.rows.map((x) => ({ ...x, v: [...x.v] })) }]))

function actionsFor(mode: Mode, fkAction: FkAction, target: number): Action[] {
  if (mode === '1n') return [{
    label: `DELETE author ${target}`, sql: `DELETE FROM authors WHERE id = ${target};`,
    run: (db0) => {
      const db = clone(db0)
      const kids = db.books.rows.filter((b) => b.v[2] === target)
      if (!db.authors.rows.some((a) => a.v[0] === target)) return { db, o: { ok: true, title: 'DELETE 0', detail: 'That author is already gone. **Reset** to start again.' } }
      if (kids.length && fkAction === 'NO ACTION') return { db, o: MSG.noAction('authors', 'books_author_id_fkey', 'books', target) }
      if (kids.length && fkAction === 'RESTRICT') return { db, o: MSG.restrict('authors', 'books_author_id_fkey', 'books', target) }
      db.authors.rows = db.authors.rows.filter((a) => a.v[0] !== target)
      if (fkAction === 'CASCADE') {
        db.books.rows = db.books.rows.filter((b) => b.v[2] !== target)
        return { db, o: { ok: true, title: 'DELETE 1', detail: kids.length ? `The cascade also deleted **${kids.length}** book${kids.length > 1 ? 's' : ''}. The command tag counts only the author row.` : 'No books referenced this author, so nothing cascaded.' } }
      }
      db.books.rows.forEach((b) => { if (b.v[2] === target) b.v[2] = null })
      return { db, o: { ok: true, title: 'DELETE 1', detail: kids.length ? `**${kids.length}** book${kids.length > 1 ? 's' : ''} kept, with \`author_id\` set to NULL.` : 'No books referenced this author.' } }
    },
  }]
  if (mode === 'mn') return [
    { label: 'DELETE book 1', sql: 'DELETE FROM books WHERE id = 1;  -- book_tags FKs are ON DELETE CASCADE',
      run: (db0) => {
        const db = clone(db0)
        if (!db.books.rows.some((b) => b.v[0] === 1)) return { db, o: { ok: true, title: 'DELETE 0', detail: 'Book 1 is already gone.' } }
        const n = db.book_tags.rows.filter((j) => j.v[0] === 1).length
        db.books.rows = db.books.rows.filter((b) => b.v[0] !== 1)
        db.book_tags.rows = db.book_tags.rows.filter((j) => j.v[0] !== 1)
        return { db, o: { ok: true, title: 'DELETE 1', detail: `Its **${n}** link rows in \`book_tags\` were removed by the cascade. The tags themselves stay.` } }
      } },
    { label: 'Link book 1 to fantasy again', sql: 'INSERT INTO book_tags VALUES (1, 1);',
      run: (db0) => {
        const db = clone(db0)
        if (!db.books.rows.some((b) => b.v[0] === 1)) return { db, o: MSG.missing('book_tags', 'book_tags_book_id_fkey', 'book_id', 1, 'books') }
        if (db.book_tags.rows.some((j) => j.v[0] === 1 && j.v[1] === 1)) return { db, o: MSG.dup('book_tags_pkey', 'book_id, tag_id', '1, 1') }
        db.book_tags.rows.push(r([1, 1]))
        return { db, o: { ok: true, title: 'INSERT 0 1' } }
      } },
    { label: 'Link book 3 to classic', sql: 'INSERT INTO book_tags VALUES (3, 3);',
      run: (db0) => {
        const db = clone(db0)
        if (db.book_tags.rows.some((j) => j.v[0] === 3 && j.v[1] === 3)) return { db, o: MSG.dup('book_tags_pkey', 'book_id, tag_id', '3, 3') }
        db.book_tags.rows.push(r([3, 3]))
        return { db, o: { ok: true, title: 'INSERT 0 1', detail: 'A new pair is just a new row in the junction table. Neither `books` nor `tags` changed.' } }
      } },
  ]
  if (mode === '11') return [
    { label: 'Second profile for ana', sql: "INSERT INTO user_profiles VALUES (1, 'Porto');",
      run: (db) => db.user_profiles.rows.some((p) => p.v[0] === 1)
        ? { db, o: MSG.dup('user_profiles_pkey', 'user_id', '1') }
        : (() => { const d = clone(db); d.user_profiles.rows.push(r([1, 'Porto'])); return { db: d, o: { ok: true, title: 'INSERT 0 1' } } })() },
    { label: 'First profile for li', sql: "INSERT INTO user_profiles VALUES (3, 'Seoul');",
      run: (db) => db.user_profiles.rows.some((p) => p.v[0] === 3)
        ? { db, o: MSG.dup('user_profiles_pkey', 'user_id', '3') }
        : (() => { const d = clone(db); d.user_profiles.rows.push(r([3, 'Seoul'])); return { db: d, o: { ok: true, title: 'INSERT 0 1', detail: 'li had no profile, so this is allowed. Run it again to see the second one rejected.' } } })() },
    { label: 'Profile for user 9', sql: "INSERT INTO user_profiles VALUES (9, 'Oslo');",
      run: (db) => ({ db, o: MSG.missing('user_profiles', 'user_profiles_user_id_fkey', 'user_id', 9, 'users') }) },
  ]
  return [
    { label: 'DELETE Maya (id 1)', sql: 'DELETE FROM employees WHERE id = 1;',
      run: (db) => db.employees.rows.some((e) => e.v[2] === 1)
        ? { db, o: MSG.noAction('employees', 'employees_manager_id_fkey', 'employees', 1) }
        : (() => { const d = clone(db); d.employees.rows = d.employees.rows.filter((e) => e.v[0] !== 1); return { db: d, o: { ok: true, title: 'DELETE 1' } } })() },
    { label: 'DELETE Kofi (id 4)', sql: 'DELETE FROM employees WHERE id = 4;',
      run: (db) => {
        if (!db.employees.rows.some((e) => e.v[0] === 4)) return { db, o: { ok: true, title: 'DELETE 0' } }
        const d = clone(db); d.employees.rows = d.employees.rows.filter((e) => e.v[0] !== 4)
        return { db: d, o: { ok: true, title: 'DELETE 1', detail: 'Nobody reports to Kofi, so no row references id 4.' } }
      } },
  ]
}

const INFO: Record<Mode, string> = {
  '1n': 'One author writes **many** books. The *many* side holds the **foreign key**: `books.author_id` must match some `authors.id`. Click a row to see what it links to.',
  mn: 'A book has many tags and a tag labels many books. Neither table can hold the link, so a **junction table** `book_tags` stores one row per pair. Its primary key is the pair itself.',
  '11': 'Each user has **zero or one** profile. `user_profiles.user_id` is both the foreign key and the primary key, so a second profile for the same user is impossible.',
  self: 'An employee\'s manager is another employee. `manager_id` references the **same table**. The person at the top has no manager, so hers is NULL.',
}
const DDL: Record<Mode, (a: FkAction) => string> = {
  '1n': (a) => `author_id bigint REFERENCES authors (id) ON DELETE ${a}`,
  mn: () => 'PRIMARY KEY (book_id, tag_id),  book_id → books ON DELETE CASCADE',
  '11': () => 'user_id bigint PRIMARY KEY REFERENCES users (id)',
  self: () => 'manager_id int REFERENCES employees (id)',
}
const MODES: [Mode, string][] = [['1n', 'One-to-many'], ['mn', 'Many-to-many'], ['11', 'One-to-one'], ['self', 'Self-reference']]

function RelationshipsViz() {
  const [mode, setMode] = useState<Mode>('1n')
  const [db, setDb] = useState<DB>(() => seed('1n'))
  const [sel, setSel] = useState<{ t: string; k: string } | null>({ t: 'authors', k: '1|Ursula Le Guin' })
  const [fkAction, setFkAction] = useState<FkAction>('NO ACTION')
  const [out, setOut] = useState<{ o: Outcome; n: number; sql: string } | null>(null)

  const go = (m: Mode) => { setMode(m); setDb(seed(m)); setSel(null); setOut(null) }
  const next = () => go(MODES[(MODES.findIndex(([m]) => m === mode) + 1) % MODES.length][0])
  const target = mode === '1n' && sel?.t === 'authors' ? Number(sel.k.split('|')[0]) : 1
  const acts = actionsFor(mode, fkAction, target)
  const lit = useMemo(() => (sel ? linked(mode, db, sel.t, sel.k) : new Set<string>()), [mode, db, sel])
  const run = (a: Action) => { const res = a.run(db); setDb(res.db); setOut({ o: res.o, n: (out?.n ?? 0) + 1, sql: a.sql }) }

  const hlFor = (t: string) => {
    const h: Record<string, Tone> = {}
    db[t].rows.forEach((x) => {
      if (sel && sel.t === t && sel.k === x.key) h[x.key] = 'accent'
      else if (lit.has(`${t}:${x.key}`)) h[x.key] = 'new'
    })
    return h
  }
  const cell = (v: Val) => (v === null ? <Null /> : String(v))

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Relationship" value={mode} onChange={go} options={MODES} />
        <Btn testid="viz-next" primary onClick={next}>Next shape</Btn>
      </div>
      <p className="text-sm text-muted"><Md>{INFO[mode]}</Md></p>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><ErDiagram key={mode} mode={mode} /></div>
      <Legend items={[['header', 'primary key'], ['pointer', 'foreign key and link'], ['accent', 'clicked row'], ['new', 'rows it links to']]} />
      <div className={`grid gap-2 ${Object.keys(db).length === 3 ? 'sm:grid-cols-3' : Object.keys(db).length === 2 ? 'sm:grid-cols-2' : ''}`}>
        {Object.entries(db).map(([name, t]) => (
          <TableCard key={`${mode}-${name}`} name={name} cols={t.cols} keyCols={t.pk} fkCols={t.fk} hl={hlFor(name)}
            onRow={(k) => setSel(sel?.t === name && sel.k === k ? null : { t: name, k })}
            rows={t.rows.map((x) => ({ key: x.key, cells: x.v.map(cell) }))} />
        ))}
      </div>
      <div className="grid gap-2 rounded-lg border border-line bg-surface-2 p-3">
        <p className="font-mono text-[12px] break-words text-muted">{DDL[mode](fkAction)}</p>
        {mode === '1n' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">ON DELETE</span>
            <Segmented label="ON DELETE action" value={fkAction} onChange={(a) => { setFkAction(a); setOut(null) }}
              options={[['NO ACTION', 'NO ACTION'], ['RESTRICT', 'RESTRICT'], ['CASCADE', 'CASCADE'], ['SET NULL', 'SET NULL']]} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {acts.map((a) => <Btn key={a.label} onClick={() => run(a)}>{a.label}</Btn>)}
          <Btn onClick={() => { setDb(seed(mode)); setOut(null) }}>Reset rows</Btn>
        </div>
        {mode === '1n' && <p className="text-xs text-muted">Click an author row first to choose which one to delete.</p>}
        {out && <p className="font-mono text-[12px] break-words" style={{ color: tone.text('accent') }}>{out.sql}</p>}
        <OutcomeBox o={out?.o ?? null} k={out?.n ?? 0} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'keys-and-relationships',
  module: 'f3',
  order: 1,
  title: 'Keys and relationships',
  tldr: [
    'A **primary key** gives every row a unique, never-NULL identity, and a **foreign key** is a column whose value must match the primary key (or another `UNIQUE` column) of the table it references.',
    'Together they let you split data into focused tables and still connect them reliably, because PostgreSQL refuses any row that would point at nothing.',
  ],
  visualizer: {
    title: 'Four ways tables relate',
    caption: 'Switch between the shapes, click rows to follow the links, then use the lab buttons. In one-to-many, pick an **ON DELETE** action and delete an author.',
    Component: RelationshipsViz,
  },
  playground: {
    setup: `${TRY_FN}

CREATE TABLE authors (
  id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE books (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title     text NOT NULL,
  author_id bigint NOT NULL REFERENCES authors (id) ON DELETE RESTRICT
);
CREATE TABLE tags (
  id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE
);
CREATE TABLE book_tags (
  book_id bigint REFERENCES books (id) ON DELETE CASCADE,
  tag_id  int    REFERENCES tags (id)  ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);
CREATE TABLE employees (
  id         int PRIMARY KEY,
  name       text NOT NULL,
  manager_id int REFERENCES employees (id)
);
INSERT INTO authors (name) VALUES ('Ursula Le Guin'), ('Octavia Butler'), ('Ted Chiang');
INSERT INTO books (title, author_id) VALUES
  ('A Wizard of Earthsea', 1), ('The Dispossessed', 1), ('Kindred', 2),
  ('Parable of the Sower', 2), ('Exhalation', 3);
INSERT INTO tags (name) VALUES ('fantasy'), ('sci-fi'), ('classic');
INSERT INTO book_tags VALUES (1, 1), (1, 3), (2, 2), (2, 3), (3, 2), (4, 2), (5, 2);
INSERT INTO employees VALUES (1, 'Maya', NULL), (2, 'Omar', 1), (3, 'Lena', 1), (4, 'Kofi', 2);`,
    presets: [
      { label: 'One-to-many join', sql: `SELECT a.name AS author, b.title
FROM authors a
JOIN books b ON b.author_id = a.id
ORDER BY a.name, b.title;`,
        note: 'Each author appears once per book. The join condition is simply **foreign key = primary key**.' },
      { label: 'Many-to-many through the junction', sql: `SELECT b.title, string_agg(t.name, ', ' ORDER BY t.name) AS tags
FROM books b
JOIN book_tags bt ON bt.book_id = b.id
JOIN tags t       ON t.id = bt.tag_id
GROUP BY b.title
ORDER BY b.title;`,
        note: 'Two joins: book to junction, junction to tag. `book_tags` holds nothing but pairs of ids.' },
      { label: 'Rows that would point at nothing', sql: `SELECT try($$INSERT INTO books (title, author_id) VALUES ('Ghost', 99)$$) AS orphan_book;
SELECT try($$INSERT INTO book_tags VALUES (1, 1)$$) AS duplicate_link;
SELECT try($$DELETE FROM authors WHERE id = 1$$) AS delete_parent;`,
        note: '`try()` runs a statement and returns its error instead of aborting. Look for **23503** (no such author), **23505** (pair already linked) and **23001** (RESTRICT blocks the delete).' },
      { label: 'CASCADE on the junction', sql: `DELETE FROM books WHERE id = 2 RETURNING id, title;

SELECT * FROM book_tags ORDER BY book_id, tag_id;`,
        note: 'Book 2 had two tags. Its two `book_tags` rows vanished with it; the tags themselves are untouched.' },
      { label: 'Self-reference: who reports to whom', sql: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;`,
        note: 'Join the table to itself under two aliases. `LEFT JOIN` keeps Maya, whose `manager_id` is NULL.' },
      { label: 'List every foreign key', sql: `SELECT conrelid::regclass AS on_table,
       conname,
       confrelid::regclass AS references_table,
       CASE confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' ELSE 'SET DEFAULT' END AS on_delete
FROM pg_constraint
WHERE contype = 'f'
ORDER BY 1, 2;`,
        note: 'Default names follow `<table>_<column>_fkey`. The self-reference shows `employees` on both sides.' },
    ],
  },
  production: {
    title: 'Deleting one customer took 40 seconds',
    context: 'A SaaS billing team keeps `invoices(customer_id REFERENCES customers)` with tens of millions of invoice rows. Support staff delete test customers from an admin page.',
    problem: 'Each delete hung for many seconds and sometimes timed out. Deleting a parent row makes PostgreSQL check the child table for rows that still reference it, and `invoices.customer_id` had **no index**. Every delete was a full scan of the invoices table.',
    solution: 'PostgreSQL indexes the *referenced* side (the primary key) automatically, but never the *referencing* side. Add the missing index without blocking writes, then check that the lookup uses it.',
    sql: `CREATE INDEX CONCURRENTLY invoices_customer_id_idx ON invoices (customer_id);

EXPLAIN SELECT 1 FROM invoices WHERE customer_id = 42;
-- Index Only Scan using invoices_customer_id_idx ...`,
    outcome: 'The foreign-key check becomes a single index lookup touching a handful of pages, so the delete returns in milliseconds. Joins from customers to invoices get the same speed-up.',
  },
  pitfalls: [
    { title: 'Foreign key without an index',
      symptom: 'Deleting or updating a parent row is slow, and it gets slower as the child table grows.',
      cause: 'Each parent delete must look for child rows that still reference it. Without an index on the foreign-key column, that lookup reads the whole child table.',
      fix: 'Index the referencing column on any child table that is large or whose parents get deleted.',
      sql: 'CREATE INDEX CONCURRENTLY books_author_id_idx ON books (author_id);' },
    { title: 'CASCADE deletes more than you expected',
      symptom: 'One `DELETE` removes thousands of rows in other tables, and the command tag still says `DELETE 1`.',
      cause: '`ON DELETE CASCADE` silently follows every chain of foreign keys. The command tag counts only rows of the table you named.',
      fix: 'Use CASCADE for rows that truly belong to the parent (junction rows, order lines). Use `RESTRICT` or the default `NO ACTION` for anything with independent value, like invoices.' },
    { title: 'A nullable foreign key lets rows float free',
      symptom: 'Books exist with no author, and joins quietly drop them.',
      cause: 'A NULL foreign-key value is never checked. It does not have to match anything.',
      fix: 'Declare the column `NOT NULL` unless "no parent" is a real state of your data.',
      sql: 'ALTER TABLE books ALTER COLUMN author_id SET NOT NULL;' },
    { title: 'Using a value that changes as the primary key',
      symptom: 'A user changes their email and dozens of tables need updating, or the update fails on a foreign key.',
      cause: 'Natural keys such as emails, usernames and phone numbers change in real life. Every referencing row must change with them.',
      fix: 'Use a **surrogate key** (`bigint GENERATED ALWAYS AS IDENTITY` or `uuidv7()`) as the primary key, and keep the natural value as a separate `UNIQUE` column. [UUIDv4 vs UUIDv7](/m2/uuid-v4-v7) compares the two kinds of UUID key.' },
  ],
  pointers: [
    'A **primary key** is UNIQUE plus NOT NULL, one per table, and it creates a unique index automatically.',
    'The table on the **many** side holds the **foreign key**. Many-to-many needs a **junction table** with two foreign keys and a composite primary key.',
    'One-to-one is a foreign key that is also **UNIQUE** (or the primary key). A self-reference points a column at its own table.',
    '`ON DELETE` decides what happens to children: **NO ACTION** (default, checked at the end of the statement, can be deferred to commit) or **RESTRICT** (checked at once) refuse, **CASCADE** deletes them, **SET NULL** detaches them. Index the foreign-key column yourself.',
    '**Going deeper:** [Modelling data: normalization and constraints](/m1/normalization-constraints) shows how to decide which tables you need in the first place.',
  ],
  sources: ['ddl-constraints.html', 'ddl-identity-columns.html', 'tutorial-fk.html', 'functions-uuid.html', 'sql-createtable.html', 'catalog-pg-constraint.html'],
}
