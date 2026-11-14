# Plan: finish slice M research notes (Part VII internals)

## State when plan mode began
- All 56 pages of the slice (idx 949-982, 986-992, 1006-1020) have been read in full.
- Output file is written and complete EXCEPT the coverage ledger:
  `/Users/vivek-14286/postgres-internals/curriculum/research/M-index-ams-planner-stats-fdw-geqo.md`
  - "Notes by topic", "Complete inventories", "Lesson ideas" sections are all in place.
  - Under `## Coverage ledger` there is still a literal placeholder line `<<LEDGER>>`.

## Only remaining step (one edit, no other changes)
Replace the single line `<<LEDGER>>` in the output file with the table below. Nothing else needs to change.

| idx | file | one-line summary |
|---|---|---|
| 949 | source.txt | Ch.55 TOC: formatting, error reporting, style guide, misc conventions |
| 950 | source-format.txt | 4-col tabs, BSD braces, 80 cols, no `//`, pgindent, comment block rules |
| 951 | error-message-reporting.txt | ereport/elog API, every auxiliary routine (errcode, errmsg, errdetail*, errhint, errtable...), defaults |
| 952 | error-style-guide.txt | Primary/detail/hint split, quoting, grammar, tense (could not vs cannot), words to avoid |
| 953 | source-conventions.txt | C99 subset, macros vs inline, signal handler rules (SetLatch), function pointer call style |
| 954 | nls.txt | Ch.56 TOC |
| 955 | nls-translator.txt | PO/MO catalogs, fuzzy/c-format flags, make init-po / update-po, editing rules |
| 956 | nls-programmer.txt | gettext setup, nls.mk variables, message-writing and plural guidelines |
| 957 | plhandler.txt | PL call handler (language_handler), fn_oid/fn_extra, validator, inline handler, check_function_bodies |
| 958 | fdwhandler.txt | Ch.58 intro: FDW = callback set; SQL/MED C API not implemented |
| 959 | fdw-functions.txt | fdw_handler handler and validator (text[], catalog oid) |
| 960 | fdw-callbacks.txt | Every FdwRoutine callback: scan, join, upper, modify, direct modify, truncate, locking, explain, analyze, import, parallel, async, reparameterize |
| 961 | fdw-helpers.txt | GetForeignDataWrapper/Server/UserMapping/Table/ColumnOptions helpers and flags |
| 962 | fdw-planning.txt | fdw_private/fdw_exprs/fdw_recheck_quals/fdw_scan_tlist, parameterized paths, upper rels, ON CONFLICT limit |
| 963 | fdw-row-locking.txt | Early vs late locking, ROW_MARK_* choices, EPQ whole-row copy default |
| 964 | tablesample-method.txt | tsm_handler, TsmRoutine fields parameterTypes / repeatable_across_queries / repeatable_across_scans |
| 965 | tablesample-support-functions.txt | SampleScanGetSampleSize, Init/BeginSampleScan, NextSampleBlock, NextSampleTuple, EndSampleScan |
| 966 | custom-scan.txt | Custom scan provider overview: path -> plan -> execution |
| 967 | custom-scan-path.txt | set_rel_pathlist_hook / set_join_pathlist_hook, CustomPath struct, flags, path callbacks |
| 968 | custom-scan-plan.txt | CustomScan struct, copyObject constraint, CreateCustomScanState |
| 969 | custom-scan-execution.txt | CustomScanState and all exec callbacks incl. parallel DSM and Explain |
| 970 | geqo.txt | Ch.61 TOC and author (Martin Utesch) |
| 971 | geqo-intro.txt | Join ordering as exponential search; System R near-exhaustive planner limits |
| 972 | geqo-intro2.txt | GA vocabulary: population, fitness, chromosome, gene, recombination/mutation/selection |
| 973 | geqo-pg-intro.txt | TSP encoding ('4-1-3-2'), steady-state GA, edge recombination, geqo_seed determinism, future work |
| 974 | geqo-biblio.txt | Further reading list |
| 975 | tableam.txt | table_am_handler, TableAmRoutine, TID constraint, slots, WAL options |
| 976 | indexam.txt | Indexes are secondary; key -> TID mapping; indexes unaware of MVCC |
| 977 | index-api.txt | Full IndexAmRoutine struct and flag implications (amoptionalkey, nulls, amcaninclude, amsummarizing) |
| 978 | index-functions.txt | ambuild ... amtranslatecmptype: every AM function signature and contract |
| 979 | index-scanning.txt | Scan keys, lossy recheck, ordering, direction, mark/restore, amgetbitmap restrictions |
| 980 | index-locking.txt | Lock levels, three heap/index consistency rules, index pin race, ampredlocks |
| 981 | index-unique-checks.txt | MVCC uniqueness cases, UNIQUE_CHECK_NO/YES/PARTIAL/EXISTING |
| 982 | index-cost-estimation.txt | amcostestimate signature, outputs, generic cost formula |
| 986 | indextypes.txt | Ch.65 TOC |
| 987 | btree.txt | Opclass laws, 6 support functions, structure/page splits, bottom-up deletion, deduplication |
| 988 | gist.txt | Table 65.1 opclasses, 12 support methods, sorted/buffered builds, contrib examples |
| 989 | spgist.txt | Table 65.2 opclasses, config/choose/picksplit/consistent structs, limits, all-the-same tuples |
| 990 | gin.txt | Table 65.3 opclasses, extract/consistent methods, entry tree + posting list/tree, pending list, tips, limits |
| 991 | brin.txt | Block ranges, summarization, Table 65.4 opclasses, opclass params, Tables 65.5-65.8 |
| 992 | hash-index.txt | 4-byte hash only, buckets/overflow/bitmap/meta pages, splits, squeeze, limits |
| 1006 | bki.txt | Catalog headers, .dat files, genbki.pl, postgres.bki, bootstrap mode |
| 1007 | system-catalog-declarations.txt | CATALOG macro, CATALOG_VARLEN, forced nullability, bootstrap catalogs |
| 1008 | system-catalog-initial-data.txt | .dat format, OID ranges (1-9999, 10000-11999, 12000 pinned, 16384), BKI_LOOKUP, array types, recipes |
| 1009 | bki-format.txt | BKI token/command syntax |
| 1010 | bki-commands.txt | create / open / close / insert / declare index / declare toast / build indices |
| 1011 | bki-structure.txt | Required ordering of postgres.bki |
| 1012 | bki-example.txt | test_table example |
| 1013 | planner-stats-details.txt | Ch.69 intro |
| 1014 | row-estimation-examples.txt | tenk1 worked examples: histogram, MCV, non-MCV, combined, AND, join selectivity |
| 1015 | multivariate-statistics-examples.txt | dependencies / ndistinct / mcv extended statistics examples |
| 1016 | planner-stats-security.txt | pg_statistic access, LEAKPROOF rule, security-barrier views |
| 1017 | backup-manifest-format.txt | Manifest is UTF-8 JSON object for pg_verifybackup |
| 1018 | backup-manifest-toplevel.txt | Version, System-Identifier, Files, WAL-Ranges, Manifest-Checksum |
| 1019 | backup-manifest-files.txt | Path / Encoded-Path, Size, Last-Modified, Checksum-Algorithm, Checksum |
| 1020 | backup-manifest-wal-ranges.txt | Timeline, Start-LSN, End-LSN; multiple ranges on timeline switch |

## Verification after the edit
- `grep -c '<<LEDGER>>\|<<APPEND>>'` on the output file returns 0.
- Ledger has 56 data rows (34 + 7 + 15).
- Playground SQL in the file was not executed; it is flagged as such in the file.
