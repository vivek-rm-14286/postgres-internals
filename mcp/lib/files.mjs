// Safe config-file editing: JSONC edits that keep comments, minimal TOML table edits, and exact restore on uninstall.
import fs from 'node:fs'
import path from 'node:path'
import { applyEdits, modify, parse } from 'jsonc-parser'
import { installDir } from './install.mjs'

/** Strip // and /* *\/ comments and trailing commas, outside of strings (JSONC → JSON). */
export function stripJsonc(text) {
  let out = '', i = 0, inStr = false
  while (i < text.length) {
    const ch = text[i], nx = text[i + 1]
    if (inStr) { out += ch; if (ch === '\\') { out += nx ?? ''; i += 2; continue } if (ch === '"') inStr = false; i++; continue }
    if (ch === '"') { inStr = true; out += ch; i++; continue }
    if (ch === '/' && nx === '/') { while (i < text.length && text[i] !== '\n') i++; continue }
    if (ch === '/' && nx === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue }
    out += ch; i++
  }
  return out.replace(/,(\s*[}\]])/g, '$1')
}

export const hasComments = (text) => stripJsonc(text).replace(/\s+/g, '') !== text.replace(/,(\s*[}\]])/g, '$1').replace(/\s+/g, '')

export function readJson(file) {
  if (!fs.existsSync(file)) return { data: {}, raw: null }
  const raw = fs.readFileSync(file, 'utf8')
  if (!raw.trim()) return { data: {}, raw }
  const errors = []
  const data = parse(raw, errors, { allowTrailingComma: true })
  if (errors.length) throw new Error(`${file} is not valid JSON (fix it or move it aside, then re-run)`)
  return { data: data ?? {}, raw }
}

/*
 * Every config edit is recorded in <installDir>/manifest.json: the file's text before our first edit, and the text we
 * last wrote. Uninstall restores the original byte-for-byte when the file is unchanged since; otherwise it removes our
 * entry surgically. No backup files are left next to the user's configs.
 */
const manifestFile = () => path.join(installDir(), 'manifest.json')
function manifest() { try { return JSON.parse(fs.readFileSync(manifestFile(), 'utf8')) } catch { return { files: {} } } }
function saveManifest(m) { fs.mkdirSync(path.dirname(manifestFile()), { recursive: true }); fs.writeFileSync(manifestFile(), JSON.stringify(m, null, 1)) }

/** Write `text` to a user config file, remembering the pre-install original the first time. */
export function trackedWrite(file, text) {
  const m = manifest()
  if (!m.files[file]) m.files[file] = { before: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null }
  m.files[file].after = text
  saveManifest(m)
  writeText(file, text)
}

/**
 * Undo our edit to `file`. If it is unchanged since we wrote it, restore the original exactly (or delete a file we
 * created). Otherwise apply `surgical(currentText, originalText)` and write its result.
 */
export function trackedRestore(file, surgical) {
  const m = manifest()
  const rec = m.files[file]
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (rec && cur === rec.after) {
    if (rec.before === null) fs.rmSync(file, { force: true }); else writeText(file, rec.before)
  } else if (cur !== null) {
    const next = surgical(cur, rec?.before ?? null)
    if (next !== cur) writeText(file, next)
  }
  if (rec) { delete m.files[file]; saveManifest(m) }
}

export function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}`
  fs.writeFileSync(tmp, text)
  fs.renameSync(tmp, file)
}

const getPath = (obj, keys) => keys.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj)

const FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' } }

/** Set obj[keys…][name] = entry, editing the text in place (comments and formatting elsewhere are preserved). */
export function jsonSet(file, keys, name, entry) {
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const text = raw.trim() ? raw : '{}\n'
  const cur = getPath(parse(text, [], { allowTrailingComma: true }), [...keys, name])
  if (JSON.stringify(cur) === JSON.stringify(entry)) return { changed: false }
  const next = applyEdits(text, modify(text, [...keys, name], entry, FORMAT))
  trackedWrite(file, next.endsWith('\n') ? next : next + '\n')
  return { changed: true }
}

export function jsonHas(file, keys, name) {
  try { const n = getPath(readJson(file).data, keys); return !!(n && typeof n === 'object' && name in n) } catch { return false }
}

/** Remove obj[keys…][name]; also drop parent objects that are now empty and did not exist before install. */
export function jsonDelete(file, keys, name) {
  if (!fs.existsSync(file) || !jsonHas(file, keys, name)) return { changed: false }
  trackedRestore(file, (cur, before) => {
    let next = applyEdits(cur, modify(cur, [...keys, name], undefined, FORMAT))
    const orig = before ? parse(before, [], { allowTrailingComma: true }) : undefined
    for (let i = keys.length; i > 0; i--) {
      const p = keys.slice(0, i)
      const node = getPath(parse(next, [], { allowTrailingComma: true }), p)
      if (node && typeof node === 'object' && !Object.keys(node).length && getPath(orig, p) === undefined) next = applyEdits(next, modify(next, p, undefined, FORMAT))
      else break
    }
    return next
  })
  return { changed: true }
}

/* ---- TOML: replace/remove one [table.name] block textually, leaving the rest of the file untouched ---- */

const tableRe = (header) => new RegExp(`^\\[${header.replace(/[.[\]\\-]/g, (m) => '\\' + m)}\\][^\\n]*\\n(?:(?!\\[)[^\\n]*\\n?)*`, 'm')

export function tomlHas(file, header) {
  return fs.existsSync(file) && tableRe(header).test(fs.readFileSync(file, 'utf8'))
}

export function tomlSet(file, header, body) {
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const block = `[${header}]\n${body.trim()}\n`
  const next = tableRe(header).test(raw) ? raw.replace(tableRe(header), block + '\n') : (raw && !raw.endsWith('\n') ? raw + '\n' : raw) + (raw ? '\n' : '') + block
  if (next === raw) return { changed: false }
  trackedWrite(file, next.replace(/\n{3,}/g, '\n\n'))
  return { changed: true }
}

export function tomlDelete(file, header) {
  if (!tomlHas(file, header)) return { changed: false }
  trackedRestore(file, (cur) => cur.replace(tableRe(header), '').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n'))
  return { changed: true }
}
