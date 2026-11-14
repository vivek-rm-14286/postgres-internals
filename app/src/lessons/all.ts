import type { Lesson } from '../lesson/types'

// Eager registry of every lesson, for Node tooling only (manifest generation, check-lessons, smoke test).
// The browser app never imports this file; it uses the code-split loaders in ./index.ts.
const files = import.meta.glob<{ lesson: Lesson }>('./m*/[!_]*.tsx', { eager: true })

export const ALL_LESSONS: (Lesson & { file: string })[] = Object.entries(files)
  .filter(([, f]) => f.lesson)
  .map(([file, f]) => ({ ...f.lesson, file }))
  .sort((a, b) => a.module.localeCompare(b.module) || a.order - b.order)
