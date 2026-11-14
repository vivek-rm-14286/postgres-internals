import type { ExtensionName } from '../playground/extensions'

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'expert']

/** A shared, realistic sample database that exercises run against. */
export interface Dataset {
  id: string
  title: string
  /** One or two sentences: what the data models. */
  description: string
  extensions?: ExtensionName[]
  /** Creates and seeds the schema. Deterministic (no random()), runs in well under a second. */
  setup: string
  /** Shown in the schema panel: table name + its columns with types, e.g. "id int PK, name text, …". */
  tables: { name: string; columns: string }[]
}

/**
 * One graded exercise. The reader's SQL and `solution` each run on a fresh copy of the dataset; then the result of the
 * last row-returning statement (or of `check`, when given) is compared. Strings support **bold** / `code` / *em*.
 */
export interface Exercise {
  id: string
  dataset: string
  level: Level
  /** Short topic tag for filtering, e.g. "filtering", "joins", "window functions". */
  topic: string
  title: string
  /** The task, stated precisely: which columns, in which order, and whether row order matters. */
  task: string
  hint?: string
  /** Optional starting SQL placed in the editor. */
  starter?: string
  solution: string
  /** Why the solution works, and the alternatives or traps. 1–4 sentences. */
  explanation: string
  /** Row order must match the solution (only when the task asks for an ORDER BY). */
  ordered?: boolean
  /** For data-changing exercises: a SELECT run after the reader's statements; its result is what gets compared. */
  check?: string
}
