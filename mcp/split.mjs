// Same splitter the website playground uses: psql-style, one statement per message.
/**
 * Split a SQL script into individual statements, the way psql does, so each runs as its own
 * simple-query message. (Sending them as one message would wrap them in a single implicit transaction,
 * which breaks VACUUM, CREATE INDEX CONCURRENTLY and anything that expects per-statement commits.)
 * Handles '…' / E'…' strings, "…" identifiers, $tag$…$tag$ bodies, -- and nested block comments.
 * BEGIN ATOMIC … END bodies are kept whole.
 */
export function splitStatements(sql) {
  const out = []
  let start = 0
  let i = 0
  let atomicDepth = 0
  const n = sql.length
  const push = (end) => {
    const s = sql.slice(start, end).trim()
    if (s && !/^(--[^\n]*\n?|\s|\/\*[\s\S]*?\*\/)*$/.test(s)) out.push(s)
  }
  while (i < n) {
    const c = sql[i]
    const next = sql[i + 1]
    if (c === '-' && next === '-') { const e = sql.indexOf('\n', i); i = e < 0 ? n : e + 1; continue }
    if (c === '/' && next === '*') {
      let depth = 1; i += 2
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') { depth++; i += 2 } else if (sql[i] === '*' && sql[i + 1] === '/') { depth--; i += 2 } else i++
      }
      continue
    }
    if (c === "'") {
      const escaped = i > 0 && /[eE]/.test(sql[i - 1]) && (i < 2 || !/[A-Za-z0-9_]/.test(sql[i - 2]))
      i++
      while (i < n) {
        if (escaped && sql[i] === '\\') { i += 2; continue }
        if (sql[i] === "'") { if (sql[i + 1] === "'") { i += 2; continue } i++; break }
        i++
      }
      continue
    }
    if (c === '"') { i++; while (i < n) { if (sql[i] === '"') { if (sql[i + 1] === '"') { i += 2; continue } i++; break } i++ } continue }
    if (c === '$') {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))
      if (m && !(i > 0 && /[A-Za-z0-9_]/.test(sql[i - 1]))) {
        const tag = m[0]; const e = sql.indexOf(tag, i + tag.length)
        i = e < 0 ? n : e + tag.length
        continue
      }
    }
    if (/[A-Za-z]/.test(c) && (i === 0 || !/[A-Za-z0-9_]/.test(sql[i - 1]))) {
      const w = /^[A-Za-z_]+/.exec(sql.slice(i))[0]
      const lw = w.toLowerCase()
      if (lw === 'begin' && /^begin\s+atomic\b/i.test(sql.slice(i))) atomicDepth++
      else if (atomicDepth > 0 && (lw === 'case')) atomicDepth++
      else if (atomicDepth > 0 && lw === 'end') atomicDepth--
      i += w.length
      continue
    }
    if (c === ';' && atomicDepth === 0) { push(i); start = i + 1 }
    i++
  }
  push(n)
  return out
}
