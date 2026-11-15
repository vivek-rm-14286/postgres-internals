/**
 * The Production guide: short, checkable recommendations for running PostgreSQL behind real services.
 * Each rule says what to do, why, shows the pattern to avoid and the one to prefer, and links to the lessons that
 * explain the mechanism. The same data is exported to the MCP server so AI agents can apply the rules when they write SQL.
 * Strings support inline markup: **bold**, `code`, *emphasis*, [label](/module/slug).
 */
export interface GuideCategory {
  /** URL-safe id, e.g. "queries". */
  id: string
  title: string
  /** One sentence: what this group of rules protects. */
  blurb: string
}

export type Impact = 'correctness' | 'performance' | 'availability' | 'security' | 'operability'

export interface GuideRule {
  /** Stable, URL-safe, unique id, e.g. "paginate-with-tiebreaker". */
  id: string
  category: string
  /** The rule as an instruction, one line, e.g. "End every paginated ORDER BY with a unique column". */
  rule: string
  /** What goes wrong without it and why the rule fixes it. 1–3 sentences, precise, with real numbers or error codes where they exist. */
  why: string
  /** What the rule mainly protects. */
  impact: Impact
  /** The pattern to avoid (SQL or config). Optional. */
  avoid?: string
  /** The pattern to use (SQL or config). */
  prefer?: string
  /** When the rule does not apply, or its cost. Optional, one sentence. */
  unless?: string
  /** Lessons (and Cookbook / Reference pages) that explain it: site paths such as "/f4/pagination". At least one. */
  learn: string[]
}
