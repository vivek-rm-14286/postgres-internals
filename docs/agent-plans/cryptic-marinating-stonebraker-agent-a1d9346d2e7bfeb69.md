# Plan: finish slice N research notes (Appendixes A-E, G-O, Bibliography, Index, Legal Notice)

## State when plan mode began

Output file: `/Users/vivek-14286/postgres-internals/curriculum/research/N-appendixes-errors-limits-glossary-release-notes.md` (1388 lines).

All 58 pages in the slice (idx 1021-1044, 1115-1148) have been read. `bookindex.txt` was skimmed only, as the task allowed.

Already written to the output file:

- Coverage ledger, one row for each of the 58 pages.
- Notes by topic: error codes, date/time appendix (B.1-B.7), SQL key words, SQL conformance, XML limits, release notes (18.0 in full by area; 18.1-18.7 by theme), oid2name / vacuumlo, external projects / source repo / docs tooling, limits, color support, obsolete features, bibliography / legal notice, glossary key facts.
- Complete inventories: Table K.1 verbatim, Table A.1 (43 classes, 263 codes), acronyms (87), glossary (146 terms, verbatim), key words grouped by PostgreSQL class (844), supported and unsupported SQL:2023 feature lists.

## Remaining work (not done because plan mode forbids edits)

1. Append the `## Lesson ideas` section required by the brief:
   - Visualizer ideas: SQLSTATE class/condition decoder; DST gap and overlap timeline; date-input token classifier; limits calculator (1,600 columns vs the 8192-byte page, 18-byte TOAST pointer); XID plus epoch wraparound counter restarting at 3; process map built from the glossary's auxiliary-process list; version 18 feature timeline.
   - Playground SQL for PGlite: triggering `23505`, `23001` vs `23503`, `40P01` note, `22012`, `P0001` with PL/pgSQL condition names; `uuidv7()` / `uuidv4()`; virtual generated columns; `RETURNING old.*, new.*`; `WITHOUT OVERLAPS`; `NOT ENFORCED`; `array_sort()`, `casefold()`; `EXPLAIN ANALYZE` showing BUFFERS by default; key word quoting (`SELECT 55 AS CHECK`); DST examples; Julian date `UTC+12` example; the two diagnostic catalog queries from 18.6 and 18.7.
   - Pitfalls with the documented fix: POSIX sign convention, `SET TIMEZONE TO FOOBAR0`, `SAT` under the Australia abbreviation file, dropped columns counting toward 1,600, `recovery.conf` blocking startup, checksum mismatch in pg_upgrade (`--no-data-checksums`), `\.` in CSV COPY, VACUUM/ANALYZE `ONLY`, FTS / pg_trgm reindex after pg_upgrade on non-libc clusters, 18.7 REINDEX list, incremental backup re-base, `output_plugin_libraries`.

2. Corrections to text already in the file:
   - Ledger row 1022 says "44 classes"; the table has 43.
   - Ledger rows 1037-1042 are placeholders ("details in notes", and a guessed date with a question mark for 18.7). Replace with the real dates: 18.1 2025-11-13, 18.2 2026-02-12, 18.3 2026-02-26, 18.4 2026-05-14, 18.6 2026-08-13, 18.7 2026-11-12, each with a one-line summary.
   - Mark as editorial (not from the docs) the usage hints I attached to some SQLSTATEs (for example "statement_timeout, user cancel" on `57014`, "NOWAIT, lock_timeout" on `55P03`), the remark that PostgreSQL fires triggers in name order (T218), and the claim that certain key words are "new" in 18. These came from prior knowledge, which the brief says not to substitute for the docs.
   - Reword the final tzdata bullet in the "Minor-release fixes around version 18 features" section. It currently reads confusingly; it should simply say that 18.7 changed `EST5EDT`-style zones to fixed offsets far back, which is in tension with the unchanged B.5 text.

3. Final report to the caller: output path, pages read (58), five most lesson-worthy findings.

## Verification

- `wc -l` on the output file stays within the 600-1500 line target after the Lesson ideas section (about 60-80 more lines; currently 1388, so keep that section compact).
- Spot-check that the ledger has 58 rows and that no placeholder text remains (`details in notes`, `?`).
