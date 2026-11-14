import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Md } from '../../lesson/Md'
import { Legend, tone, toneBg } from '../../viz/kit'

/* ------------------------------------------------------------------------------------------------
 * Clickable lock conflict matrix. Rows = mode requested by session B, columns = mode already held by A.
 * Data is Table 13.2 (table-level) or Table 13.3 (row-level) of the PostgreSQL 18 docs.
 * ---------------------------------------------------------------------------------------------- */

export interface LockMode { name: string; short: string; takenBy: string }

export function LockMatrix({ modes, conflicts, initial = [0, modes.length - 1], kind }: {
  modes: LockMode[]; conflicts: boolean[][]; initial?: [number, number]; kind: 'table' | 'row'
}) {
  const [[req, held], setSel] = useState<[number, number]>(initial)
  const [pick, setPick] = useState<'held' | 'req'>('held')
  const x = conflicts[req][held]
  const clickMode = (i: number) => {
    if (pick === 'held') { setSel([req, i]); setPick('req') } else { setSel([i, held]); setPick('held') }
  }
  const selfConflict = modes.map((_, i) => conflicts[i][i])
  return (
    <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Click a cell, or click two modes in turn:</span>
        {modes.map((m, i) => (
          <button key={m.name} onClick={() => clickMode(i)}
            className="rounded-md border px-2 py-1 font-mono text-[11px] transition hover:border-accent"
            style={{ borderColor: i === held ? tone('pointer') : i === req ? tone('accent') : 'var(--border)', background: i === held ? toneBg('pointer', 18) : i === req ? toneBg('accent', 18) : 'transparent', color: 'var(--text)' }}>
            {m.short}
          </button>
        ))}
        <span className="ml-1">next click sets: <b className="text-ink">{pick === 'held' ? 'held by A' : 'requested by B'}</b></span>
      </div>
      <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
        <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line bg-bg p-2">
          <table className={`border-collapse font-mono text-[11px] ${kind === 'table' ? 'w-full min-w-[560px]' : 'w-auto min-w-[360px]'}`}>
            <thead>
              <tr>
                <th className="p-1 text-left text-[10.5px] font-normal text-muted">B requests ↓ / A holds →</th>
                {modes.map((m, c) => (
                  <th key={m.name} className="p-1 text-center text-[10.5px] font-semibold" style={{ color: c === held ? tone('pointer') : 'var(--muted)' }}>{m.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modes.map((m, r) => (
                <tr key={m.name}>
                  <th className="p-1 pr-2 text-left text-[11px] font-semibold whitespace-nowrap" style={{ color: r === req ? tone('accent') : 'var(--text)' }}>{m.short}</th>
                  {modes.map((_, c) => {
                    const on = conflicts[r][c]
                    const sel = r === req && c === held
                    const cross = r === req || c === held
                    return (
                      <td key={c} className="p-0.5">
                        <motion.button onClick={() => setSel([r, c])} aria-label={`${m.name} requested while ${modes[c].name} held: ${on ? 'conflict' : 'compatible'}`}
                          animate={{ scale: sel ? 1.12 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="flex h-7 w-full min-w-[44px] items-center justify-center rounded text-[12px] font-bold"
                          style={{ background: on ? toneBg('dead', sel ? 55 : cross ? 32 : 20) : toneBg('ok', sel ? 40 : cross ? 18 : 8), color: on ? tone('dead') : tone('ok'), outline: sel ? `2px solid ${tone('accent')}` : 'none' }}>
                          {on ? '✕' : '✓'}
                        </motion.button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${req}-${held}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border p-3 text-sm" style={{ borderColor: tone(x ? 'dead' : 'ok'), background: toneBg(x ? 'dead' : 'ok', 8) }}>
            <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: tone.text(x ? 'dead' : 'ok') }}>{x ? 'Conflict: B waits' : 'Compatible: both granted'}</p>
            <p className="mt-1.5"><span className="font-mono font-semibold" style={{ color: tone.text('pointer') }}>A holds {modes[held].name}</span></p>
            <p className="text-xs text-muted"><Md>{modes[held].takenBy}</Md></p>
            <p className="mt-1.5"><span className="font-mono font-semibold" style={{ color: tone.text('accent') }}>B requests {modes[req].name}</span></p>
            <p className="text-xs text-muted"><Md>{modes[req].takenBy}</Md></p>
            <p className="mt-2 text-xs"><Md>{x
              ? `B sleeps in the lock queue until A's transaction ends${kind === 'table' ? ' (or `lock_timeout` fires)' : ' (or fails at once with `NOWAIT`, or skips the row with `SKIP LOCKED`)'}.`
              : `Both locks are granted together. ${selfConflict[req] ? `Note that **${modes[req].short}** conflicts with itself.` : `**${modes[req].short}** is not self-conflicting, so many sessions can hold it at once.`}`}</Md></p>
            <p className="mt-2 text-[11px] text-muted">A session never conflicts with its own locks, so this matrix only applies between different transactions.</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <Legend items={[['dead', 'conflict (✕)'], ['ok', 'compatible (✓)'], ['pointer', 'held by A'], ['accent', 'requested by B']]} />
    </div>
  )
}

/** Table 13.2. Order: ACCESS SHARE … ACCESS EXCLUSIVE. */
export const TABLE_MODES: LockMode[] = [
  { name: 'ACCESS SHARE', short: 'AccS', takenBy: 'Plain `SELECT`; any read-only query.' },
  { name: 'ROW SHARE', short: 'RowS', takenBy: '`SELECT … FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE`.' },
  { name: 'ROW EXCLUSIVE', short: 'RowX', takenBy: '`INSERT`, `UPDATE`, `DELETE`, `MERGE`.' },
  { name: 'SHARE UPDATE EXCLUSIVE', short: 'SUX', takenBy: '`VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY`, `ALTER TABLE … SET STATISTICS / VALIDATE CONSTRAINT`.' },
  { name: 'SHARE', short: 'Shr', takenBy: '`CREATE INDEX` (without CONCURRENTLY).' },
  { name: 'SHARE ROW EXCLUSIVE', short: 'SRX', takenBy: '`CREATE TRIGGER`, some `ALTER TABLE` forms (e.g. adding a foreign key).' },
  { name: 'EXCLUSIVE', short: 'Excl', takenBy: '`REFRESH MATERIALIZED VIEW CONCURRENTLY`.' },
  { name: 'ACCESS EXCLUSIVE', short: 'AccX', takenBy: '`DROP`, `TRUNCATE`, `VACUUM FULL`, `CLUSTER`, `REINDEX`, most `ALTER TABLE`, bare `LOCK TABLE`.' },
]
const T = true, F = false
export const TABLE_CONFLICTS: boolean[][] = [
  [F, F, F, F, F, F, F, T],
  [F, F, F, F, F, F, T, T],
  [F, F, F, F, T, T, T, T],
  [F, F, F, T, T, T, T, T],
  [F, F, T, T, F, T, T, T],
  [F, F, T, T, T, T, T, T],
  [F, T, T, T, T, T, T, T],
  [T, T, T, T, T, T, T, T],
]

/** Table 13.3. Order: FOR KEY SHARE … FOR UPDATE. */
export const ROW_MODES: LockMode[] = [
  { name: 'FOR KEY SHARE', short: 'KeyShr', takenBy: '`SELECT … FOR KEY SHARE`; foreign-key checks on the referenced row.' },
  { name: 'FOR SHARE', short: 'Shr', takenBy: '`SELECT … FOR SHARE`.' },
  { name: 'FOR NO KEY UPDATE', short: 'NoKeyUpd', takenBy: '`SELECT … FOR NO KEY UPDATE`; any `UPDATE` that does not change a key column.' },
  { name: 'FOR UPDATE', short: 'Upd', takenBy: '`SELECT … FOR UPDATE`; `DELETE`; an `UPDATE` that changes a unique-indexed (FK-usable) column.' },
]
export const ROW_CONFLICTS: boolean[][] = [
  [F, F, F, T],
  [F, F, T, T],
  [F, T, T, T],
  [T, T, T, T],
]
