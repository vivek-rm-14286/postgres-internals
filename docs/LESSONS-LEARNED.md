# Lessons learned

## Frontend

- **Lazy-load per page.** Eagerly importing 57 lessons made a 2.25 MB entry bundle. A generated manifest (slug, module,
  order, title) for navigation, plus one lazy chunk per lesson, brought it to 137 kB gzipped.
- **HashRouter with Vite `base: './'`** works under any GitHub Pages sub-path without configuration.
- **Mobile blow-outs.**
  - Inline `code` with `white-space: nowrap`, and grid or flex children at the default `min-width: auto`, made pages up
    to 765 px wide on a 390 px phone.
  - Fixes: `overflow-wrap: anywhere` on code; `.grid > *, .flex > * { min-width: 0 }`; `pre { overflow-x: auto }`; an
    Expand (full-screen) frame for wide diagrams.
  - Audit every page automatically for elements wider than the viewport.
- **Programming-font ligatures** turn `->`, `>=` and `<>` into arrows. Disable them for code, plans and SVG text.
- **Keying memoised state.** A default `[]` parameter is a new array on every render. It rebuilt the database engine and
  broke 26 pages. Key on content, not identity.
- **Vite HMR** re-ran `main.tsx` ("createRoot called twice"). Reuse the root. When several agents edit at once, run a
  dev server with HMR off for screenshots.
- **JSX whitespace.** A line break after a bold element (`<b>Ecosystem</b>⏎(pgvector…`) drops the space. Add `{' '}`.
- **Semantic colour tokens** as CSS variables, redefined for dark mode, made every visualizer theme-correct. Check that
  hues stay distinct: tuple vs accent and pointer vs ok started out identical.

## Content

- **Measure, don't estimate.** Fact-checkers found most errors in numbers that had been estimated rather than run:
  buffer counts off by 1–3, recall stated more precisely than it reproduces, a 2.5× claim that was 2.3×, and padding
  that made a "move the column" tip save nothing.
- **Primary sources beat blogs and sometimes beat vendor docs pages.** The TimescaleDB `add_dimension` docs page is
  stale; the source code is right.
- **Independent verification pays.** A separate reviewer found about 100 issues the authors missed, including a preset
  that could freeze the browser.
- **Write incrementally.** Long agent runs were interrupted twice (plan mode, then a usage limit). Agents that appended
  notes as they went lost nothing.
- **Say what can't be run.** Simulations are labelled as such, and the playground shows the closest native equivalent.

## Tooling and process

- **Validate the checks themselves.** The wrong-answer test in the Cookbook checker, and naive-answer tests by authors
  and reviewers, caught exercises that accepted wrong SQL.
- **zsh does not split an unquoted `$var`** into arguments (use `${=var}`), and `echo ======` triggers filename expansion.
- **Shell hooks that rewrite commands** (`cat`, `npx`, `tail` → `rtk …`) break sandboxed PATH tests. Run such tests
  from a script file.
- **Editing user configs safely.** Use comment-preserving edits (jsonc-parser, yaml round-trip). Record the original
  text so uninstall can restore it byte for byte. Never leave backup files lying around.
