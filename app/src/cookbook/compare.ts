import { Engine, formatCell, type RunOutput, type StatementResult } from '../playground/engine'
import type { Dataset, Exercise } from './types'

export interface Verdict {
  ok: boolean
  /** One-line reason shown to the reader. */
  message: string
  mine?: StatementResult
  expected?: StatementResult
  error?: RunOutput['error']
}

/** The result set that gets compared: the last statement that returned columns. */
const lastRows = (out: RunOutput) => [...out.results].reverse().find((r) => r.fields.length > 0)

/** JSON replacer: object keys in sorted order, so two JSON documents that differ only in key order compare equal. Arrays keep their order. */
const sortKeys = (_k: string, x: unknown) =>
  x && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype
    ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
    : x

const norm = (v: unknown) => {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)
  const plain = v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Uint8Array)
  const s = plain ? JSON.stringify(v, sortKeys) : formatCell(v)
  // numeric comes back as a string: compare 2.50 and 2.5 as equal
  return /^-?\d+\.\d+$/.test(s) ? String(Math.round(parseFloat(s) * 1e6) / 1e6) : s
}

async function runOn(dataset: Dataset, sql: string, check?: string, signal?: AbortSignal): Promise<{ out: RunOutput; rows?: StatementResult }> {
  const engine = new Engine(dataset.extensions ?? [], dataset.setup)
  const onAbort = () => { engine.stop('Stopped.') }
  signal?.addEventListener('abort', onAbort)
  try {
    const out = await engine.run(sql)
    if (out.error || !check) return { out, rows: lastRows(out) }
    const after = await engine.run(check)
    return { out: after, rows: lastRows(after) }
  } finally {
    signal?.removeEventListener('abort', onAbort)
    await engine.close()
  }
}

/** Run the reader's SQL and the reference solution on two fresh copies of the dataset, then compare. */
export async function checkAnswer(ex: Exercise, dataset: Dataset, sql: string, signal?: AbortSignal): Promise<Verdict> {
  // Only the reader's SQL can run away, so only that copy listens for Stop (and is subject to the time limit in practice).
  const [mine, ref] = await Promise.all([runOn(dataset, sql, ex.check, signal), runOn(dataset, ex.solution, ex.check)])
  if (ref.out.error) return { ok: false, message: `The reference solution failed: ${ref.out.error.message}` }
  if (mine.out.stopped) return { ok: false, message: 'Your query was stopped before it finished.', error: mine.out.error }
  if (mine.out.error) return { ok: false, message: 'Your query raised an error.', error: mine.out.error }
  const a = mine.rows, b = ref.rows
  if (!a) return { ok: false, message: ex.check ? 'The check query returned nothing.' : 'Your SQL did not return any rows. End with a SELECT (or RETURNING).', expected: b }
  if (!b) return { ok: false, message: 'The reference solution returned no rows.' }
  if (a.fields.length !== b.fields.length)
    return { ok: false, message: `Expected ${b.fields.length} column${b.fields.length === 1 ? '' : 's'} (${b.fields.join(', ')}), got ${a.fields.length}.`, mine: a, expected: b }
  if (a.rows.length !== b.rows.length) return { ok: false, message: `Expected ${b.rows.length} row${b.rows.length === 1 ? '' : 's'}, got ${a.rows.length}.`, mine: a, expected: b }
  const key = (r: unknown[]) => r.map(norm).join('␟')
  const ka = a.rows.map(key), kb = b.rows.map(key)
  if (!ex.ordered) { ka.sort(); kb.sort() }
  const bad = ka.findIndex((k, i) => k !== kb[i])
  if (bad >= 0) {
    if (ex.ordered && [...ka].sort().join() === [...kb].sort().join()) return { ok: false, message: 'Right rows, wrong order. Check your ORDER BY.', mine: a, expected: b }
    return { ok: false, message: 'Some values differ from the expected result.', mine: a, expected: b }
  }
  const renamed = a.fields.some((f, i) => f !== b.fields[i])
  return { ok: true, message: renamed ? `Correct. (Expected column names: ${b.fields.join(', ')}.)` : 'Correct!', mine: a, expected: b }
}
