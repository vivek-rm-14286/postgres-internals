# Build brief: writing one module of lessons

You are a senior PostgreSQL internals engineer and a frontend engineer. You are building **one module** of an
interactive visual textbook, "Postgres Internals, Visualized": a static React site (Vite, React 19, TypeScript,
Tailwind 4, Framer Motion) with a real PostgreSQL 18 (PGlite, WebAssembly) in every lesson. Think Distill.pub or
Josh Comeau: visual first, crisp, and no walls of text.

## Read first (in this order)
1. `/Users/vivek-14286/postgres-internals/curriculum/CURRICULUM.md`: your module's lesson table (slugs, titles, scope) and the research files most relevant to it.
2. `/Users/vivek-14286/postgres-internals/app/src/lesson/types.ts`: the Lesson contract. Read every comment.
3. Shared UI you may import: `app/src/viz/Stepper.tsx` (step-through shell with play/pause/scrub), `app/src/viz/kit.tsx`
   (Block, Tag, Legend, Segmented, FieldTable, Panel, `tone()`/`toneBg()` semantic colours), `app/src/lesson/Md.tsx`
   (inline **bold** / `code` / *em*), `app/src/playground/extensions.ts` (extension names you may request).
4. The two finished **reference lessons**. They set the quality bar; match or beat them:
   `app/src/lessons/m2/slotted-page.tsx` (Stepper-based, real captured data, clickable inspector) and
   `app/src/lessons/m4/btree.tsx` (live simulation with buttons, stats tiles, mode toggle).
5. The research notes: `/Users/vivek-14286/postgres-internals/curriculum/research/`. `A-…O-*.md` distil the entire official
   PostgreSQL 18.7 documentation and are the **source of truth for facts**. `T1-…T4-*.md` and `TC-*.md` are Neon and Crunchy Data
   tutorial notes: use them for teaching angles, worked examples and sample datasets, never for facts the docs contradict
   (their "Discrepancies" sections list known errors). If a T file you want is still missing, carry on and check again later.
   Use grep to find your topics. The raw docs text is also there if you need the exact wording:
   `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/<page>.txt`.

## What to produce
1. `curriculum/modules/<module>.md` (write it first, keep it compact). For each lesson: 8–15 key facts, each with its doc
   page; the visualizer design (states/steps, interaction, what it proves); the playground schema and presets; the production
   scenario; pitfalls. This is your plan. Then build from it.
2. One file per lesson: `app/src/lessons/<module>/<slug>.tsx`, exporting `export const lesson: Lesson`, with the
   **exact slugs, titles and order** from CURRICULUM.md. Lessons marked DONE already exist: do not touch them.
   You may add non-lesson helper files in your folder named with a leading underscore (e.g. `_viz.tsx`). They must not export
   `lesson`. **Write only inside `app/src/lessons/<module>/` and `curriculum/modules/<module>.md`.** Do not edit shared files.
   If you need a primitive that does not exist, build it locally.

## The six sections, every lesson
1. **TL;DR**: `tldr: [s1, s2]`, exactly one sentence each: what it is, and why it exists. The checker counts sentence
   punctuation, so do not use "e.g." / "i.e." / "vs." in the TL;DR.
2. **Visualizer**: the heart of the lesson. It must be *interactive* (step through, toggle modes, insert/delete, drag a
   slider, click to inspect) and *animated* with Framer Motion (layout transitions, springs, path morphs), not a static diagram.
   It must show the real mechanism with real numbers: offsets, xids, LSNs, costs, lock modes. Where possible, capture the numbers
   from an actual PGlite run (see "Verify with real Postgres" below), as the reference lessons do. Rules:
   - Use the semantic tones from `kit.tsx` (header/pointer/tuple/dead/new/free/ok/accent/muted) and CSS variables only, so
     both themes work. Never hard-code hex colours. Show a `Legend` whenever more than two colours carry meaning.
   - SVG diagrams: give the svg a `viewBox` plus `className="w-full min-w-[…px]"`; the lesson page provides horizontal scroll
     on narrow screens. Text inside SVG ≥ 9.5px in user units at the intended width.
   - The primary "advance" control must carry `data-testid="viz-next"` (Stepper already does). The smoke test clicks it.
   - Concurrency or replication mechanisms that PGlite cannot run (two sessions, a standby, PgBouncer) are *simulated* in the
     visualizer with a scripted timeline (Session A / Session B lanes, primary / standby lanes) faithful to the documented behaviour.
3. **Playground**: `setup` (a small, realistic schema with seed data; `generate_series` is fine; keep it under ~1 s to run)
   and **4–7 presets**, each with a `note` saying what to look for. Presets build on each other in order. The engine splits
   scripts into statements like psql, so each statement autocommits unless the preset writes BEGIN … COMMIT. PGlite facts:
   PostgreSQL 18.6, single backend (no second session, no replication, no `pg_basebackup`), extensions limited to
   `extensions.ts`, `SET` works, prefer not to use `ALTER SYSTEM`. `EXPLAIN (ANALYZE, BUFFERS)`, `pageinspect`,
   `pg_visibility`, `pg_walinspect`, `pg_stat_statements`, `pg_locks`, `pg_current_snapshot()` all work.
   Every preset must run without error.
4. **Production example**: a concrete engineering scenario (context → problem → solution with SQL → measurable outcome).
   Use generic actors ("a payments team", "an IoT platform"). Do not attribute incidents to real companies or invent their
   internal numbers. Numbers you quote should be computed or measured, or plainly labelled as illustrative.
5. **Pitfalls**: 3–4, each with `symptom` / `cause` / `fix` (+ `sql` when useful). Real production traps the docs warn about.
6. **Key pointers**: 3–5 crisp bullets for revision.
Plus `sources`: the official doc page file names (`<page>.html`, matching the research ledgers' `.txt` names).

## Writing style
Short sentences. Active voice. **Bold** the key terms. One idea per sentence. Explain mechanics as visual steps (Stepper step
titles and bodies), not paragraphs. Stepper step bodies: 1–3 sentences. No filler, no marketing tone, no emoji.
No placeholders of any kind ("TODO", "coming soon", lorem ipsum). Every lesson is complete and correct.

## Verify with real Postgres (do this a lot)
From `/Users/vivek-14286/postgres-internals/app` you can run PGlite in Node to check claims and capture numbers:
```
node --input-type=module -e "
import { PGlite } from '@electric-sql/pglite';
import { pageinspect } from '@electric-sql/pglite/contrib/pageinspect';
const db = await PGlite.create({ extensions: { pageinspect } });
await db.exec('create extension pageinspect; create table t(id int); insert into t values (1);');
console.log((await db.query('select * from heap_page_items(get_raw_page(\'t\',0))')).rows);"
```
(Other extensions: `@electric-sql/pglite/contrib/<name>`; pgvector: `@electric-sql/pglite-pgvector`.) If your text states
a number that the playground can show, make sure the playground actually shows it.

## Definition of done (run all of these before you report)
- `cd /Users/vivek-14286/postgres-internals/app && npx tsc -p tsconfig.app.json --noEmit` shows no errors in your folder.
- `node scripts/check-lessons.mjs <module>` passes for all your lessons (template completeness, and every setup and preset
  runs on real PGlite).
- Visual QA: start a dev server on your own port, `npx vite --port <port> --strictPort` (run it in the background), then screenshot
  each visualizer, light and dark, and look at the images:
  `node scripts/.shot.mjs 'http://localhost:<port>/#/<module>/<slug>' /private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/<module>-<slug>.png 1280 dark <clicks> '[data-testid=visualizer]'`
  (args: url, out.png, width, theme light|dark, number of viz-next clicks, element selector). Fix overlaps, clipped text and
  low contrast. Also check one lesson at width 390. Kill your dev server when done.
- Do NOT run `npm run build` (other agents share `dist/`) and do not touch other modules.

Reply with: the lesson files written, check-lessons output summary, and anything you could not verify. Nothing else.

---
## Addendum (round 2): rules that override anything above

1. **Module folders.** Lessons live in `app/src/lessons/<module-id>/` where module ids are `f1 f2 f3 f4` (Fundamentals),
   `m1…m7` (Internals; `m3` is shown as F4 in the Fundamentals track), and `e1 e2 e3` (Ecosystem). The module list,
   tracks and display codes are in `app/src/lessons/modules.ts`. The lesson table for each module is in `curriculum/CURRICULUM.md`.
2. **Audience by track.** Fundamentals lessons are for people new to SQL: plain language, define every term the first
   time it appears, build up step by step, and show results. Then end each lesson with one "going deeper" pointer to the
   relevant Internals lesson. Keep the same six-section template and the same accuracy bar.
3. **No provenance in visible text.** Never write "the docs say", "as documented", "captured from a real run", "in
   PGlite", "illustrative", vendor or tutorial names, or chapter/table numbers in any rendered string. State content as
   fact. The `sources` field is kept but not rendered. Product names that ARE the subject (pgvector, TimescaleDB, Citus,
   YugabyteDB, Patroni…) are fine.
4. **Phone first.** Every lesson must work on a 390 px wide phone without the page scrolling sideways. The lesson page
   wraps each visualizer in a frame with an Expand (full-screen) button, and the frame scrolls horizontally when needed.
   Still, prefer layouts that reflow: `flex-wrap`, responsive grids (`grid-cols-1 sm:grid-cols-2`), SVGs with a
   `viewBox` and `w-full` that stay legible when scaled, and `min-w-[…]` no wider than 640 px. Check one lesson of yours
   at width 390 (`node scripts/.shot.mjs '<url>' out.png 390 light 0 '[data-testid=visualizer]'`) and the page itself
   with `node scripts/.mobile.mjs 'http://localhost:<port>/' <scratch-dir> /<module>/<slug>` (it reports any element that
   overflows the viewport; the result must show `"doc":390`).
5. **Things PGlite cannot run** (TimescaleDB, Citus, multi-node clusters, replication, PgBouncer): the visualizer
   simulates them faithfully, and the playground runs the closest native PostgreSQL 18 equivalent. Presets and notes must
   not pretend the extension is installed. Show the real extension SQL in production examples and pitfalls instead.
6. **Links.** Lesson strings support `[label](/<module>/<slug>)` for a link to another lesson (or `/cookbook/<id>`,
   `/reference/<table>`) and `[label](https://…)` for external pages. Use them for "going deeper" pointers and
   cross-references instead of naming the lesson in plain text. Only link to slugs that exist (`app/src/lessons/manifest.json`).
