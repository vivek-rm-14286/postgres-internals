import type { ComponentType } from 'react'
import type { ExtensionName } from '../playground/extensions'

/**
 * The lesson contract. Every lesson renders exactly six sections, in this order:
 *   1 TL;DR  2 Visualizer  3 Playground  4 Production example  5 Pitfalls  6 Key pointers
 * Strings support inline markup: **bold**, `code`, *emphasis*.
 */
export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7'

export interface Preset {
  label: string
  sql: string
  /** What to look for in the output. One or two sentences. */
  note?: string
}

export interface Pitfall {
  title: string
  /** What you see in production. */
  symptom: string
  /** Why it happens. */
  cause: string
  /** The exact fix. */
  fix: string
  sql?: string
}

export interface Lesson {
  slug: string
  module: ModuleId
  /** Position within the module, starting at 1. */
  order: number
  title: string
  /** Exactly two sentences: what it is, and why it exists. */
  tldr: [string, string]
  visualizer: {
    title: string
    /** One line telling the reader how to drive the visual. */
    caption: string
    Component: ComponentType
  }
  playground: {
    extensions?: ExtensionName[]
    /** Runs once before the reader's first query (schema + seed data). */
    setup: string
    presets: Preset[]
  }
  production: {
    title: string
    context: string
    problem: string
    solution: string
    sql?: string
    outcome: string
  }
  pitfalls: Pitfall[]
  /** 3 to 5 bullets. */
  pointers: string[]
  /** Official docs pages this lesson is drawn from (file names under postgresql.org/docs/current/). */
  sources: string[]
}
