import type { Lesson } from '../lesson/types'
import { moduleById } from './modules'

// Eager registry of every lesson, for Node tooling only (manifest generation, check-lessons, smoke test).
// The browser app never imports this file; it uses the code-split loaders in ./index.ts.
const files = import.meta.glob<{ lesson: Lesson }>('./*/[!_]*.tsx', { eager: true })

export const ALL_LESSONS: (Lesson & { file: string })[] = Object.entries(files)
  .filter(([, f]) => f.lesson)
  .map(([file, f]) => ({ ...f.lesson, file }))
  .sort((a, b) => moduleById(a.module).n - moduleById(b.module).n || a.order - b.order)
