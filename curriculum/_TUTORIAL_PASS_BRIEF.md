# Brief: apply the Neon + Crunchy Data tutorials to one module's lessons

The lessons in your module already exist, are complete, and pass all checks. They were built mostly from the official
PostgreSQL 18 docs. The user also asked for the **Neon PostgreSQL tutorial** and the **Crunchy Data developer tutorials**
to be used, and they were barely applied. Your job: apply them properly to your module, without lowering accuracy or breaking anything.

## Read
- `curriculum/_BUILD_BRIEF.md`: the original build rules, which still apply (style, the six sections, PGlite facts, verification).
- Your module's lessons in `app/src/lessons/<module>/` and your plan `curriculum/modules/<module>.md`.
- The tutorial notes, in full: `curriculum/research/T1-neon-tutorial-core.md`, `T2-neon-admin-indexes-views-triggers.md`,
  `T3-neon-functions.md`, `T4-neon-plpgsql-versions-drivers.md`, `TC-crunchy-tutorials.md`. Each has topic sections tagged
  [M#], reusable seed schemas (verified on PGlite), "Discrepancies and version notes", and "Lesson ideas". Read every
  section tagged with your module, and skim the rest for anything that fits your lessons.
- The official-docs notes (`curriculum/research/A-…O-*.md`) remain the source of truth. **If a tutorial contradicts the
  docs, the docs win.** Never copy a tutorial claim listed as wrong in a Discrepancies section, except as a labelled misconception.

## Apply (where it makes a lesson better)
1. **Playground presets**: add or replace presets with the tutorials' best worked examples and exercise flows (for example,
   Crunchy's rhythm: baseline → deliberate error → fix → re-run → catalog peek), using their verified seed schemas, extended
   if needed. Keep 4–8 presets per lesson. Keep the setup small and under about 1 s.
2. **Pitfalls**: add the tutorials' real traps, and the *common misconceptions the tutorials themselves get wrong* (from
   the Discrepancies sections), as pitfalls with a symptom, the cause, and the correct fix per the docs. You can phrase a
   pitfall as "A common claim is X. In PostgreSQL 18, Y.", but do not name or disparage the vendor.
3. **Production examples / visualizer steps / pointers**: add a tutorial teaching angle where it is clearer than the
   current one (analogies, progressions, "why didn't it use my index?" style reveals). Do not rewrite a good visualizer;
   extend it only if a tutorial adds a mechanism step that is missing.
4. **PG18 features** the tutorials demonstrate (T4: skip scan, temporal keys `WITHOUT OVERLAPS`, virtual generated columns,
   NOT NULL NOT VALID, `RETURNING old/new`, uuidv7, EXPLAIN changes): make sure each one lands in the right lesson of your module, if it belongs there.

## Record
Append a section `## Tutorial integration` to `curriculum/modules/<module>.md` with a table:
`| tutorial item (file + topic) | applied to (lesson → section) | or: skipped because … |`. Cover every item tagged with your module.

## Rules
- Write only inside `app/src/lessons/<module>/` and `curriculum/modules/<module>.md`. Do not edit shared files or other modules.
- Every preset must still run: `cd app && node scripts/check-lessons.mjs <module>` must pass, and
  `npx tsc -p tsconfig.app.json --noEmit` must show no errors in your folder. Do not run `npm run build`.
- Verify any new number or behaviour on PGlite (see `_BUILD_BRIEF.md`, "Verify with real Postgres").
- The TL;DR stays exactly two sentences. Pointers stay at 3–5 items.
- If you change a visualizer, screenshot it as `_BUILD_BRIEF.md` describes. Use dev-server port 5180 + the module
  number, and run Vite with HMR off, because other agents are editing at the same time.

Reply with: per lesson, what was added (presets, pitfalls, other); the count of tutorial items applied vs skipped; and the check-lessons summary. Nothing else.
