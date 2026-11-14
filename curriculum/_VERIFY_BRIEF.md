# Verification brief: independent fact-check of one module

You are a skeptical reviewer, not the author. Assume the lessons contain errors until you have checked them. The site
teaches PostgreSQL to everyone from beginners to experts, so every statement must be **precise, correct and current**.

## Inputs
- The module's lesson files: `/Users/vivek-14286/postgres-internals/app/src/lessons/<module>/*.tsx`. Read every visible
  string: TL;DR, visualizer step titles and bodies, labels, captions, preset notes, production example, pitfalls, pointers.
- Sources of truth:
  - `/Users/vivek-14286/postgres-internals/curriculum/research/[A-O]-*.md` (official PostgreSQL 18 docs, distilled).
  - For ecosystem modules, `V-pgvector.md`, `W-timescaledb.md`, `X-distributed-postgres.md`.
  - The raw PG docs text: `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/<page>.txt`.
  - Where these are silent, the vendor's own current docs, via WebFetch.
- A real PostgreSQL 18 to test claims (from `/Users/vivek-14286/postgres-internals/app`):
  `node --input-type=module -e "import {PGlite} from '@electric-sql/pglite'; const db=await PGlite.create(); console.log((await db.query('select 1')).rows)"`
  For pgvector, add `import {vector} from '@electric-sql/pglite-pgvector'` and pass `{extensions:{vector}}`.

## Check
1. **Facts:** every claim about behaviour, syntax, defaults, limits, versions, lock levels, error codes, numbers.
   Test anything testable. Check every preset `note` against that preset's real output.
2. **Simulations:** a simulated mechanism (concurrency, replication, extensions that can't run here) must match the
   documented behaviour step for step, with plausible numbers. Nothing may claim the playground runs something it doesn't.
3. **Teaching quality:** terms are defined before use (critical in Fundamentals). There are no contradictions between
   sections, and pitfalls give a correct fix. Examples are realistic.
4. **Rules:** no provenance wording in visible text ("the docs", "documented", "captured", "PGlite", "illustrative",
   tutorial or vendor names other than the products being taught). The TL;DR is exactly 2 sentences; there are 3–5 pointers.
5. **Mobile:** run `node scripts/.mobile.mjs 'http://localhost:<port>/' <scratch-dir> <routes…>` against a dev server
   (`npx vite --port <port> --strictPort`, HMR off if needed). Every route must report `"doc":390` with no offenders.

## Fix
Fix clear errors directly in the lesson files with minimal edits: wrong facts, wrong numbers, misleading wording,
provenance phrases, mobile overflow. Keep the author's structure and style. If something is debatable or you can't verify
it, do not guess: soften it to what you can verify, or flag it. After editing, run
`node scripts/check-lessons.mjs <module>` (must pass) and `npx tsc -p tsconfig.app.json --noEmit` (no errors in the folder).
Write only inside the module's lesson folder. Do not run `npm run build`.

## Report
Reply with:
- a table of every issue found: lesson, what was wrong, severity (factual error / misleading / style), fixed or flagged;
- the items you could not verify;
- the check-lessons result;
- the mobile result.
Nothing else.
