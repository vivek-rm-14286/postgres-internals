# Process: how the content is researched, built and verified

The same pipeline produced every module. Re-use it to extend the site.

## 1. Ingest

1. **Render sources with a real browser.** `tools/crawl/crawl.mjs` walks the PostgreSQL docs from `index.html`, renders
   each page in headless Chromium, saves the visible text and writes `_order.tsv` (reading order) and `_manifest.json`.
   `tools/crawl/crawl-list.mjs <urls.txt> <outdir> <prefix>` does the same for a fixed URL list (tutorials, articles),
   with JavaScript enabled.
2. **Slice and read in full.** Split the pages into slices of about 500k characters and give each to a research agent
   with `curriculum/_BRIEF.md` (official docs), `_BRIEF_TUTORIALS.md` (tutorials) or `_BRIEF_ECOSYSTEM.md` (extension
   ecosystems). Agents write incrementally, so interruptions lose nothing:
   - a coverage ledger with one row per page;
   - notes by topic, each tagged with the modules it feeds;
   - complete inventories;
   - lesson ideas.
3. **Prove coverage mechanically.** Check that every page index appears in a ledger. For the PDF, run
   `tools/pdf-audit/check_reference.py` (every outline entry, and every reference row).

## 2. Design

`curriculum/CURRICULUM.md` fixes each module's lessons (slug, title, scope). The tracks, modules and display codes are
in `app/src/lessons/modules.ts`.

## 3. Build

Each module agent follows `curriculum/_BUILD_BRIEF.md` (the round-2 addendum overrides earlier rules):

- **Module plan first.** Write `curriculum/modules/<id>.md`: 8–15 facts per lesson with doc pages, the visualizer
  design, the playground plan, the production scenario and the pitfalls.
- **Lesson contract** (`app/src/lesson/types.ts`): TL;DR of exactly two sentences, an interactive and animated
  visualizer, a playground with setup SQL and 4–8 presets with "look for" notes, a production example
  (context → problem → solution → outcome), pitfalls (symptom / cause / fix) and 3–5 key pointers.
- **Real numbers.** Capture offsets, plans, sizes and recall from PGlite runs.
- **Phone first.** No layout wider than 390 px. Wide SVGs scroll inside an Expand frame.
- **Plain content.** No provenance wording in visible text. Links between lessons use `[label](/module/slug)`.
- **Tools that cannot run in the browser** are simulated faithfully, paired with native equivalents in the playground.

## 4. Verify

- `npm run check:lessons` checks template completeness and placeholder text. It fails on broken internal links, and it
  executes every setup and preset on PGlite in Node, with the lesson's extensions and server settings.
- `npm run check:standalone` runs every playground example on a fresh database (setup plus that one example), so no
  example depends on the one before it.
- `npm run check:cookbook` checks that every reference solution is accepted and an empty wrong answer is rejected.
  Dataset ids must be unique.
- `npm run build` runs a type-check and the static build. A generated manifest drives navigation and per-lesson chunks.
- `npm run smoke` serves the built site from a sub-path like GitHub Pages. Headless Chromium visits every lesson, steps
  the visualizer, boots PGlite and runs a query, then solves Cookbook exercises in the browser. Any console error or
  failed request fails the run.
- `node scripts/mobile-audit.mjs <base> <dir> <routes…>` reports any element wider than a 390 px viewport.
- **Independent fact-check** (`curriculum/_VERIFY_BRIEF.md`). A different agent re-checks every visible claim against
  the research notes, the raw docs, vendor primary docs and real runs. It fixes clear errors with minimal edits, flags
  anything unverifiable and reports a table of issues. In round 2 this found about 100 real issues.

## 5. Ship

`.github/workflows/deploy.yml` runs the lesson and Cookbook checks, builds and deploys to GitHub Pages on every push to
`main`. `app/scripts/export-for-mcp.mjs` refreshes the MCP server's data (`mcp/data`) from the lessons, exercises,
reference tables and notes. `npm test` in `mcp/` exercises every MCP tool.

## Agent briefs (verbatim, in `curriculum/`)

| File | Used for |
|---|---|
| `_BRIEF.md` | the 15 official-docs research slices |
| `_BRIEF_TUTORIALS.md` | the Neon and Crunchy tutorial research |
| `_BRIEF_ECOSYSTEM.md` | pgvector, TimescaleDB, distributed PostgreSQL research |
| `_BUILD_BRIEF.md` | every lesson-building agent (rounds 1–3) |
| `_TUTORIAL_PASS_BRIEF.md` | applying tutorial material to existing modules |
| `_VERIFY_BRIEF.md` | the independent fact-check of each module and the Cookbook |

`docs/agent-plans/` holds the resume plans the research agents wrote when plan mode interrupted them.
