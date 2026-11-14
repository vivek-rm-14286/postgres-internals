# N — Part VIII Appendixes A-E and G-O, Bibliography, Index, Legal Notice

Source: PostgreSQL 18.7 documentation, pages 1021-1044 and 1115-1148 of `_order.tsv` (58 pages).
(Appendix F, Additional Supplied Modules, idx 1045-1114, belongs to another slice.)

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 1021 | appendixes.txt | Part VIII table of contents: Appendixes A-O (A error codes, B date/time, C key words, D conformance, E release notes, F contrib modules F.1-F.50, G programs, H external projects, I source repo, J docs, K limits, L acronyms, M glossary, N color, O obsolete features). |
| 1022 | errcodes-appendix.txt | SQLSTATE rules (5 chars = 2-char class + 3-char condition; `000` = class-generic), PL/pgSQL condition names, Table A.1 with all 43 classes and every code (263 codes). |
| 1023 | datetime-appendix.txt | Appendix B intro: date/time input uses an internal heuristic parser with lookup tables for months, weekdays, time zones. |
| 1024 | datetime-input-rules.txt | B.1: exact token-classification and field-decoding algorithm for date/time input strings (concatenated dates, 2-digit year pivot at 70, BC handling). |
| 1025 | datetime-invalid-input.txt | B.2: out-of-range fields error; DST-gap and DST-overlap timestamps are not rejected — "standard time preferred when in doubt" rule with New York examples. |
| 1026 | datetime-keywords.txt | B.3: tables of month names, weekday names and abbreviations, and field modifiers (AM, AT, JULIAN/JD/J, ON, PM, T). |
| 1027 | datetime-config-files.txt | B.4: time zone abbreviation sources (IANA zone first, then `timezone_abbreviations` file in `share/timezonesets/`), file syntax (`@INCLUDE`, `@OVERRIDE`, `D` flag), Default/Australia/India files. |
| 1028 | datetime-posix-timezone-specs.txt | B.5: POSIX TZ string grammar `STD offset [DST [dstoffset] [,rule]]`, sign convention reversed vs ISO-8601, `Mm.n.d` rules, default rule `M3.2.0,M11.1.0`, pitfalls. |
| 1029 | datetime-units-history.txt | B.6: proleptic Gregorian calendar used for all dates; Julian vs Gregorian leap rules; 1582/1752 reforms. |
| 1030 | datetime-julian-dates.txt | B.7: Julian Date numbering (JD 0 = 24 Nov 4714 BC Gregorian); PostgreSQL treats JD as midnight-to-midnight; `UTC+12` trick for astronomical JD. |
| 1031 | sql-keywords-appendix.txt | Appendix C: reserved vs non-reserved key word classes in PostgreSQL's parser, "requires AS" bare-label rule, Table C.1 (844 words across PostgreSQL / SQL:2023 / SQL:2016 / SQL-92). |
| 1032 | features.txt | Appendix D intro: SQL standard = ISO/IEC 9075, latest SQL:2023; parts list; PostgreSQL core covers parts 1, 2, 9, 11, 14; conforms to at least 170 of 177 mandatory Core features. |
| 1033 | features-sql-standard.txt | D.1: table of supported SQL:2023 features (identifier, Core?, description, comment). |
| 1034 | unsupported-features-sql-standard.txt | D.2: table of SQL:2023 features not implemented, with comments on partial support and suggested equivalents. |
| 1035 | xml-limits-conformance.txt | D.3: xml type follows SQL:2003-era SQL/XML; XPath 1.0 only (libxml2), no XQuery, BY REF ignored, no named parameters, no XML(SEQUENCE). |
| 1036 | release.txt | Appendix E intro: what release notes contain, § markers link to git commits, names are major developers. |
| 1037 | release-18-7.txt | 18.7 (2026-11-12): large security release (composite-type versioning, `composite_type_mismatch`), REINDEX advisories (bpchar btree dedup disabled, GIN vacuum, TOAST indexes, gist_trgm_ops), incremental-backup fixes, join-removal rewrite. |
| 1038 | release-18-6.txt | 18.6 (2026-08-13; 18.5 never released): `output_plugin_libraries` whitelist, pgcrypto cipher-failure fix, psql COPY STDIN skipping, GIN reltuples check, btree_gist/ltree reindex advisories, SSI and VM WAL-logging fixes. |
| 1039 | release-18-4.txt | 18.4 (2026-05-14): security fixes (allocation overflows, path traversal, quoting), nondeterministic-collation uniqueness fix, MERGE serialization failure in RR/SERIALIZABLE, FSM-in-recovery change (later reverted in 18.7). |
| 1040 | release-18-3.txt | 18.3 (2026-02-26): small fix release: multixid truncation replay, CVE-fix regressions, `json[b]_strip_nulls` volatility (manual `pg_proc` UPDATE), NOT NULL constraint naming collisions. |
| 1041 | release-18-2.txt | 18.2 (2026-02-12): security fixes (multibyte validation, selectivity estimators now superuser-only, pgcrypto), ltree reindex, NOTIFY/CLOG fixes, tuple-lock update-chain xmin check, `file_extend_method`. |
| 1042 | release-18-1.txt | 18.1 (2025-11-13): CREATE STATISTICS schema privilege check, libpq allocation overflow, no parallel hash right semi join, BRIN autosummarization snapshot, JIT sign-extension fix. |
| 1043 | release-18.txt | PostgreSQL 18 major release notes (2025-09-25): overview, 12 incompatibilities, all feature changes by area, acknowledgments list. |
| 1044 | release-prior.txt | Prior release notes live at https://www.postgresql.org/docs/release/ . |
| 1115 | contrib-prog.txt | Appendix G intro: additional programs shipped in `contrib`. |
| 1116 | contrib-prog-client.txt | G.1 client applications list: oid2name, vacuumlo. |
| 1117 | oid2name.txt | oid2name: maps OIDs/filenodes to database, table, tablespace names; all options and examples. |
| 1118 | vacuumlo.txt | vacuumlo: removes orphaned large objects; options and method. |
| 1119 | contrib-prog-server.txt | G.2 server applications: currently none listed. |
| 1120 | external-projects.txt | Appendix H intro: PostgreSQL is extensible; many pieces are developed outside core. |
| 1121 | external-interfaces.txt | H.1: only libpq and ECPG client interfaces are in core; other drivers are external. |
| 1122 | external-admin-tools.txt | H.2: administration tools are external (e.g. pgAdmin). |
| 1123 | external-pl.txt | H.3: core PLs are PL/pgSQL, PL/Tcl, PL/Perl, PL/Python; others external. |
| 1124 | external-extensions.txt | H.4: extensions outside core (e.g. PostGIS, Slony-I); PGXN. |
| 1125 | sourcerepo.txt | Appendix I: source is kept in Git; public mirror. |
| 1126 | git.txt | I.1: `git clone https://git.postgresql.org/git/postgresql.git`, `git fetch`. |
| 1127 | docguide.txt | Appendix J intro: documentation output formats (HTML, PDF, man pages, plain text). |
| 1128 | docguide-docbook.txt | J.1: docs are written in DocBook XML. |
| 1129 | docguide-toolsets.txt | J.2: tools needed (DocBook DTD, DocBook XSL, libxml2/xmllint, libxslt/xsltproc, FOP) and install per platform. |
| 1130 | docguide-build.txt | J.3: make targets for HTML, man, PDF, text, syntax check. |
| 1131 | docguide-build-meson.txt | J.4: meson/ninja docs targets. |
| 1132 | docguide-authoring.txt | J.5: authoring tools (Emacs nXML mode). |
| 1133 | docguide-style.txt | J.6: reference-page section layout (Name, Synopsis, Description, Options, Exit Status, Usage, Environment, Files, Diagnostics, Notes, Examples, History, Author, See Also). |
| 1134 | limits.txt | Appendix K: Table K.1 PostgreSQL limits (database size, relation size 32 TB, 1,600 columns, 1 GB field, 63-byte identifiers, etc.) plus notes. |
| 1135 | acronyms.txt | Appendix L: list of acronyms used in the docs with expansions. |
| 1136 | glossary.txt | Appendix M: full glossary of PostgreSQL and RDBMS terms. |
| 1137 | color.txt | Appendix N intro: most programs can emit colored console output. |
| 1138 | color-when.txt | N.1: `PG_COLOR` = always / auto / unset. |
| 1139 | color-which.txt | N.2: `PG_COLORS` categories (error, warning, note, locus) and default value. |
| 1140 | appendix-obsolete.txt | Appendix O intro: placeholders for functionality that was renamed or removed, so old links land somewhere useful. |
| 1141 | recovery-config.txt | O.1: recovery.conf merged into postgresql.conf in v12; `recovery.signal` / `standby.signal`. |
| 1142 | default-roles.txt | O.2: "default roles" renamed "predefined roles" in v14. |
| 1143 | pgxlogdump.txt | O.3: pg_xlogdump renamed pg_waldump (v10). |
| 1144 | app-pgresetxlog.txt | O.4: pg_resetxlog renamed pg_resetwal (v10). |
| 1145 | app-pgreceivexlog.txt | O.5: pg_receivexlog renamed pg_receivewal (v10). |
| 1146 | biblio.txt | Bibliography: SQL reference books, PostgreSQL-specific documentation, proceedings and articles. |
| 1147 | bookindex.txt | Alphabetical index of the whole manual (skimmed; navigation only, no new facts). |
| 1148 | legalnotice.txt | Copyright © 1996–2026 The PostgreSQL Global Development Group; PostgreSQL License text (BSD-style, University of California). |

## Notes by topic

### Error codes: how SQLSTATE works  [M1, M3, M5, M6]  (source: errcodes-appendix.txt)

- Every message emitted by the server carries a five-character error code following the SQL standard's "SQLSTATE" conventions. Applications should test the code, not the message text: codes are less likely to change across releases and are not affected by localization of messages.
- Some codes are defined by the SQL standard; others were invented by PostgreSQL or borrowed from other databases. By convention in the table, PostgreSQL-invented codes are those with a `P` in the third position (e.g. `40P01`, `25P02`, `57P01`) plus the non-standard classes `53`, `54`, `55`, `57`, `58`, `F0`, `P0`, `XX` (observation from the table; the page itself only says "invented or borrowed").
- First two characters = error class; last three = specific condition in the class. An application that does not recognise a specific code can still act on the class.
- For each class there is a "standard" code ending in `000`, used only for conditions in the class that have no more-specific code.
- Table A.1 lists all codes defined in 18.7; some are not actually used at present but are defined by the SQL standard.
- The "Condition Name" column is the name to use in PL/pgSQL (`EXCEPTION WHEN unique_violation THEN ...`). Condition names can be upper or lower case. PL/pgSQL does not recognise warning condition names — classes 00, 01 and 02.
- For some errors the server reports the name of the associated database object (table, table column, data type, constraint) in separate fields of the error report, so applications need not parse localized text. As of PostgreSQL 9.3, complete coverage exists only for class 23 (integrity constraint violation).
- Version 18 change (from release notes): a `RESTRICT` foreign key violation now reports `23001` (`restrict_violation`) instead of `23503` (`foreign_key_violation`).
- Version 18 change: XML error codes were adjusted to match the SQL standard more closely.
- Codes that lessons will reference most (all verbatim from Table A.1):
  - `40001` serialization_failure — retry the transaction (RR / SERIALIZABLE). [M5]
  - `40P01` deadlock_detected — retry. [M5]
  - `23505` unique_violation, `23503` foreign_key_violation, `23502` not_null_violation, `23514` check_violation, `23P01` exclusion_violation, `23001` restrict_violation. [M3]
  - `57014` query_canceled (typical triggers such as statement_timeout or a user cancel — not from docs), `57P01` admin_shutdown, `57P02` crash_shutdown, `57P03` cannot_connect_now, `57P04` database_dropped, `57P05` idle_session_timeout. [M1, M7]
  - `53300` too_many_connections, `53100` disk_full, `53200` out_of_memory, `53400` configuration_limit_exceeded. [M1]
  - `55P03` lock_not_available (typically NOWAIT or lock_timeout — not from docs), `55006` object_in_use, `55P04` unsafe_new_enum_value_usage. [M5]
  - `25P02` in_failed_sql_transaction (the "current transaction is aborted" state — not from docs), `25P01` no_active_sql_transaction, `25006` read_only_sql_transaction, `25P03` idle_in_transaction_session_timeout, `25P04` transaction_timeout, `25001` active_sql_transaction. [M5]
  - `42601` syntax_error, `42501` insufficient_privilege, `42P01` undefined_table, `42703` undefined_column, `42883` undefined_function, `42P07` duplicate_table, `42710` duplicate_object, `42702` ambiguous_column, `42804` datatype_mismatch, `42846` cannot_coerce, `42803` grouping_error, `42P20` windowing_error, `42P19` invalid_recursion, `428C9` generated_always. [M3]
  - `22012` division_by_zero, `22003` numeric_value_out_of_range, `22001` string_data_right_truncation, `22P02` invalid_text_representation, `22007` invalid_datetime_format, `22008` datetime_field_overflow, `2202E` array_subscript_error, `22004` null_value_not_allowed, `22023` invalid_parameter_value. [M2, M3]
  - `21000` cardinality_violation (example uses such as a scalar subquery returning more than one row — not from docs). [M3]
  - `08006` connection_failure, `08P01` protocol_violation, `28P01` invalid_password, `28000` invalid_authorization_specification, `3D000` invalid_catalog_name (database does not exist), `3F000` invalid_schema_name. [M1, M6]
  - `54000` program_limit_exceeded, `54001` statement_too_complex, `54011` too_many_columns, `54023` too_many_arguments. [M2]
  - `P0001` raise_exception (the default for PL/pgSQL `RAISE EXCEPTION` — not from docs), `P0002` no_data_found, `P0003` too_many_rows, `P0004` assert_failure. [M6]
  - `XX000` internal_error, `XX001` data_corrupted, `XX002` index_corrupted. [M2, M7]
  - `0A000` feature_not_supported, `44000` with_check_option_violation, `2BP01` dependent_objects_still_exist, `58P01` undefined_file, `58030` io_error, `F0001` lock_file_exists. [M1, M6]
- The full table is in "Complete inventories" below.

### Date/time input parsing algorithm  [M2]  (source: datetime-appendix.txt, datetime-input-rules.txt)

- PostgreSQL uses an internal heuristic parser for all date/time input. The string is broken into fields; each field is given a preliminary category, then interpreted and assigned a numeric value, ignored, or rejected. Internal lookup tables hold all textual fields (months, days of week, time zones).
- Decoding procedure (verbatim order):
  1. Break the input into tokens and categorise each as a string, time, time zone, or number.
     1. Numeric token containing a colon (`:`) → time string; include all subsequent digits and colons.
     2. Numeric token containing a dash (`-`), slash (`/`), or two or more dots (`.`) → date string, which might have a text month. If a date token has already been seen, it is instead interpreted as a time zone name (e.g. `America/New_York`).
     3. Numeric-only token → single field, or ISO 8601 concatenated date (`19990113`) or time (`141516`).
     4. Token starting with `+` or `-` → numeric time zone or a special field.
  2. If the token is an alphabetic string, match it:
     1. Against known time zone abbreviations (determined by the settings in B.4).
     2. If not found, against an internal table as a special string (`today`), day (`Thursday`), month (`January`), or noise word (`at`, `on`).
     3. If still not found, throw an error.
  3. When the token is a number or number field:
     1. Eight or six digits and no other date fields read yet → "concatenated date" `YYYYMMDD` or `YYMMDD` (e.g. `19990118`, `990118`).
     2. Three digits and a year already read → day of year.
     3. Four or six digits and a year already read → time (`HHMM` or `HHMMSS`).
     4. Three or more digits and no date fields yet → year (this forces yy-mm-dd ordering of the remaining date fields).
     5. Otherwise field ordering follows `DateStyle`: mm-dd-yy, dd-mm-yy, or yy-mm-dd. Error if a month or day field is out of range.
  4. If `BC` was specified, negate the year and add one for internal storage (there is no year zero in the Gregorian calendar, so numerically 1 BC becomes year zero).
  5. If `BC` was not specified and the year field was two digits long, adjust to four digits: less than 70 → add 2000, otherwise add 1900.
- Tip: Gregorian years AD 1–99 can be entered using 4 digits with leading zeros (`0099` is AD 99).

### Invalid or ambiguous timestamps (DST)  [M2]  (source: datetime-invalid-input.txt)

- A syntactically valid string with out-of-range field values normally errors (e.g. 31 February is rejected).
- Timestamps that fall into a DST transition are not rejected; the ambiguity is resolved by picking a UTC offset.
- Spring-forward gap, `TimeZone = America/New_York`: `SELECT '2018-03-11 02:30'::timestamptz;` → `2018-03-11 03:30:00-04`. There was no 2:30 AM; the input is interpreted as standard time (UTC-5), which displays as 3:30 AM EDT (UTC-4).
- Fall-back overlap: `SELECT '2018-11-04 01:30'::timestamptz;` → `2018-11-04 01:30:00-05` (standard time chosen). Force the other reading with `'2018-11-04 01:30 EDT'` → `2018-11-04 01:30:00-04`.
- Precise rule: an invalid timestamp inside a jump-forward transition gets the UTC offset that prevailed just before the transition; an ambiguous timestamp on a jump-back transition gets the UTC offset that prevailed just after the transition. In most zones this means "the standard-time interpretation is preferred when in doubt".
- The offset can always be given explicitly (numeric UTC offset or a fixed-offset abbreviation); the rule applies only when an offset must be inferred for a zone whose offset varies.

### Date/time key words  [M2]  (source: datetime-keywords.txt)

- Month names and accepted abbreviations: January (Jan), February (Feb), March (Mar), April (Apr), May, June (Jun), July (Jul), August (Aug), September (Sep, Sept), October (Oct), November (Nov), December (Dec).
- Day names: Sunday (Sun), Monday (Mon), Tuesday (Tue, Tues), Wednesday (Wed, Weds), Thursday (Thu, Thur, Thurs), Friday (Fri), Saturday (Sat).
- Field modifiers: `AM` (time is before 12:00), `AT` (ignored), `JULIAN`, `JD`, `J` (next field is Julian Date), `ON` (ignored), `PM` (time is on or after 12:00), `T` (next field is time).

### Time zone abbreviation configuration  [M2, M7]  (source: datetime-config-files.txt)

- Two sources of abbreviations for datetime input:
  1. The `TimeZone` parameter's IANA zone. If that zone has widely used abbreviations, they are recognised preferentially with the IANA meaning (e.g. with `America/New_York`, `EST` = UTC-5 and `EDT` = UTC-4). These are also used in output when `DateStyle` prefers non-numeric zone abbreviations.
  2. If not found there, the list named by the `timezone_abbreviations` parameter. Mainly for recognising abbreviations of zones other than the current one; never used in output.
  - (Version 18 incompatibility: this order is new. Before 18, `timezone_abbreviations` was checked first.)
- `timezone_abbreviations` can be changed by any user, but its possible values are names of files in `.../share/timezonesets/`, controlled by the administrator. The name must be entirely alphabetic (prevents reading files outside the directory, editor backups, etc.).
- File format: blank lines and `#` comments allowed; other lines are one of
  - `zone_abbreviation offset`
  - `zone_abbreviation offset D`
  - `zone_abbreviation time_zone_name`
  - `@INCLUDE file_name`
  - `@OVERRIDE`
- `offset` is an integer number of seconds from UTC, positive east of Greenwich (`-18000` = five hours west = North American east coast standard time). `D` marks the abbreviation as daylight-savings time.
- With a `time_zone_name` (an IANA zone), the zone definition is consulted for the meaning of the abbreviation that was current at the timestamp being interpreted; or the meaning in use immediately before if not current then; or the oldest meaning if it was only used later. Needed for abbreviations whose meaning changed historically. An abbreviation may also be defined in terms of a zone where it does not appear — then it is equivalent to writing the zone name.
- Tip: prefer a simple integer offset when the offset has never changed; it is much cheaper than consulting a zone definition.
- `@INCLUDE` pulls in another file from the same directory; nesting allowed to a limited depth. `@OVERRIDE` lets later entries override earlier ones (typically from included files); without it, conflicting definitions are an error.
- Shipped files: `Default` (all non-conflicting abbreviations for most of the world), `Australia` and `India` (include `Default` then add/modify). Reference-only files `Africa.txt`, `America.txt`, etc. list every abbreviation known to IANA; they cannot be used directly as `timezone_abbreviations` values because of the dot in the name.
- Note: an error while reading the set keeps the old set; if it happens at server start, startup fails.
- Caution: abbreviations in the file override non-timezone meanings built into PostgreSQL. With the `Australia` file active, `SAT` (South Australian Standard Time) is no longer recognised as Saturday.
- Caution: `share/timezonesets/` is not included in a normal database dump; back up modifications yourself.

### POSIX time zone specifications  [M2]  (source: datetime-posix-timezone-specs.txt)

- Accepted form: `STD offset [ DST [ dstoffset ] [ , rule ] ]` (written without spaces in practice). The docs call POSIX specs "inadequate to deal with the complexity of real-world time zone history".
  - `STD`: abbreviation for standard time. `offset`: standard-time offset from UTC.
  - `DST`: abbreviation for daylight-savings time; if omitted (with following fields) the zone has a fixed offset.
  - `dstoffset`: defaults to one hour less than the standard-time offset.
  - `rule`: when daylight savings is in effect.
- Abbreviation = a string of letters (`EST`) or an arbitrary string in angle brackets (`<UTC-05>`). These abbreviations are used only for output, and only in some output formats; input abbreviations come from B.4.
- Offset format `hh[:mm[:ss]]` with optional sign. **The positive sign means west of Greenwich** — the opposite of the ISO-8601 convention used elsewhere in PostgreSQL. `hh` may be one or two digits; `mm` and `ss` must be two.
- Rule format: `dstdate [ / dsttime ] , stddate [ / stdtime ]`. Date formats:
  - `n` — plain integer, day of year counted from 0 to 364 (365 in leap years).
  - `Jn` — n from 1 to 365; February 29 is not counted even when present.
  - `Mm.n.d` — month m (1–12), n-th occurrence (1–4, or 5 = last) of weekday d (0–6, 0 = Sunday). `M3.2.0` = second Sunday in March.
- Time fields use the offset format without signs; default `02:00:00`.
- If a DST abbreviation is given but the rule is omitted, the fallback is `M3.2.0,M11.1.0` (USA practice as of 2020; wrong for USA years before 2007).
- Example: `CET-1CEST,M3.5.0,M10.5.0/3` = Paris as of 2020: CET one hour east of UTC; CEST implicitly two hours east; DST begins last Sunday of March at 2 AM CET and ends last Sunday of October at 3 AM CEST.
- `EST5EDT`, `CST6CDT`, `MST7MDT`, `PST8PDT` look like POSIX specs but are treated as named zones because IANA has files with those names, so they produce valid historical USA transitions.
- Pitfall: no sanity check on the abbreviation. `SET TIMEZONE TO FOOBAR0` works and leaves the system using a peculiar abbreviation for UTC.
- Note: none of the POSIX forms can express changes in daylight-savings law, so IANA historical data is needed for correct past timestamps.

### Calendar history and Julian Dates  [M2]  (source: datetime-units-history.txt, datetime-julian-dates.txt)

- PostgreSQL counts dates exclusively in the Gregorian calendar, even for years before it was in use: the **proleptic Gregorian calendar**. It does not track the calendars actually used in various places and times.
- Julian calendar: introduced 45 BC, year = 365.25 days, error about 1 day in 128 years. Gregorian: year = 365 + 97/400 = 365.2425 days; about 3300 years per day of drift.
- Leap rules: divisible by 4 → leap; divisible by 100 → not leap; divisible by 400 → leap. 1700, 1800, 1900, 2100, 2200 are not leap years; 1600, 2000, 2400 are.
- 1582 papal bull dropped 10 days (4 Oct followed by 15 Oct) in Italy, Poland, Portugal, Spain. Great Britain and dominions changed in 1752 (2 Sep followed by 14 Sep), which is why `cal 9 1752` shows a gap.
- Julian Date (unrelated to the Julian calendar; invented by Joseph Justus Scaliger): sequential day number from JD 0 = 1 January 4713 BC Julian = 24 November 4714 BC Gregorian. Astronomers run a JD from noon UTC to noon UTC.
- PostgreSQL supports Julian Date notation for input and output and uses Julian dates in some internal calculations, but treats a JD as local midnight to local midnight.
- To get the astronomical definition, do the arithmetic in zone `UTC+12`:
  - `SELECT extract(julian from '2021-06-23 7:00:00-04'::timestamptz at time zone 'UTC+12');` → `2459388.95833333333333333333`
  - `SELECT extract(julian from '2021-06-23 8:00:00-04'::timestamptz at time zone 'UTC+12');` → `2459389.0000000000000000000000000000`
  - `SELECT extract(julian from date '2021-06-23');` → `2459389`

### SQL key words  [M3, M4]  (source: sql-keywords-appendix.txt)

- Table C.1 lists every token that is a key word in the SQL standard (SQL:2023, SQL:2016, and SQL-92 for comparison) or in PostgreSQL 18.7. Background: Section 4.1.1.
- Standard: reserved key words are the only real key words and are never allowed as identifiers. Non-reserved key words have special meaning only in particular contexts; most are names of built-in tables and functions specified by SQL.
- PostgreSQL parser classes (the PostgreSQL column of the table):
  - **non-reserved** — explicitly known to the parser but allowed as column or table names.
  - **non-reserved (cannot be function or type)** — as above, but not usable as a function or data type name. Mostly built-in functions or types with special syntax; the function or type still exists but cannot be redefined by the user.
  - **reserved** — not allowed as column or table names; only allowed as a column label.
  - **reserved (can be function or type)** — reserved, but allowed as a function or data type name.
  - **blank** — treated as an ordinary identifier (usual for functions specified by SQL).
- Even reserved key words are not completely reserved: they can be column labels, e.g. `SELECT 55 AS CHECK`.
- "requires AS": most key words can be "bare" column labels without `AS` (Section 7.3.2); a few need a leading `AS` to avoid ambiguity.
- Rule of thumb: on spurious parser errors for a command that uses a listed key word as an identifier, try quoting the identifier.
- A key word being non-reserved in PostgreSQL does not mean the related feature is unimplemented; presence of a key word does not mean a feature exists.
- Counts from the table: 56 reserved; 22 reserved + requires AS; 20 reserved (can be function or type); 3 reserved (can be function or type) + requires AS; 319 non-reserved; 11 non-reserved + requires AS; 60 non-reserved (cannot be function or type); 3 non-reserved (cannot be function or type) + requires AS; 350 standard-only words that PostgreSQL treats as ordinary identifiers. Full lists per class are in "Complete inventories".
- Key words in the table that tie to version 18 features (the "new in 18" framing is not from docs; the table does not mark versions): `VIRTUAL` (virtual generated columns), `ENFORCED` (NOT ENFORCED constraints), `PERIOD` (temporal foreign keys), `OLD` / `NEW` (RETURNING aliases; both non-reserved), `OBJECTS`.

### SQL conformance  [M3]  (source: features.txt, features-sql-standard.txt, unsupported-features-sql-standard.txt)

- Formal name of the standard: ISO/IEC 9075 "Database Language SQL". Most recent: ISO/IEC 9075:2023 (SQL:2023). Earlier: SQL:2016, SQL:2011, SQL:2008, SQL:2006, SQL:2003, SQL:1999, SQL-92. Each version replaces the previous one, so conformance claims to older versions have no official merit.
- SQL-92 had three conformance levels: Entry, Intermediate, Full. Since SQL:1999 the standard defines individual features; a large subset is "Core", which every conforming implementation must supply; the rest are optional.
- Parts: 9075-1 Framework (SQL/Framework); -2 Foundation (SQL/Foundation); -3 Call Level Interface (SQL/CLI); -4 Persistent Stored Modules (SQL/PSM); -9 Management of External Data (SQL/MED); -10 Object Language Bindings (SQL/OLB); -11 Information and Definition Schemas (SQL/Schemata); -13 Routines and Types using the Java Language (SQL/JRT); -14 XML-related specifications (SQL/XML); -15 Multi-dimensional arrays (SQL/MDA); -16 Property Graph Queries (SQL/PGQ).
- PostgreSQL core covers parts 1, 2, 9, 11, 14. Part 3 is covered by the ODBC driver and part 13 by PL/Java (conformance not verified). No implementations of parts 4, 10, 15, 16.
- "Out of 177 mandatory features required for full Core conformance, PostgreSQL conforms to at least 170." No current DBMS claims full conformance to Core SQL:2023.
- Feature codes containing a hyphen are subfeatures; if one subfeature is unsupported the main feature is listed as unsupported even if others are supported. Both lists are approximate.
- Supported-feature comments worth knowing (D.1):
  - E021-04 `CHARACTER_LENGTH`: trims trailing spaces from CHARACTER values before counting.
  - F411 Time zone specification: differences regarding literal interpretation.
  - F492 Optional table constraint enforcement: except not-null constraints.
  - T054 GREATEST and LEAST: different null handling.
  - T879 / T880 JSON in equality / grouping operations: with jsonb.
  - X038 XMLText: supported except for RETURNING. X304 XMLTable passing a context item: must be XML DOCUMENT.
- Supported features directly relevant to lessons: F111–F114 (all four isolation levels are accepted as syntax), F312/F313/F314 MERGE, T121/T122 WITH, T131/T132 recursive query, T133 enhanced cycle mark values, T491 LATERAL derived table, T611/T612 OLAP (window) operations, T613 Sampling, T614 NTILE, T615 LEAD/LAG, T617 FIRST_VALUE/LAST_VALUE, T620 WINDOW clause GROUPS option, T431–T434 grouping sets and GROUP BY DISTINCT, T174 identity columns, T271 savepoints, T261 chained transactions, F867 FETCH FIRST ... WITH TIES, F292 UNIQUE null treatment, F200 TRUNCATE, T626 ANY_VALUE, T661 non-decimal integer literals, T662 underscores in numeric literals, T811–T880 SQL/JSON family, S090–S099 arrays.
- Unsupported-feature comments worth knowing (D.2):
  - Core features listed as unsupported: S011 Distinct data types; S011-01 USER_DEFINED_TYPES view; T321 Basic SQL-invoked routines (partially supported).
  - F671 Subqueries in CHECK constraints: intentionally omitted. T218 Multiple triggers for the same event executed in the order created: intentionally omitted. (Alphabetical-by-name firing order is not stated on this page — not from docs.)
  - F721 Deferrable constraints: foreign and unique keys only. F741 Referential MATCH types: no partial match yet.
  - F841–F845 `LIKE_REGEX`, `OCCURRENCES_REGEX`, `POSITION_REGEX`, `SUBSTRING_REGEX`, `TRANSLATE_REGEX`: consider `regexp_like()`, `regexp_matches()`, `regexp_instr()`, `regexp_substr()`, `regexp_replace()`.
  - S051 Create table of type: partially supported. S091 Basic array support: partially supported. S151 Type predicate: see `pg_typeof()`.
  - T175 Generated columns: mostly supported. T176 Sequence generator support: supported except for `NEXT VALUE FOR`.
  - T200 Trigger DDL: similar but not fully compatible. T301 Functional dependencies: partially supported.
  - T495 Combined data change and retrieval: different syntax (i.e. RETURNING / data-modifying CTEs).
  - T522 Default values for IN parameters of SQL-invoked procedures: supported except DEFAULT key word in invocation.
  - T618 NTH_VALUE: function exists, but some options missing. T641 Multiple column assignment: only some syntax variants supported.
  - T881 JSON in ordering operations: with jsonb, partially supported.
  - M004 Foreign data support: partially supported. M010 / M019 Foreign-data wrapper support / interface routines in C: different API.
  - X096 XMLExists and X300 XMLTable: XPath 1.0 only. X222 XML passing BY REF: parser accepts BY REF but ignores it; passing is always BY VALUE.
  - Not implemented at all (no comment): F521 Assertions, F291 UNIQUE predicate, F301 CORRESPONDING, F866 FETCH FIRST ... PERCENT, R010/R020/R030 row pattern recognition, T180 system-versioned tables, T181 application-time period tables, T616 null treatment for LEAD/LAG, T619 nested window functions, T625 LISTAGG, T076 DECFLOAT, T021 BINARY/VARBINARY, T041–T050 BLOB/CLOB, T801/T802 JSON data type (standard's definition), T860–T864 SQL/JSON simplified accessor, T111 updatable joins/unions, T231 sensitive cursors, T326 table functions, F120–F124 GET DIAGNOSTICS (SQL-level), B200–B209 polymorphic table functions, S023+ structured types, S271+ multisets.

### XML limits and SQL/XML conformance  [M2, M6]  (source: xml-limits-conformance.txt)

- PostgreSQL's `xml` type and functions largely follow the 2003 edition of SQL/XML, with some borrowing from later editions.
  - The standard has a family of XML types (document / content, untyped / schema-typed) plus `XML(SEQUENCE)`; PostgreSQL has the single `xml` type holding "document" or "content". No equivalent of "sequence".
  - Two functions introduced in SQL:2006 (`XMLEXISTS`, `XMLTABLE`) are provided in variants that use XPath 1.0 rather than XML Query.
  - `RETURNING CONTENT` / `RETURNING SEQUENCE` are not supported; such functions implicitly return content.
- `xpath()`, `xpath_exists()`, `XMLEXISTS`, `XMLTABLE` all rely on libxml2, which provides only XPath 1.0.
- XQuery vs XPath: XQuery can construct new nodes, has iteration/sorting/grouping constructs, and local functions. XPath can only return atomic values or nodes already present in the input.
- XPath 1.0 vs 2.0+:
  - No "sequence" type; a 1.0 expression yields a node-set (zero or more nodes, no guaranteed order, no duplicates) or a single atomic value. (libxml2 does seem to return nodes in document order, but does not commit to it.)
  - Only node-sets and three atomic types: boolean, double, string.
  - No conditional operator (`if (...) then ... else ...`).
  - No ordering comparison for strings: `"cat" < "dog"` and `"cat" > "dog"` are both false (numeric comparison of two NaNs); `=` and `!=` do compare as strings.
  - Comparisons against node-sets are existentially quantified; `sale/@taxable = false()` is a comparison with the effective boolean value of the whole node-set (true only if no sale has a taxable attribute at all).
  - The root node can only be in document form — part of why an `xml` value passed as the context item must be a document.
- SQL ↔ XML value mapping: except for a few special cases PostgreSQL assumes the XPath 1.0 string form of the XML value is valid text input for the SQL type, and conversely. For interoperability, use formatting functions (Section 9.8) explicitly.
- Incidental limits: only BY VALUE passing (BY REF accepted and ignored, because `xml` stores a serialized character string with no node identity); cannot pass named parameters to queries (only one context item); no `XML(SEQUENCE)` — a well-formed DOCUMENT is the only form usable as an XPath context item.

### Release notes: how to read them  [M1]  (source: release.txt, release-prior.txt)

- Release notes list significant changes, with major features and migration issues first. They omit changes affecting few users and internal, non-user-visible changes ("the optimizer is improved in almost every release, but the improvements are usually observed by users as simply faster queries").
- The complete change list is the Git log; the pgsql-committers list records all source changes.
- The name next to each item is the major developer. § markers link to gitweb pages for the primary commits.
- Notes for older branches: https://www.postgresql.org/docs/release/

### PostgreSQL 18 release: overview and incompatibilities  [M1–M7]  (source: release-18.txt)

- Release date: **2025-09-25**.
- Headline features (overview list, verbatim in substance):
  1. An asynchronous I/O (AIO) subsystem that can improve performance of sequential scans, bitmap heap scans, vacuums, and other operations. [M1, M4, M7]
  2. pg_upgrade now retains optimizer statistics. [M4, M7]
  3. "Skip scan" lookups that allow using multicolumn B-tree indexes in more cases. [M4]
  4. `uuidv7()` for generating timestamp-ordered UUIDs. [M2]
  5. Virtual generated columns that compute their values during read operations; this is now the default for generated columns. [M2, M3]
  6. OAuth authentication support. [M6]
  7. `OLD` and `NEW` support in RETURNING clauses of INSERT, UPDATE, DELETE, MERGE. [M3]
  8. Temporal constraints (constraints over ranges) for PRIMARY KEY, UNIQUE, FOREIGN KEY. [M3]
- Migration: dump/restore with pg_dumpall, or pg_upgrade, or logical replication is required from any previous release (Section 18.6).
- Incompatibilities (all 12):
  1. **initdb now enables data checksums by default.** Disable with new option `--no-data-checksums`. pg_upgrade requires matching checksum settings in both clusters, so the option is useful when upgrading non-checksum old clusters. [M2, M7]
  2. **Time zone abbreviation handling**: the session's time zone abbreviations are now favoured before the `timezone_abbreviations` variable; previously `timezone_abbreviations` was checked first. [M2]
  3. **MD5 password authentication deprecated**; will be removed in a future major release. `CREATE ROLE` and `ALTER ROLE` emit deprecation warnings when setting MD5 passwords; disable with `md5_password_warnings = off`. [M1]
  4. **VACUUM and ANALYZE now process the inheritance children of a parent.** Previous behaviour via the new `ONLY` option. [M7]
  5. **COPY FROM no longer treats `\.` as end-of-file when reading CSV files.** psql still treats `\.` as EOF when reading CSV from STDIN. Older psql clients against v18 servers may have `\copy` problems. `\.` must now appear alone on a line. [M3]
  6. **Unlogged partitioned tables disallowed.** Previously `ALTER TABLE SET [UN]LOGGED` did nothing and creating an unlogged partitioned table did not make its children unlogged. [M7]
  7. **AFTER triggers execute as the role that was active when the trigger events were queued**; previously as the role active at trigger execution time (e.g. at COMMIT). Matters when the role changes between queue time and commit. [M6]
  8. **RESTRICT foreign key violations report SQLSTATE 23001** (`restrict_violation`) instead of 23503 (`foreign_key_violation`). [M3]
  9. Non-functional rule privileges removed from GRANT/REVOKE (non-functional since 8.2). [M6]
  10. Column `pg_backend_memory_contexts.parent` removed (superseded by `path`). [M1]
  11. `pg_backend_memory_contexts.level` and `pg_log_backend_memory_contexts()` are now one-based (were zero-based). [M1]
  12. **Full text search now uses the cluster's default collation provider** to read configuration files and dictionaries, instead of always libc. Clusters defaulting to ICU or builtin may see behaviour changes in some FTS functions and in pg_trgm; after pg_upgrade, reindexing all FTS and pg_trgm indexes is recommended. [M6]

### PostgreSQL 18: optimizer and indexes  [M4]  (source: release-18.txt)

- Automatically remove some unnecessary table self-joins; disable with `enable_self_join_elimination`.
- Convert some `IN (VALUES ...)` to `x = ANY ...` for better optimizer statistics.
- Allow transforming OR-clauses to arrays for faster index processing.
- Speed up processing of INTERSECT, EXCEPT, window aggregates, and view column aliases.
- Keys of `SELECT DISTINCT` can be internally reordered to avoid sorting; disable with `enable_distinct_reordering`.
- Ignore GROUP BY columns functionally dependent on other columns: if GROUP BY includes all columns of a unique index plus other columns of the same table, the others are redundant and dropped (already true for non-deferred primary keys).
- Some HAVING clauses on GROUPING SETS can be pushed to WHERE (earlier filtering); also fixes some GROUPING SETS queries that returned incorrect results.
- Better row estimates for `generate_series()` with numeric and timestamp values.
- Optimizer can use **Right Semi Join** plans (semi-joins find whether at least one match exists).
- Merge joins can use incremental sorts.
- More efficient planning of queries that access many partitions; partitionwise joins in more cases with less memory; better cost estimates of partition queries.
- Improved SQL-language function plan caching.
- Improved handling of disabled optimizer features (ties to EXPLAIN showing disabled nodes).
- **B-tree skip scan**: multicolumn btree indexes usable when there are no restrictions on the first or early indexed columns (or only non-equality ones) and useful restrictions on later columns.
- Non-btree unique indexes can be used as partition keys and in materialized views; the index type must still support equality.
- GIN indexes can be created in parallel.
- Values can be sorted to speed range-type GiST and btree index builds.

### PostgreSQL 18: general performance, AIO, vacuum  [M1, M4, M7]  (source: release-18.txt)

- **Asynchronous I/O subsystem**: backends can queue multiple read requests, giving more efficient sequential scans, bitmap heap scans, vacuums, etc. Enabled by server variable `io_method`; `io_combine_limit` and `io_max_combine_limit` control it. Also enables `effective_io_concurrency` and `maintenance_io_concurrency` values greater than zero on systems without `fadvise()` support. New system view `pg_aios` shows the file handles being used for asynchronous I/O.
- Better locking performance for queries that access many relations.
- Better performance and lower memory use of hash joins and GROUP BY; also hash set operations used by EXCEPT and hash lookups of subplan values.
- **Normal vacuums can freeze some pages even though they are all-visible** ("eager freezing"), reducing the cost of later full-relation freezing. Aggressiveness set by server variable and per-table setting `vacuum_max_eager_freeze_failure_rate`. Previously vacuum never processed all-visible pages until freezing was required.
- New server variable `vacuum_truncate` controls file truncation during VACUUM (a storage parameter of the same name already existed).
- Defaults of `effective_io_concurrency` and `maintenance_io_concurrency` raised to **16**.

### PostgreSQL 18: monitoring  [M7, M1]  (source: release-18.txt)

- `log_connections` has finer granularity (was boolean; boolean values still accepted) and an option to report the duration of connection stages.
- `log_line_prefix` escape `%L` = local IP address on the server that the client connected to.
- `log_lock_failures` logs lock acquisition failures — specifically `SELECT ... NOWAIT` failures.
- `pg_stat_all_tables` and variants gain `total_vacuum_time`, `total_autovacuum_time`, `total_analyze_time`, `total_autoanalyze_time`.
- Delay-time reporting for VACUUM and ANALYZE: in the server log, `pg_stat_progress_vacuum`, `pg_stat_progress_analyze`, and VERBOSE output; must be enabled with `track_cost_delay_timing`.
- `ANALYZE VERBOSE` shows WAL, CPU, and average read statistics. VACUUM/ANALYZE (VERBOSE) and autovacuum log output show the full WAL buffer count.
- Per-backend I/O statistics via `pg_stat_get_backend_io()`; per-backend WAL statistics via `pg_stat_get_backend_wal()`; both cleared with `pg_stat_reset_backend_stats()`.
- `pg_stat_io`: new columns `read_bytes`, `write_bytes`, `extend_bytes`; column `op_bytes` (always equal to BLCKSZ) removed. WAL I/O activity rows added, including WAL receiver activity and a wait event for such writes.
- `track_wal_io_timing` now controls WAL timing in `pg_stat_io` instead of `pg_stat_wal`.
- `pg_stat_wal` loses `wal_write`, `wal_sync`, `wal_write_time`, `wal_sync_time`.
- `pg_ls_summariesdir()` lists `PGDATA/pg_wal/summaries`.
- `pg_stat_checkpointer.num_done` = completed checkpoints (`num_timed` and `num_requested` count both completed and skipped). `pg_stat_checkpointer.slru_written` = SLRU buffers written; the checkpoint log message now reports shared buffers and SLRU buffers separately.
- `pg_stat_database`: `parallel_workers_to_launch`, `parallel_workers_launched`.
- Query-id computation: lists of constants are jumbled using only the first and last constants; queries using the same relation name are grouped together even when the tables are in different schemas with different column names. (Jumbling is used by pg_stat_statements.)
- `pg_backend_memory_contexts`: new columns `type` and `path`.

### PostgreSQL 18: privileges, configuration, replication  [M1, M6, M7]  (source: release-18.txt)

- `pg_get_acl()` retrieves database access control details. `has_largeobject_privilege()`. `ALTER DEFAULT PRIVILEGES` can define large-object default privileges.
- New predefined role `pg_signal_autovacuum_worker` (allows sending signals to autovacuum workers).
- **OAuth**: `oauth` method in pg_hba.conf, libpq OAuth options, server variable `oauth_validator_libraries` to load token validation libraries, configure flag `--with-libcurl`.
- `ssl_tls13_ciphers`: multiple colon-separated TLSv1.3 cipher suites. `ssl_ecdh_curve` renamed `ssl_groups` (old name still works), multiple colon-separated ECDH curves allowed, default now includes X25519.
- **Cancel request keys are now 256 bits**, only when server and client both support **wire protocol version 3.2**, introduced in this release.
- `autovacuum_worker_slots`: maximum number of background worker slots for autovacuum; with it set, `autovacuum_max_workers` can be changed at runtime up to this maximum without a restart.
- `autovacuum_vacuum_max_threshold`: a fixed number of dead tuples that triggers an autovacuum (percentages are still used as well).
- `max_files_per_process` now limits only files opened by a backend (postmaster-opened files no longer count).
- `num_os_semaphores` reports the required number of semaphores.
- `extension_control_path` specifies where extension control files are found.
- `idle_replication_slot_timeout`: inactive replication slots are automatically invalidated.
- `max_active_replication_origins`: maximum active replication origins (previously governed by `max_replication_slots`).
- Logical replication:
  - Generated column values can be replicated. With a publication column list, all listed columns (generated or not) are published; without one, publication option `publish_generated_columns` decides. Useful for non-PostgreSQL subscribers.
  - Default `CREATE SUBSCRIPTION` `streaming` option changed from `off` to `parallel`.
  - `ALTER SUBSCRIPTION` can change the slot's two-phase commit behaviour.
  - Conflicts during apply are logged and counted in new columns of `pg_stat_subscription_stats`.

### PostgreSQL 18: utility commands, constraints, COPY, EXPLAIN  [M2, M3, M4]  (source: release-18.txt)

- **Virtual generated columns**, now the default kind: values are generated when the column is read, not written. `STORED` keeps the write-time behaviour.
- **OLD/NEW in RETURNING**: previously RETURNING gave new values for INSERT and UPDATE and old values for DELETE (MERGE: whichever applied to the action executed). Now the RETURNING list of INSERT/UPDATE/DELETE/MERGE can explicitly return old and new values through the special aliases `old` and `new`; the aliases can be renamed to avoid identifier conflicts.
- `CREATE FOREIGN TABLE ... LIKE`.
- `LIKE` works with nondeterministic collations; text position search functions work with nondeterministic collations (used to error).
- New builtin collation provider locale `PG_UNICODE_FAST`: supports case mapping but sorts in code point order, not natural-language order.
- `VACUUM` / `ANALYZE` `ONLY` option: process a partitioned table without its children. Useful because autovacuum does not process partitioned tables, only their children.
- Functions to modify optimizer statistics: `pg_restore_relation_stats()`, `pg_restore_attribute_stats()`, `pg_clear_relation_stats()`, `pg_clear_attribute_stats()`.
- `file_copy_method` controls whether `CREATE DATABASE ... STRATEGY=FILE_COPY` and `ALTER DATABASE ... SET TABLESPACE` use file copy or clone.
- Constraints:
  - **Temporal constraints**: `WITHOUT OVERLAPS` for PRIMARY KEY and UNIQUE, `PERIOD` for foreign keys; all applied to the last specified column.
  - CHECK and foreign key constraints can be `NOT ENFORCED`; new column `pg_constraint.conenforced`.
  - Primary/foreign key relationships must use either deterministic collations or the same nondeterministic collations. A pg_dump restore (and so pg_upgrade) fails if this is not met; fix the schema first.
  - **NOT NULL specifications are now stored in `pg_constraint`**, so NOT NULL constraints can be named. Also adds NOT NULL constraints on foreign tables and NOT NULL inheritance control for local tables.
  - `ALTER TABLE` can set `NOT VALID` on NOT NULL constraints. Inheritability can be changed: `ALTER TABLE ... ALTER CONSTRAINT ... [NO] INHERIT`.
  - `NOT VALID` foreign keys allowed on partitioned tables. Dropping constraints `ONLY` on partitioned tables allowed (was erroneously prohibited).
- COPY:
  - `REJECT_LIMIT` bounds the number of invalid rows `COPY FROM` may skip (with `ON_ERROR = 'ignore'`).
  - `COPY TO` can copy rows from populated materialized views.
  - `LOG_VERBOSITY` level `silent` suppresses log output for ignored rows.
  - `COPY FREEZE` on foreign tables is disallowed (FREEZE was silently ignored before).
- EXPLAIN:
  - **`EXPLAIN ANALYZE` automatically includes BUFFERS output.**
  - `EXPLAIN (WAL)` shows the full WAL buffer count.
  - `EXPLAIN ANALYZE` reports the number of index lookups per index scan node.
  - Fractional row counts in EXPLAIN output.
  - Memory and disk usage details for Material, Window Aggregate, and CTE nodes.
  - Window function argument details.
  - Parallel Bitmap Heap Scan worker cache statistics.
  - Disabled nodes are indicated in EXPLAIN ANALYZE output.

### PostgreSQL 18: data types and functions  [M2, M3]  (source: release-18.txt)

- Unicode full case mapping and conversion improved: conditional and title case mapping, and single characters that map to multiple characters. Unicode data updated to 16.0.0.
- jsonb `null` values cast to scalar types now yield SQL NULL (used to error).
- `json_strip_nulls` / `jsonb_strip_nulls` take an optional parameter to also remove null array elements.
- `array_sort()` sorts an array's first dimension; `array_reverse()` reverses an array's first dimension.
- `reverse()` for bytea. Casts between integer types and bytea (integers stored as two's complement).
- Full text search stemming for Estonian.
- `casefold()` for more sophisticated case-insensitive matching (handles characters with multiple case equivalents, or whose case conversion changes the number of characters).
- `MIN()` / `MAX()` on arrays and composite types.
- `EXTRACT(WEEK ...)` option added; `EXTRACT(QUARTER ...)` output improved for negative values.
- `to_number()` supports roman numerals via the `RN` pattern.
- **`uuidv7()`** generates temporally sortable UUID version 7 values; alias **`uuidv4()`** explicitly generates version 4.
- `crc32()` and `crc32c()`. `gamma()` and `lgamma()`.
- PL/pgSQL accepts `=>` for named cursor arguments (previously only `:=`).
- `regexp_match[es]()`, `regexp_like()`, `regexp_replace()`, `regexp_count()`, `regexp_instr()`, `regexp_substr()`, `regexp_split_to_table()`, `regexp_split_to_array()` accept named arguments.

### PostgreSQL 18: libpq, psql, server applications  [M6, M7]  (source: release-18.txt)

- libpq: `PQfullProtocolVersion()` reports the full protocol version including minor; connection parameters and environment variables for minimum and maximum acceptable protocol version; `search_path` changes are reported to the client; `PQtrace()` covers all message types including authentication; `sslkeylogfile` connection parameter dumps SSL key material (debugging); some function signatures use `int64_t` (`pg_int64` deprecated).
- psql:
  - `\parse`, `\bind_named`, `\close_prepared` for named prepared statements.
  - Pipeline commands: `\startpipeline`, `\syncpipeline`, `\sendpipeline`, `\endpipeline`, `\flushrequest`, `\flush`, `\getresults`. Prompt escape `%P`; variables `PIPELINE_SYNC_COUNT`, `PIPELINE_COMMAND_COUNT`, `PIPELINE_RESULT_COUNT`.
  - Connection service name available in the prompt or as a variable.
  - Suffix `x` on list commands enables expanded mode.
  - `\conninfo` is tabular with more information.
  - Leakproof indicator in `\df+`, `\do+`, `\dAo+`, `\dC+`. Access method for partitioned relations in `\dP+`. `default_version` in `\dx`.
  - Variable `WATCH_INTERVAL` sets the default `\watch` wait time.
- initdb: checksums on by default (`--no-data-checksums` to disable); `--no-sync-data-files` skips syncing heap/index files (`--no-sync` still skips everything).
- vacuumdb `--missing-stats-only`: compute only missing optimizer statistics; superuser only; only with `--analyze-only` or `--analyze-in-stages`.
- pg_combinebackup `-k` / `--link` (hard links; only some files can be linked; not for backups that will be used independently).
- pg_verifybackup can verify tar-format backups.
- pg_rewind: a database name in `--source-server` is used in `--write-recovery-conf` output.
- pg_resetwal `--char-signedness`.
- pg_dump `--statistics`; pg_dump and pg_dumpall `--sequence-data`; pg_dump, pg_dumpall, pg_restore `--statistics-only`, `--no-statistics`, `--no-data`, `--no-schema`, `--no-policies`.
- **pg_upgrade preserves optimizer statistics** (extended statistics are not preserved); `--no-statistics` disables this. Database checks run in parallel under `--jobs`. New `--swap` mode swaps directories instead of copy, clone, or link ("potentially the fastest"). `--set-char-signedness` for pre-18 clusters whose default CPU char signedness differs from the new cluster.
- pg_createsubscriber `--all`, `--clean` (remove publications), `--enable-two-phase`. pg_recvlogical `--enable-failover`, `--enable-two-phase` (synonym for `--two-phase`, now deprecated); `--drop-slot` works without `--dbname`.

### PostgreSQL 18: source code and catalogs  [M1, M2, M4, M6]  (source: release-18.txt)

- Injection points: loading separated from running (`INJECTION_POINT_LOAD()`, `INJECTION_POINT_CACHED()`), runtime arguments, `IS_INJECTION_POINT_ATTACHED()`.
- SIMD for long JSON strings; CRC32C with x86 AVX-512; ARM Neon and SVE intrinsics for popcount; faster numeric multiplication and division.
- `--with-libnuma` for NUMA awareness: `pg_numa_available()`, views `pg_shmem_allocations_numa` and `pg_buffercache_numa`.
- `pg_index` gets a TOAST table (very large expression indexes).
- Column `pg_attribute.attcacheoff` removed. Column `pg_class.relallfrozen` added.
- Index AM API additions: `amgettreeheight`, `amconsistentequality`, `amconsistentordering`. GiST support function `stratnum()`.
- pg_controldata records the default char signedness.
- PL/Python uses the Python "Limited API"; minimum Python 3.6.8. OpenSSL older than 1.1.1 unsupported. LLVM 14 or later required when enabled.
- `PG_MODULE_MAGIC_EXT` lets extensions report name and version; read with `pg_get_loaded_modules()`.
- `SPI_connect()` / `SPI_connect_ext()` documented as always returning `SPI_OK_CONNECT`; errors go through `ereport()`.
- New documentation section on API and ABI compatibility.
- Meson builds on Windows no longer experimental. `--disable-spinlocks` and `--disable-atomics` removed (32-bit atomic operations required). HPPA/PA-RISC support removed.

### PostgreSQL 18: additional modules  [M6]  (source: release-18.txt)

- New extensions: `pg_logicalinspect` (inspect logical snapshots), `pg_overexplain` (debug details in EXPLAIN output).
- postgres_fdw: `postgres_fdw_get_connections()` gains `used_in_xact`, `closed`, `user_name`, `remote_backend_pid`; SCRAM pass-through via `use_scram_passthrough` (libpq parameters `scram_client_key`, `scram_server_key`). dblink also supports SCRAM pass-through.
- file_fdw: `on_error`, `log_verbosity`, `reject_limit` options.
- passwordcheck: `min_password_length`.
- pgbench reports failed, retried, or skipped transactions in per-script reports.
- isn: server variable `weak` (previously only via `isn_weak()`).
- btree_gist: sorted index builds.
- amcheck: `gin_index_check()`.
- pg_buffercache: `pg_buffercache_evict_relation()`, `pg_buffercache_evict_all()`; `pg_buffercache_evict()` now returns the buffer flush status.
- Extensions can install custom EXPLAIN options and use the server's cumulative statistics API.
- pg_stat_statements: tracks the queries of `CREATE TABLE AS` and `DECLARE` (they get query ids); `SET` values are parameterized; new columns `parallel_workers_to_launch`, `parallel_workers_launched`, `wal_buffers_full`.
- pgcrypto: `sha256crypt`, `sha512crypt`; CFB mode; `fips_mode()`; server variable `builtin_crypto_enabled`.

### PostgreSQL 18 minor releases: timeline and required actions  [M7]  (source: release-18-1.txt … release-18-7.txt)

| Version | Release date | Dump/restore needed from 18.X? | Post-update actions called out |
|---|---|---|---|
| 18.0 | 2025-09-25 | (major: dump/restore, pg_upgrade, or logical replication) | see incompatibilities above |
| 18.1 | 2025-11-13 | No | none |
| 18.2 | 2026-02-12 | No | reindex indexes on `ltree` columns unless the database uses libc provider with a single-byte encoding |
| 18.3 | 2026-02-26 | No | optional manual catalog fix for `json_strip_nulls` / `jsonb_strip_nulls` volatility |
| 18.4 | 2026-05-14 | No | repair foreign keys that lost deferrability (toggle NOT ENFORCED / ENFORCED) |
| 18.5 | never released | — | "18.5 was never released, due to a regression discovered post-wrap." |
| 18.6 | 2026-08-13 | No | set `output_plugin_libraries` for non-core decoders; pgcrypto PGP data cleanup; add `\.` terminators after intentionally failing `COPY FROM STDIN` in scripts; check `reltuples` of tables with GIN indexes; reindex some btree_gist and ltree indexes |
| 18.7 | 2026-11-12 | No | REINDEX indexes named in the changelog (bpchar btree, GIN, TOAST-table indexes, `gist_trgm_ops`); take a new full backup before further incremental backups; C extensions should be rebuilt for composite-type versioning |

- Every minor release says "A dump/restore is not required for those running 18.X."
- Minor releases add fixes only; however a few new server parameters arrived in minor releases (below).

### New server parameters and options introduced in 18.x minor releases  [M1, M7]  (source: release-18-2.txt, release-18-6.txt, release-18-7.txt)

- `file_extend_method` (18.2): controls use of `posix_fallocate()` to extend relation files. Version 16 and later use `posix_fallocate()` where available; this disables BTRFS compression and produced spurious ENOSPC on XFS with older Linux kernels. Setting `file_extend_method = write_zeros` returns to the old method of extending files by writing blocks of zeroes. [M2]
- `output_plugin_libraries` (18.6, CVE-2026-6471): whitelist of logical decoding output plugins. Previously a replication user could select any loadable library. Default contains only the plugins shipped with PostgreSQL: `pgoutput` and `test_decoding`. Example: `output_plugin_libraries = 'pgoutput, test_decoding, my_trusted_decoder'`. `pg_upgrade --check` fails if the new cluster's setting does not permit the plugins of logical slots in the old cluster (when migrating from 17 or later). 18.7 added syntax validation on assignment. [M7]
- `composite_type_mismatch` (18.7, CVE-2026-6460): can disable the new versioning checks that detect composite datums not matching the tuple descriptor used to interpret them; disabling "carries security risks". Full protection requires rebuilding C-language extensions; some need source changes. [M2, M6]
- pgcrypto option `ignore-cipher-failure` (18.6) for `pgp_pub_decrypt()` and `pgp_sym_decrypt()`: e.g. `pgp_sym_decrypt(encrypted_column, key, 'ignore-cipher-failure=1')`, to strip the faulty wrapper from messages "encrypted" while OpenSSL had rejected the cipher (typically `cipher-algo` = blowfish/bf, twofish, cast5, 3des in FIPS mode or without the legacy provider). [M6]
- 18.2: superuser privilege is now required to attach a non-built-in selectivity estimator to an operator (CVE-2026-2004). [M4, M6]
- 18.4: `PQfn()` is marked unsafe / deprecated in libpq (cannot check the output buffer size for non-integral results). [M6]

### Minor-release fixes that teach internals: MVCC, locking, transactions  [M5]  (source: release-18-2.txt, release-18-4.txt, release-18-6.txt, release-18-7.txt)

- 18.2 — following an update chain when locking a tuple neglected to check the `xmin` of the first new tuple in the chain. If the original updater aborted and VACUUM reclaimed and reused the space, an unrelated tuple could be locked (unexpected delays or deadlocks). Illustrates why chain-following must verify `xmax` of the old version equals `xmin` of the next.
- 18.2 — rowmarks belonging to non-relation range-table entries (subqueries) were pruned incorrectly, giving wrong results when a row update needed EvalPlanQual rechecking after a concurrent update.
- 18.2 — CLOG needed by unread NOTIFY messages is no longer truncated (fixes "could not access status of transaction"). Errors while absorbing a NOTIFY message are now escalated to FATAL (connection closed), so the application gets a clear signal that notifications may have been missed.
- 18.2 — multixact fixes: guard against incorrect truncation of the multixact log after a crash; the next multixid's offset is set when a new multixid is created, removing a wait loop that could hang.
- 18.3 — replaying a multixid truncation WAL record generated by an older minor version failed with "could not access status of transaction" (typical case: newer standby consuming WAL from older primary).
- 18.4 — MERGE now correctly reports a serialization failure when it meets a concurrently updated tuple in REPEATABLE READ or SERIALIZABLE (previously behaved as in lower levels).
- 18.4 — indexing of oldest-multixact arrays in shared memory was wrong: a prepared-but-uncommitted transaction's row locks could appear invisible to other sessions.
- 18.6 — race condition in SERIALIZABLE conflict detection: a conflict could be missed when examining an initially-empty btree index.
- 18.6 — dangling object dependencies are now prevented by taking a shared lock on any object being depended on. Example: one session drops a schema that looks empty while another creates a function in it — previously both could commit; now one fails.
- 18.6 — `UPDATE ... RETURNING OLD` on a table with a BEFORE UPDATE trigger returned stale OLD values after a concurrent update at READ COMMITTED; parenthesized `(old).colname` and `(old).*` in RETURNING were mis-parsed as NEW references.
- 18.6 — access to other sessions' temporary tables is now prevented in all code paths.
- 18.7 — `INSERT ... ON CONFLICT` now acquires a predicate lock on conflicting rows (serializable mode previously allowed concurrent updates that should have failed with a serialization error).
- 18.7 — `INSERT ... ON CONFLICT DO UPDATE` on a view could update rows hidden by the view's WHERE clause; now an error is thrown (CVE-2026-16237). ON CONFLICT target rows are checked against RLS policies before user quals are applied.
- 18.7 — snapshot export/import on a snapshot taken during recovery was wrong (data layout differs); triggered by parallel pg_dump on a standby and could set hint bits incorrectly, corrupting data.
- 18.7 — tuples updated by later-aborted subtransactions could be discarded by a table rewrite (CLUSTER, VACUUM FULL).
- 18.7 — checkpoints are no longer started in the middle of aborting a prepared transaction or in the middle of creating a multixact; prepared-transaction state files are written atomically during a checkpoint.
- 18.7 — `pg_blocking_pids()` accounts correctly for relation extension locks; possibly-stale `pg_locks.waitstart` fixed.
- 18.7 — MERGE `WHEN NOT MATCHED BY SOURCE` with a concurrently deleted target tuple no longer wrongly runs a `WHEN NOT MATCHED BY TARGET` action.
- 18.7 — backend hang at exit during temp-table cleanup when the default transaction mode is `SERIALIZABLE READ ONLY DEFERRABLE`.

### Minor-release fixes that teach internals: indexes  [M4]  (source: release-18-1.txt … release-18-7.txt)

- 18.7 — **B-tree deduplication disabled for `bpchar`** (unconstrained-length `bpchar` only). Its equality ignores trailing spaces, so values of different lengths compare equal and are not bitwise equal; deduplication then let index-only scans return subtly wrong results. `CHAR(n)` is not at risk because the length constraint forces equal strings to be bitwise equal. REINDEX btree indexes on `bpchar` columns.
- 18.7 — VACUUM could miss dead tuples in a GIN index when one VACUUM needs multiple index scans (more dead tuples than fit in memory) or races with leaf page splits; eventually index entries point at unrelated rows. GIN posting-tree page deletion after an incomplete split could disconnect siblings. REINDEX if suspected.
- 18.7 — mutable `pg_index` fields for TOAST-table indexes were not refreshed after REINDEX CONCURRENTLY, giving "missing chunk number" errors; only the index is corrupt, REINDEX recovers.
- 18.7 — a hash index scan starting during a bucket split could miss entries. Parallel GIN build stored keys in a structure with a 16-bit size field, truncating keys larger than 65535 bytes.
- 18.7 — WAL logging of multi-level btree page deletion could contain stale sibling links (visible with `wal_consistency_checking`).
- 18.7 — pg_trgm GiST: combining index entries could lose the format flag; REINDEX `gist_trgm_ops` indexes.
- 18.7 — SP-GiST quad-tree roundoff errors (`<@` searches could skip a quadrant; "getQuadrant: impossible case").
- 18.7 — GIN `jsonb_ops` scan for `strict $ == "scalar"` jsonpath missed plain scalar strings; AND under NOT and methods on literals (`"42".double()`) were mis-extracted.
- 18.6 — parallel GIN index builds could store garbage (even Infinity or NaN) in `pg_class.reltuples`, after which autovacuum/autoanalyze may never process the table. Not self-healing; run ANALYZE or create another index. Check query:
  ```sql
  SELECT DISTINCT t.oid::regclass, t.reltuples
  FROM pg_class t
    JOIN pg_index i ON t.oid = i.indrelid
    JOIN pg_class ic ON i.indexrelid = ic.oid
  WHERE t.relhasindex AND ic.relam = 2742;
  ```
  (2742 is the GIN access method OID as used by the release note.)
- 18.6 — GiST and SP-GiST index-only scans could mis-decode index tuples (only core case: GiST `range_ops` when the range column is not the first index column).
- 18.6 — REINDEX CONCURRENTLY with a deferred uniqueness constraint: the transient index was marked as enforcing immediate uniqueness.
- 18.6 — btree_gist: NaN mishandled in float4/float8 opclasses; bit/varbit sorted as bytea during build; not-equal searches on variable-length types wrong. Reindex recommended for float columns that may hold NaN and for bit columns.
- 18.6 — ltree values with more than about 14,653 labels compared wrongly (overflow); reindex btree indexes holding such values.
- 18.2 — hash indexes require a WHERE clause on the leading key, so the planner no longer drops a clause implied by a partial hash index's predicate.
- 18.2 — parallel GIN builds must use the GIN opclass's ordering function, not the type's default btree ordering operator.
- 18.2 — unlogged BRIN indexes must not emit WAL. 18.1 — BRIN autosummarization needs a snapshot for index expressions, otherwise placeholder tuples are left behind and the index bloats; integer overflow in BRIN scans near 2^32 pages.
- 18.2 — amcheck: "half-dead" btree pages have no parent downlink; incomplete root page splits are legal states.

### Minor-release fixes that teach internals: planner and executor  [M4]  (source: release-18-1.txt … release-18-7.txt)

- 18.4 — a unique index does not prove "at most one row matches `x = 'abc'`" when the index and the clause use different collations and either is nondeterministic. Safe when both are deterministic, because that requires equality to mean bitwise equality.
- 18.7 — join removal re-implemented to edit the parse tree and regenerate derived planner data (an unusually large back-patch).
- 18.7 — self-join elimination is not performed with inheritance trees (a unique index on the parent does not prove uniqueness across children), and clauses used to prove uniqueness must actually match (same operator and collation).
- 18.7 — `DISTINCT ON` does not guarantee unique subquery output when the target list has set-returning functions (they may run after de-duplication).
- 18.7 — Memoize must use the correct input collation; wrong results when a Param is a subexpression of a cache key.
- 18.7 — index-based MIN/MAX plan is not used for an aggregate whose input and output types differ (`SORTOP`).
- 18.7 — range-partition pruning bugs with pruning quals on only a leading prefix of the key and with DEFAULT partitions using MINVALUE/MAXVALUE bounds (18.6 also fixed a DEFAULT-partition pruning error).
- 18.7 — datum-sort memory accounting for pass-by-reference types was wrong, so `work_mem` limits might not be enforced and EXPLAIN ANALYZE could mislead.
- 18.6 — hash joins must not insert null-keyed tuples into the hash table (they never match); the code got it wrong when the null was in a non-last join column.
- 18.6 — `value IN (array)` nullability/strictness reasoning is valid only when the array is known non-empty.
- 18.6 — WHERE clauses must not be pushed below a grouping step that groups by a nondeterministic collation unless the comparison uses the same collation.
- 18.6 — COUNT window functions with EXCLUDE or without ORDER BY are not monotonic.
- 18.6 — hashability of container types (arrays, composites, ranges) depends on component types ("could not identify a hash function").
- 18.2 — version 18 uses PlaceHolderVars in more cases; the planner now looks through them when searching for statistics and when matching expressions to indexes.
- 18.2 — outer-query restrictions must not be pushed into a subquery whose grouping clause contains a volatile or set-returning function.
- 18.1 — parallelism is not used in hash right semi joins (race in updating the shared hash table).
- 18.1 — JIT tuple deforming used zero-extension where non-JIT code sign-extends small integers, giving "could not find memoization table entry" with Memoize. 18.4 made datum-image comparisons insensitive to sign-extension variations.
- 18.1 — hash join hash-table sizing logic repaired (used more memory than intended).

### Minor-release fixes that teach internals: storage, WAL, vacuum, backup, replication  [M2, M7]  (source: release-18-1.txt … release-18-7.txt)

- 18.2 — recovery now fails with a clear error if WAL does not exist back to the redo point indicated by the checkpoint record (previously could crash or corrupt).
- 18.2 — async I/O race: the result code of an AIO operation could be overwritten before it was fetched. 18.7 — io_uring resources leaked across crash restarts (only with `io_method=io_uring`, "which is not the default"). 18.4 — `pg_aios.pid` shows NULL, not 0, when an entry has no owning process.
- 18.2 — incremental backup of a table larger than 1 GB (the segment size) truncated by VACUUM between base and incremental backup made pg_combinebackup fail.
- 18.4 — free space map changes during recovery were not persisted when checksums are enabled (map page not marked dirty), so a promoted standby had a badly wrong FSM; **18.7 reverted those FSM persistence changes** ("turned out to cause more trouble than they fixed").
- 18.4 — restoring an incremental backup could append many zero blocks to a visibility map.
- 18.4 — non-WAL-logged GiST indexes use a "fake LSN"; wrong selection produced "xlog flush request ... is not satisfied".
- 18.6 — WAL logging of operations that clear visibility-map bits was incomplete: missed by the WAL summarizer (incorrect incremental backups) and missing full-page images of VM pages (torn pages could go uncorrected, giving wrong index-only scan results).
- 18.6 — autovacuum processed databases from lowest to highest score instead of the reverse.
- 18.6 — VACUUM's wraparound failsafe mode is supposed to abandon the limit on shared buffers used by an ordinary VACUUM; this was broken in v18 refactoring and restored.
- 18.6 — the last block of a bulk-extended table was not added to the FSM promptly (off-by-one).
- 18.6 — "no empty local buffer available" with temp tables: a large `effective_io_concurrency` let one read stream use all local buffers; now limited.
- 18.6 — unlogged sequences were corrupted after standby promotion; hot-standby connections must not be accepted before WAL replay reaches a consistent state.
- 18.6 — logical decoding of empty prepared transactions sent COMMIT/ROLLBACK PREPARED with no preceding PREPARE.
- 18.7 — incremental backups: stale visibility-map bits after heap truncation when both data checksums and `wal_log_hints` are disabled; backups from a divergent timeline history are rejected; WAL summaries are merged in LSN order. Take a new full backup.
- 18.7 — base backups: avoid reading a torn `pg_control`; files replaced by atomic rename (such as `postgresql.auto.conf`) could be truncated or zero-padded; single-page checksum failures are now counted in `pg_stat_database`.
- 18.7 — vacuum delay sleeps are skipped while holding locks; parallel vacuum I/O timing now reported.
- 18.7 — recovery replay of freeze-only and VM-only WAL records no longer takes unnecessary buffer locks (fewer replay delays and standby query cancellations).
- 18.7 — logical replication: lossy identity indexes (GiST on multiranges) need a recheck; `REPLICA IDENTITY FULL` lookups must not use invalid indexes left by a failed CREATE INDEX CONCURRENTLY; system catalogs rejected as replication targets; `REPLICA IDENTITY USING INDEX` rejected when a key column has an unvalidated NOT NULL constraint.
- 18.7 — unlogged tables have no data on a standby; reads fail with a proper error.
- 18.2 — `CREATE SUBSCRIPTION ... CONNECTION` `options` are passed to the publisher's walsender again (broken since version 15).
- 18.1 — `pg_stat_replication` `write_lag` / `flush_lag` stopped updating when a standby's replay LSN stalled; a failed slot-state write left `state.tmp` behind and blocked later writes.

### Minor-release fixes around version 18 features  [M2, M3]  (source: release-18-1.txt … release-18-7.txt)

- Virtual generated columns: generated columns disallowed in partition keys (18.1) and in `COPY ... FROM ... WHERE` (18.1; generated columns are not yet computed when WHERE filtering runs); `WHERE CURRENT OF` and `EXCLUDED` references fixed (18.4); JIT tuple deconstruction accounts for virtual generated columns (18.6); spurious "indexes on virtual generated columns are not supported" errors fixed (18.4) — confirming that indexes on virtual generated columns are not supported.
- NOT NULL constraints as `pg_constraint` rows: automatic names must avoid collisions with user constraints in the same CREATE TABLE (18.3); adding a named not-null constraint to an already NOT NULL column requires the name to match (18.2); NOT NULL constraints on partitioned tables must be inherited — `NO INHERIT` is rejected (18.6, 18.7). Finder query for broken ones (18.7):
  ```sql
  SELECT conrelid::regclass, conname
  FROM pg_constraint
  WHERE contype = 'n' AND connoinherit
        AND conrelid IN (SELECT oid FROM pg_class WHERE relkind = 'p');
  ```
  Repair with `ALTER TABLE ... DROP CONSTRAINT ...` or `ALTER TABLE ... ALTER CONSTRAINT ... INHERIT`.
- `WITHOUT OVERLAPS` now allows a domain over a range or multirange type (18.4).
- NOT ENFORCED: a `DEFERRABLE INITIALLY DEFERRED` foreign key behaved as NOT DEFERRABLE after NOT ENFORCED → ENFORCED (18.4).
- `uuidv7()` rejects out-of-range timestamp shift values (18.6; previously garbage UUIDs).
- `json_strip_nulls()` / `jsonb_strip_nulls()` were accidentally marked stable instead of immutable in 18.0–18.2 (blocks use in index expressions). Fixed for new clusters in 18.3; for existing clusters, as superuser in each database including template0 and template1: `UPDATE pg_catalog.pg_proc SET provolatile = 'i' WHERE oid IN ('3261','3262');`
- Statistics import functions (`pg_restore_relation_stats()` etc.) check privileges before locking (18.1), validate MCV input (18.4), handle multiranges and domains (18.6, 18.7).
- Nondeterministic collations: substring search missed a match at the very end of the string (18.2); LIKE with backslashes (18.6); `pg_unicode_fast` Greek final sigma rule (18.6).
- Lower-casing can produce more characters than the input in some locales — new in version 18 — which caused buffer overruns in pg_trgm (18.2, CVE-2026-2007) and length bugs in ltree, to_date(), synonym dictionaries.
- Query IDs now consider grouping expressions (18.2).
- psql (18.6, CVE-2026-6464): recognises `COPY ... FROM STDIN` itself and skips in-line data even if the server rejects the COPY; test scripts with intentionally failing COPY need a `\.` terminator line.
- Limits surfaced by fixes: `ts_headline()` `StartSel`, `StopSel`, `FragmentDelimiter` must not exceed 32 kB (18.4); maximum tsvector lexeme length is `MAXSTRLEN` (2047) (18.7); aggregate functions accept at most `FUNC_MAX_ARGS - 1` arguments (18.6); `lquery` values limited to 64K items (18.4); libpq now accepts ParameterDescription messages above 30000 bytes (prepared queries with more than 7498 parameters) (18.6); `XMLSERIALIZE(... INDENT)` output above 1 GB (18.7).
- Security-fix themes worth a sidebar: integer overflow in allocation sizes; missing privilege checks (CREATE on schema for CREATE STATISTICS and multirange types; USAGE on types; EXECUTE on cast functions); SQL injection through unquoted names in tools (pg_createsubscriber, reindexdb, vacuumdb, pg_dump); timing-safe comparisons in authentication (`timingsafe_bcmp()`); mock SCRAM secrets now use `scram_iterations`; cached plans invalidated after role changes (RLS).
- Time zone data: tzdata 2025c (18.2), 2026b (18.4), 2026c (18.6), 2026f (18.7). In 18.7 the backward-compatibility zones `EST5EDT`, `CST6CDT`, `MST7MDT`, `PST8PDT` changed to use the indicated UTC offsets and abbreviations indefinitely far back (conforming better to POSIX), so they no longer show city-zone historical behaviour. This is in tension with Appendix B.5, whose unchanged text still says these names "produce valid historical USA daylight-savings transitions"; lessons should follow the 18.7 note.

### Additional supplied programs: oid2name, vacuumlo  [M2, M6]  (source: contrib-prog.txt, contrib-prog-client.txt, oid2name.txt, vacuumlo.txt, contrib-prog-server.txt)

- Appendix G covers utility programs in `contrib`; once installed they live in the installation's `bin` directory. G.2 (server applications): "Currently, no such applications are included in the contrib directory."
- **oid2name** — "resolve OIDs and file nodes in a PostgreSQL data directory". Helps examine the file structure (Chapter 66). The name is historical and "rather misleading": most of the time you care about tables' **filenode numbers** (the file names visible in the database directories), not OIDs. "Be sure you understand the difference between table OIDs and table filenodes!"
  - Options: `-f filenode` / `--filenode` (show table with that filenode); `-i` / `--indexes` (include indexes and sequences); `-o oid` / `--oid`; `-q` / `--quiet` (omit headers); `-s` / `--tablespaces` (show tablespace OIDs); `-S` / `--system-objects` (include objects in `information_schema`, `pg_toast`, `pg_catalog`); `-t tablename_pattern` / `--table` (a LIKE pattern, e.g. `foo%`); `-V`; `-x` / `--extended` (tablespace name, schema name, OID); `-?`.
  - Connection options: `-d database`, `-h host`, `-H host` (deprecated as of PostgreSQL 12), `-p port`, `-U username`. Environment: `PGHOST`, `PGPORT`, `PGUSER`, libpq variables, `PG_COLOR`.
  - Behaviour: `-o`, `-f`, `-t` can be combined freely; the listing includes objects matched by any of them, only within the `-d` database. With `-d` only: all tables in the database (`-S`, `-i` widen it). Without `-d`: database OIDs. `-s`: tablespace listing.
  - Requires a running server with non-corrupt system catalogs, so of limited use after catastrophic corruption.
  - Facts visible in the examples: database files live in `$PGDATA/base/<database OID>/<filenode>`; `template1` has OID 1; tablespaces `pg_default` = OID 1663 and `pg_global` = OID 1664; user tablespaces appear as `$PGDATA/pg_tblspc/<tablespace OID>/<database OID>/<filenode>` with a `PG_VERSION` file in the tablespace directory; catalog filenodes such as 1255 and 1249 appear in the size listing; a freshly created table can have filenode equal to its OID (`accounts` 155173 / 155173).
- **vacuumlo** — "remove orphaned large objects from a PostgreSQL database". An orphaned large object is any LO whose OID does not appear in any `oid` or `lo` data column of the database. Synopsis: `vacuumlo [option...] dbname...`; all named databases are processed.
  - `-l limit` / `--limit`: remove no more than `limit` LOs per transaction, default **1000**. The server acquires a lock per LO removed, so too many in one transaction risks exceeding `max_locks_per_transaction`. `0` = all removals in a single transaction.
  - `-n` / `--dry-run`, `-v` / `--verbose`, `-V`, `-?`, `-h`, `-p`, `-U`, `-w` / `--no-password`, `-W` / `--password`.
  - Method: (1) build a temporary table with the OIDs of all large objects in the database; (2) scan all columns of type `oid` or `lo` and remove matching entries from the temporary table (only types with these names; domains over them are not considered); (3) the remaining entries are orphans and are removed.
  - Related: the `lo_manage` trigger in the `lo` module helps avoid creating orphans in the first place.

### External projects, source repository, documentation tooling  [M1, M6]  (source: external-projects.txt, external-interfaces.txt, external-admin-tools.txt, external-pl.txt, external-extensions.txt, sourcerepo.txt, git.txt, docguide*.txt)

- Only two client interfaces ship in core: **libpq** (the primary C interface; many other interfaces are built on it) and **ECPG** (depends on the server-side SQL grammar). All other language interfaces are external: https://wiki.postgresql.org/wiki/List_of_drivers . Some are not under the PostgreSQL license.
- Administration tools are external; the most popular is pgAdmin.
- Procedural languages in the base distribution: PL/pgSQL, PL/Tcl, PL/Perl, PL/Python. Others: https://wiki.postgresql.org/wiki/PL_Matrix .
- Extensions loaded into the database "can function just like features that are built in". `contrib/` extensions are in Appendix F; independent ones include PostGIS; replication solutions can be external too (Slony-I, a primary/standby replication solution).
- Source is managed with Git; a public mirror is updated within a minute of any change to the master repository. `git clone https://git.postgresql.org/git/postgresql.git`, then `git fetch`. Wiki: https://wiki.postgresql.org/wiki/Working_with_Git .
- Documentation formats: plain text (pre-installation), HTML, PDF, man pages; plus README files throughout the source tree "documenting various implementation issues". HTML and man pages are installed by default.
- Sources are DocBook XML (files are named `.sgml` for historical reasons). Tools: DocBook DTD **4.5** exactly (XML variant); DocBook XSL stylesheets, minimum 1.77.0; libxml2 (`xmllint`); libxslt (`xsltproc`); FOP (PDF only); `dbtoepub` (EPUB only).
- Install commands: `yum install docbook-dtds docbook-style-xsl libxslt fop`; `pkg install docbook-xml docbook-xsl libxslt fop` (FreeBSD; use `gmake`); `apt-get install docbook-xml docbook-xsl libxml2-utils xsltproc fop`; MacPorts `sudo port install docbook-xml docbook-xsl-nons libxslt fop`; Homebrew `brew install docbook docbook-xsl libxslt fop` with `XML_CATALOG_FILES=/usr/local/etc/xml/catalog` (Intel) or `/opt/homebrew/etc/xml/catalog` (Apple Silicon).
- Build in `doc/src/sgml`: `make html` (default target; output in `html`), `make STYLE=website html`, `make man`, `make postgres-A4.pdf`, `make postgres-US.pdf`, `make check` (syntax check in seconds). FOP memory: `~/.foprc` with e.g. `FOP_OPTS='-Xmx1500m'`. Meson: `ninja html` (output in `build/doc/src/sgml`).
- Reference-page layout for commands: Name, Synopsis, Description, Options, Exit Status, Usage, Environment, Files, Diagnostics, Notes, Examples, History, Author (contrib only), See Also. For SQL commands: Name, Synopsis, Description, Parameters, Outputs, Notes, Examples, Compatibility, History, See Also. (Useful as a template for the site's own command reference cards.)

### PostgreSQL limits  [M2, M1]  (source: limits.txt)

- Table K.1 lists hard limits; "practical limits, such as performance limitations or available disk space may apply before absolute hard limits are reached". The table is reproduced verbatim in "Complete inventories".
- Columns per table: 1,600, further limited by the tuple having to fit in a single 8192-byte heap page. Excluding the tuple header, 1,600 `int` columns = 6400 bytes, which fits; 1,600 `bigint` columns = 12800 bytes, which does not.
- Variable-length fields (`text`, `varchar`, `char`) can be stored out of line in the table's TOAST table when large enough; then **only an 18-byte pointer** remains in the heap tuple. Shorter variable-length values are stored in the heap tuple with either a **4-byte or 1-byte field header**.
- Dropped columns still count toward the column limit. Dropped column values in newly created tuples are marked null in the null bitmap, and the null bitmap itself occupies space.
- Each table can store a theoretical maximum of **2^32 out-of-line values**, because a 32-bit OID identifies each value (Section 66.2). The practical limit is much lower: as the OID space fills, finding a free OID gets expensive and slows INSERT/UPDATE. Typically only an issue for tables with many terabytes; partitioning is a possible workaround.
- Derivations a lesson can show (arithmetic from the table, not stated on the page): 32 TB = 2^32 pages × 8192 bytes; 63 bytes identifier = `NAMEDATALEN` 64 minus terminator; 65,535 query parameters = 16-bit count in the wire protocol. Treat these three explanations as editorial context to verify against the storage / protocol slices.

### Color support  [M6]  (source: color.txt, color-when.txt, color-which.txt)

- Most programs in the PostgreSQL package can produce colorized console output.
- `PG_COLOR`: `always` → color used; `auto` → color used if standard error is a terminal; otherwise no color. (oid2name and vacuumlo pages also list `never` as a value.)
- `PG_COLORS` (plural): colon-separated `key=value` list; values are SGR (Select Graphic Rendition) specifications. Keys: `error` (the text "error"), `warning` (the text "warning"), `note` (the text "detail" and "hint"), `locus` (location information such as program name and file name).
- Default: `error=01;31:warning=01;35:note=01;36:locus=01` (bold red, bold magenta, bold cyan, bold default color). Same format as GCC, GNU coreutils, GNU grep.

### Obsolete or renamed features  [M7, M1]  (source: appendix-obsolete.txt, recovery-config.txt, default-roles.txt, pgxlogdump.txt, app-pgresetxlog.txt, app-pgreceivexlog.txt)

- Purpose of Appendix O: redirect users arriving from old documentation or external links to the current location.
- **recovery.conf** (PostgreSQL 11 and below) managed replicas and standbys. Support removed in **PostgreSQL 12**. From 12 on, archive recovery, streaming replication, and PITR are configured with normal server parameters in `postgresql.conf` or via `ALTER SYSTEM`. **The server will not start if a `recovery.conf` exists.**
- `promote_trigger_file` (PostgreSQL 15 and below; named `trigger_file` before 12) is gone: use `pg_ctl promote` or `pg_promote()`.
- `standby_mode` is removed; a **`standby.signal`** file in the data directory is used instead. (The page mentions only `standby.signal`; `recovery.signal` is covered in the backup/recovery chapters, not here.)
- "Default Roles" (PostgreSQL 13 and below) are called **"Predefined Roles"** since PostgreSQL 14, because they cannot be changed and are installed at initialization time (Section 21.5).
- Renamed in PostgreSQL 10 (9.6 and below used the old names): `pg_xlogdump` → **`pg_waldump`**; `pg_resetxlog` → **`pg_resetwal`**; `pg_receivexlog` → **`pg_receivewal`**. (The `pg_xlog` → `pg_wal` directory rename is not described in this appendix.)
- Other renames and removals documented in this slice's release notes: `ssl_ecdh_curve` → `ssl_groups` (old name still works); pg_recvlogical `--two-phase` deprecated in favour of `--enable-two-phase`; `pg_int64` deprecated in favour of `int64_t`; `PQfn()` deprecated; MD5 passwords deprecated; `pg_stat_io.op_bytes`, `pg_stat_wal.wal_write` / `wal_sync` / `wal_write_time` / `wal_sync_time`, `pg_backend_memory_contexts.parent`, `pg_attribute.attcacheoff` removed; rule privileges removed from GRANT/REVOKE; `--disable-spinlocks` / `--disable-atomics` removed; HPPA/PA-RISC removed.

### Bibliography and legal notice  [M1, M5]  (source: biblio.txt, legalnotice.txt)

- Papers most relevant to the curriculum:
  - [berenson95] "A Critique of ANSI SQL Isolation Levels", Berenson, Bernstein, Gray, Melton, E. O'Neil, P. O'Neil, ACM-SIGMOD, June 1995. [M5]
  - [ports12] "Serializable Snapshot Isolation in PostgreSQL", D. Ports and K. Grittner, VLDB, August 2012. [M5]
  - [ston86] "The design of POSTGRES", Stonebraker and Rowe, ACM-SIGMOD, May 1986. [ston87b] "The design of the POSTGRES storage system", Stonebraker, VLDB, Sept. 1987. [ston90a] "The implementation of POSTGRES", Stonebraker, Rowe, Hirohama, IEEE TKDE 2(1), March 1990. [rowe87] "The POSTGRES data model", VLDB, Sept. 1987. [M1, M2]
  - [ston87a] "The design of the POSTGRES rules system"; [ston89] "A commentary on the POSTGRES rules system"; [ston90b] "On Rules, Procedures, Caching and Views in Database Systems"; [ong90] "A Unified Framework for Version Modeling Using Production Rules in a Database System". [M6]
  - [ston89b] "The case for partial indexes", SIGMOD Record 18(4), Dec. 1989; [olson93] Partial indexing in POSTGRES; [seshadri95] "Generalized Partial Indexes", ICDE 1995. [M4]
  - [fong] The design and implementation of the POSTGRES query optimizer, Zelaine Fong, UC Berkeley. [M4]
  - [hell18] "Looking Back at Postgres", J. Hellerstein, 2018. [ston92] "An overview of the Sequoia 2000 project". [M1]
- Books: [bowman01] The Practical SQL Handbook (4th ed., 2001); [date97] A Guide to the SQL Standard (4th ed., 1997); [date04] An Introduction to Database Systems (8th ed., 2003); [elma04] Fundamentals of Database Systems (4th ed., 2003); [melt93] Understanding the New SQL (1993); [ull88] Principles of Database and Knowledge-Base Systems, vol. 1 (1988); [sqltr-19075-6] SQL Technical Report Part 6: SQL support for JSON (2017).
- PostgreSQL-specific: [sim98] Enhancement of the ANSI SQL Implementation of PostgreSQL (Simkovics, 1998); [yu95] The Postgres95 User Manual (Yu and Chen, 1995).
- Legal notice: "Portions Copyright © 1996-2026, PostgreSQL Global Development Group"; "Portions Copyright © 1994, The Regents of the University of California". Permission to use, copy, modify, and distribute the software and documentation for any purpose, without fee and without a written agreement, provided the copyright notice and the two disclaimer paragraphs appear in all copies. Disclaimers of liability and warranty are in the name of the University of California; software is provided "AS-IS".

### Glossary facts with numbers or sharp distinctions  [M1, M2, M5, M7]  (source: glossary.txt)

The full glossary is in "Complete inventories". Points that lessons should reuse exactly:

- **Auxiliary processes** (exact membership): autovacuum launcher (but not the autovacuum workers), background writer, checkpointer, logger, startup process, WAL archiver, WAL receiver (but not the WAL senders), WAL summarizer, WAL writer. A **WAL sender** is "a special backend process".
- **Instance** = backend and auxiliary processes sharing one shared memory area, managed by one postmaster; one instance manages exactly one database cluster. Many instances can run on one server if TCP ports do not conflict. **Server** = hardware, container, or VM. **Database cluster** = collection of databases plus global objects, created by initdb; "cluster" is sometimes used for an instance.
- **Postmaster** = the very first process of an instance; starts and manages auxiliary processes and creates backend processes on demand.
- **Shared memory** belongs to the whole instance, not one database; its largest part is **shared buffers**. A modified page is a **dirty page** until written back.
- **Data page**: all pages the same size; read into shared buffers, become dirty when modified, clean when written; new pages existing only in memory are also dirty.
- **Fork**: main fork (data) plus two secondary forks — free space map and visibility map; unlogged relations also have an **init fork**.
- **File segment**: limited by a configuration value, typically 1 gigabyte.
- **Visibility map**: two bits per page — all-visible (all tuples visible to all transactions) and all-frozen (all tuples marked frozen).
- **Transaction ID**: assigned when a transaction first causes a database modification; 32 bits on disk, about four billion write XIDs; a 32-bit **epoch** extends it; when the counter reaches the maximum it restarts at **3** (lower values are reserved) and the epoch increments; epoch + xid together form a 64-bit value in some contexts.
- **LSN**: byte offset into the WAL, increasing monotonically with each new WAL record.
- **Checkpoint**: a point in the WAL sequence at which heap and index data files are guaranteed updated with everything modified in shared memory before it; a checkpoint record is written and flushed to WAL. **Restartpoint**: the variant performed on a replica.
- **WAL file** = WAL segment: fixed, predefined size, written sequentially; can be released after a checkpoint, by deletion or by renaming for future use (**recycling**).
- **Buffer Access Strategy**: a ring of a limited number of shared buffers reused circularly, to stop large operations evicting too many pages. Used by sequential scans of large tables, VACUUM, COPY, CREATE TABLE AS SELECT, ALTER TABLE, CREATE DATABASE, CREATE INDEX, CLUSTER. Choosing a victim may require flushing dirty data and possibly unflushed WAL.
- **Bloat**: space in data pages not containing current row versions — unused space or outdated row versions.
- **MVCC**: implemented by creating copies (versions) of tuples as they are modified; old versions must be removed after transactions that can see them terminate.
- **Unlogged**: changes not reflected in WAL, which disables replication and crash recovery for the relation; temporary tables are always unlogged.
- **Unique constraint**: nulls are not considered equal, so multiple rows with nulls are allowed. **Primary key**: unique plus no nulls; only one per table.
- **Function** vs **procedure**: a function runs within one transaction and is invoked in a query; a procedure returns no value, may issue COMMIT and ROLLBACK, and is invoked with CALL.
- **Trigger** events listed: INSERT, UPDATE, DELETE, TRUNCATE; runs in the invoking statement's transaction; if the function fails the statement fails.
- **View**: no storage; its definition is substituted into the referencing query as a subquery. **Materialized view**: stores data like a table; cannot be modified by INSERT, UPDATE, DELETE, or MERGE.
- **SQL object** scoping: local objects (most, in a schema; some, such as extensions, casts, and foreign data wrappers, outside any schema) vs global objects (roles, tablespaces, replication origins, subscriptions, databases), whose names are unique across the cluster.
- **Bootstrap superuser**: first user in the cluster; owns all system catalog tables; cannot be dropped; superuser status cannot be removed. **Cluster owner**: the OS user owning the data directory; root may not be the cluster owner.
- **Tablespace**: initial default is `pg_default`. **Data directory**: `PGDATA`; excludes tablespaces and optionally WAL.
- Archaic synonyms: Class = relation; Log record = WAL record; Master = primary; Standby = replica; Optimizer = query planner; Record / Row = tuple; Analytic function = window function; GMT ≈ UTC.

## Complete inventories

### Table K.1. PostgreSQL Limitations (verbatim)

| Item | Upper Limit | Comment |
|---|---|---|
| database size | unlimited | |
| number of databases | 4,294,950,911 | |
| relations per database | 1,431,650,303 | |
| relation size | 32 TB | with the default BLCKSZ of 8192 bytes |
| rows per table | limited by the number of tuples that can fit onto 4,294,967,295 pages | |
| columns per table | 1,600 | further limited by tuple size fitting on a single page; see note below |
| CHECK constraints per table | 32,767 | constrained by the size of pg_class.relchecks |
| columns in a result set | 1,664 | |
| field size | 1 GB | |
| indexes per table | unlimited | constrained by maximum relations per database |
| columns per index | 32 | can be increased by recompiling PostgreSQL |
| partition keys | 32 | can be increased by recompiling PostgreSQL |
| identifier length | 63 bytes | can be increased by recompiling PostgreSQL |
| function arguments | 100 | can be increased by recompiling PostgreSQL |
| query parameters | 65,535 | |

Other limits stated in this slice: 18-byte TOAST pointer in the heap tuple; 4-byte or 1-byte varlena header; 2^32 out-of-line values per table; vacuumlo default 1000 LOs per transaction; tsvector lexeme length `MAXSTRLEN` = 2047; `ts_headline()` option strings 32 kB; aggregate arguments `FUNC_MAX_ARGS - 1`.

### Table A.1. PostgreSQL Error Codes (complete: 43 classes, 263 codes)

**Class 00 — Successful Completion**

- `00000` successful_completion

**Class 01 — Warning**

- `01000` warning
- `0100C` dynamic_result_sets_returned
- `01008` implicit_zero_bit_padding
- `01003` null_value_eliminated_in_set_function
- `01007` privilege_not_granted
- `01006` privilege_not_revoked
- `01004` string_data_right_truncation
- `01P01` deprecated_feature

**Class 02 — No Data (this is also a warning class per the SQL standard)**

- `02000` no_data
- `02001` no_additional_dynamic_result_sets_returned

**Class 03 — SQL Statement Not Yet Complete**

- `03000` sql_statement_not_yet_complete

**Class 08 — Connection Exception**

- `08000` connection_exception
- `08003` connection_does_not_exist
- `08006` connection_failure
- `08001` sqlclient_unable_to_establish_sqlconnection
- `08004` sqlserver_rejected_establishment_of_sqlconnection
- `08007` transaction_resolution_unknown
- `08P01` protocol_violation

**Class 09 — Triggered Action Exception**

- `09000` triggered_action_exception

**Class 0A — Feature Not Supported**

- `0A000` feature_not_supported

**Class 0B — Invalid Transaction Initiation**

- `0B000` invalid_transaction_initiation

**Class 0F — Locator Exception**

- `0F000` locator_exception
- `0F001` invalid_locator_specification

**Class 0L — Invalid Grantor**

- `0L000` invalid_grantor
- `0LP01` invalid_grant_operation

**Class 0P — Invalid Role Specification**

- `0P000` invalid_role_specification

**Class 0Z — Diagnostics Exception**

- `0Z000` diagnostics_exception
- `0Z002` stacked_diagnostics_accessed_without_active_handler

**Class 10 — XQuery Error**

- `10608` invalid_argument_for_xquery

**Class 20 — Case Not Found**

- `20000` case_not_found

**Class 21 — Cardinality Violation**

- `21000` cardinality_violation

**Class 22 — Data Exception**

- `22000` data_exception
- `2202E` array_subscript_error
- `22021` character_not_in_repertoire
- `22008` datetime_field_overflow
- `22012` division_by_zero
- `22005` error_in_assignment
- `2200B` escape_character_conflict
- `22022` indicator_overflow
- `22015` interval_field_overflow
- `2201E` invalid_argument_for_logarithm
- `22014` invalid_argument_for_ntile_function
- `22016` invalid_argument_for_nth_value_function
- `2201F` invalid_argument_for_power_function
- `2201G` invalid_argument_for_width_bucket_function
- `22018` invalid_character_value_for_cast
- `22007` invalid_datetime_format
- `22019` invalid_escape_character
- `2200D` invalid_escape_octet
- `22025` invalid_escape_sequence
- `22P06` nonstandard_use_of_escape_character
- `22010` invalid_indicator_parameter_value
- `22023` invalid_parameter_value
- `22013` invalid_preceding_or_following_size
- `2201B` invalid_regular_expression
- `2201W` invalid_row_count_in_limit_clause
- `2201X` invalid_row_count_in_result_offset_clause
- `2202H` invalid_tablesample_argument
- `2202G` invalid_tablesample_repeat
- `22009` invalid_time_zone_displacement_value
- `2200C` invalid_use_of_escape_character
- `2200G` most_specific_type_mismatch
- `22004` null_value_not_allowed
- `22002` null_value_no_indicator_parameter
- `22003` numeric_value_out_of_range
- `2200H` sequence_generator_limit_exceeded
- `22026` string_data_length_mismatch
- `22001` string_data_right_truncation
- `22011` substring_error
- `22027` trim_error
- `22024` unterminated_c_string
- `2200F` zero_length_character_string
- `22P01` floating_point_exception
- `22P02` invalid_text_representation
- `22P03` invalid_binary_representation
- `22P04` bad_copy_file_format
- `22P05` untranslatable_character
- `22P07` datum_version_mismatch
- `2200L` not_an_xml_document
- `2200M` invalid_xml_document
- `2200N` invalid_xml_content
- `2200S` invalid_xml_comment
- `2200T` invalid_xml_processing_instruction
- `22030` duplicate_json_object_key_value
- `22031` invalid_argument_for_sql_json_datetime_function
- `22032` invalid_json_text
- `22033` invalid_sql_json_subscript
- `22034` more_than_one_sql_json_item
- `22035` no_sql_json_item
- `22036` non_numeric_sql_json_item
- `22037` non_unique_keys_in_a_json_object
- `22038` singleton_sql_json_item_required
- `22039` sql_json_array_not_found
- `2203A` sql_json_member_not_found
- `2203B` sql_json_number_not_found
- `2203C` sql_json_object_not_found
- `2203D` too_many_json_array_elements
- `2203E` too_many_json_object_members
- `2203F` sql_json_scalar_required
- `2203G` sql_json_item_cannot_be_cast_to_target_type

**Class 23 — Integrity Constraint Violation**

- `23000` integrity_constraint_violation
- `23001` restrict_violation
- `23502` not_null_violation
- `23503` foreign_key_violation
- `23505` unique_violation
- `23514` check_violation
- `23P01` exclusion_violation

**Class 24 — Invalid Cursor State**

- `24000` invalid_cursor_state

**Class 25 — Invalid Transaction State**

- `25000` invalid_transaction_state
- `25001` active_sql_transaction
- `25002` branch_transaction_already_active
- `25008` held_cursor_requires_same_isolation_level
- `25003` inappropriate_access_mode_for_branch_transaction
- `25004` inappropriate_isolation_level_for_branch_transaction
- `25005` no_active_sql_transaction_for_branch_transaction
- `25006` read_only_sql_transaction
- `25007` schema_and_data_statement_mixing_not_supported
- `25P01` no_active_sql_transaction
- `25P02` in_failed_sql_transaction
- `25P03` idle_in_transaction_session_timeout
- `25P04` transaction_timeout

**Class 26 — Invalid SQL Statement Name**

- `26000` invalid_sql_statement_name

**Class 27 — Triggered Data Change Violation**

- `27000` triggered_data_change_violation

**Class 28 — Invalid Authorization Specification**

- `28000` invalid_authorization_specification
- `28P01` invalid_password

**Class 2B — Dependent Privilege Descriptors Still Exist**

- `2B000` dependent_privilege_descriptors_still_exist
- `2BP01` dependent_objects_still_exist

**Class 2D — Invalid Transaction Termination**

- `2D000` invalid_transaction_termination

**Class 2F — SQL Routine Exception**

- `2F000` sql_routine_exception
- `2F005` function_executed_no_return_statement
- `2F002` modifying_sql_data_not_permitted
- `2F003` prohibited_sql_statement_attempted
- `2F004` reading_sql_data_not_permitted

**Class 34 — Invalid Cursor Name**

- `34000` invalid_cursor_name

**Class 38 — External Routine Exception**

- `38000` external_routine_exception
- `38001` containing_sql_not_permitted
- `38002` modifying_sql_data_not_permitted
- `38003` prohibited_sql_statement_attempted
- `38004` reading_sql_data_not_permitted

**Class 39 — External Routine Invocation Exception**

- `39000` external_routine_invocation_exception
- `39001` invalid_sqlstate_returned
- `39004` null_value_not_allowed
- `39P01` trigger_protocol_violated
- `39P02` srf_protocol_violated
- `39P03` event_trigger_protocol_violated

**Class 3B — Savepoint Exception**

- `3B000` savepoint_exception
- `3B001` invalid_savepoint_specification

**Class 3D — Invalid Catalog Name**

- `3D000` invalid_catalog_name

**Class 3F — Invalid Schema Name**

- `3F000` invalid_schema_name

**Class 40 — Transaction Rollback**

- `40000` transaction_rollback
- `40002` transaction_integrity_constraint_violation
- `40001` serialization_failure
- `40003` statement_completion_unknown
- `40P01` deadlock_detected

**Class 42 — Syntax Error or Access Rule Violation**

- `42000` syntax_error_or_access_rule_violation
- `42601` syntax_error
- `42501` insufficient_privilege
- `42846` cannot_coerce
- `42803` grouping_error
- `42P20` windowing_error
- `42P19` invalid_recursion
- `42830` invalid_foreign_key
- `42602` invalid_name
- `42622` name_too_long
- `42939` reserved_name
- `42804` datatype_mismatch
- `42P18` indeterminate_datatype
- `42P21` collation_mismatch
- `42P22` indeterminate_collation
- `42809` wrong_object_type
- `428C9` generated_always
- `42703` undefined_column
- `42883` undefined_function
- `42P01` undefined_table
- `42P02` undefined_parameter
- `42704` undefined_object
- `42701` duplicate_column
- `42P03` duplicate_cursor
- `42P04` duplicate_database
- `42723` duplicate_function
- `42P05` duplicate_prepared_statement
- `42P06` duplicate_schema
- `42P07` duplicate_table
- `42712` duplicate_alias
- `42710` duplicate_object
- `42702` ambiguous_column
- `42725` ambiguous_function
- `42P08` ambiguous_parameter
- `42P09` ambiguous_alias
- `42P10` invalid_column_reference
- `42611` invalid_column_definition
- `42P11` invalid_cursor_definition
- `42P12` invalid_database_definition
- `42P13` invalid_function_definition
- `42P14` invalid_prepared_statement_definition
- `42P15` invalid_schema_definition
- `42P16` invalid_table_definition
- `42P17` invalid_object_definition

**Class 44 — WITH CHECK OPTION Violation**

- `44000` with_check_option_violation

**Class 53 — Insufficient Resources**

- `53000` insufficient_resources
- `53100` disk_full
- `53200` out_of_memory
- `53300` too_many_connections
- `53400` configuration_limit_exceeded

**Class 54 — Program Limit Exceeded**

- `54000` program_limit_exceeded
- `54001` statement_too_complex
- `54011` too_many_columns
- `54023` too_many_arguments

**Class 55 — Object Not In Prerequisite State**

- `55000` object_not_in_prerequisite_state
- `55006` object_in_use
- `55P02` cant_change_runtime_param
- `55P03` lock_not_available
- `55P04` unsafe_new_enum_value_usage

**Class 57 — Operator Intervention**

- `57000` operator_intervention
- `57014` query_canceled
- `57P01` admin_shutdown
- `57P02` crash_shutdown
- `57P03` cannot_connect_now
- `57P04` database_dropped
- `57P05` idle_session_timeout

**Class 58 — System Error (errors external to PostgreSQL itself)**

- `58000` system_error
- `58030` io_error
- `58P01` undefined_file
- `58P02` duplicate_file
- `58P03` file_name_too_long

**Class F0 — Configuration File Error**

- `F0000` config_file_error
- `F0001` lock_file_exists

**Class HV — Foreign Data Wrapper Error (SQL/MED)**

- `HV000` fdw_error
- `HV005` fdw_column_name_not_found
- `HV002` fdw_dynamic_parameter_value_needed
- `HV010` fdw_function_sequence_error
- `HV021` fdw_inconsistent_descriptor_information
- `HV024` fdw_invalid_attribute_value
- `HV007` fdw_invalid_column_name
- `HV008` fdw_invalid_column_number
- `HV004` fdw_invalid_data_type
- `HV006` fdw_invalid_data_type_descriptors
- `HV091` fdw_invalid_descriptor_field_identifier
- `HV00B` fdw_invalid_handle
- `HV00C` fdw_invalid_option_index
- `HV00D` fdw_invalid_option_name
- `HV090` fdw_invalid_string_length_or_buffer_length
- `HV00A` fdw_invalid_string_format
- `HV009` fdw_invalid_use_of_null_pointer
- `HV014` fdw_too_many_handles
- `HV001` fdw_out_of_memory
- `HV00P` fdw_no_schemas
- `HV00J` fdw_option_name_not_found
- `HV00K` fdw_reply_handle
- `HV00Q` fdw_schema_not_found
- `HV00R` fdw_table_not_found
- `HV00L` fdw_unable_to_create_execution
- `HV00M` fdw_unable_to_create_reply
- `HV00N` fdw_unable_to_establish_connection

**Class P0 — PL/pgSQL Error**

- `P0000` plpgsql_error
- `P0001` raise_exception
- `P0002` no_data_found
- `P0003` too_many_rows
- `P0004` assert_failure

**Class XX — Internal Error**

- `XX000` internal_error
- `XX001` data_corrupted
- `XX002` index_corrupted

### Appendix L. Acronyms (complete, 87 entries)

- **AIO** — Asynchronous I/O
- **ACL** — Access Control List
- **AM** — Access Method
- **ANSI** — American National Standards Institute
- **API** — Application Programming Interface
- **ASCII** — American Standard Code for Information Interchange
- **BKI** — Backend Interface
- **CA** — Certificate Authority
- **CIDR** — Classless Inter-Domain Routing
- **CPAN** — Comprehensive Perl Archive Network
- **CRL** — Certificate Revocation List
- **CSV** — Comma Separated Values
- **CTE** — Common Table Expression
- **CVE** — Common Vulnerabilities and Exposures
- **DBA** — Database Administrator
- **DBI** — Database Interface (Perl)
- **DBMS** — Database Management System
- **DDL** — Data Definition Language, SQL commands such as CREATE TABLE, ALTER USER
- **DML** — Data Manipulation Language, SQL commands such as INSERT, UPDATE, DELETE
- **DST** — Daylight Saving Time
- **ECPG** — Embedded C for PostgreSQL
- **ESQL** — Embedded SQL
- **FAQ** — Frequently Asked Questions
- **FSM** — Free Space Map
- **GEQO** — Genetic Query Optimizer
- **GIN** — Generalized Inverted Index
- **GiST** — Generalized Search Tree
- **Git** — Git
- **GMT** — Greenwich Mean Time
- **GSSAPI** — Generic Security Services Application Programming Interface
- **GUC** — Grand Unified Configuration, the PostgreSQL subsystem that handles server configuration
- **HBA** — Host-Based Authentication
- **HOT** — Heap-Only Tuples
- **IEC** — International Electrotechnical Commission
- **IEEE** — Institute of Electrical and Electronics Engineers
- **IPC** — Inter-Process Communication
- **I/O** — Input/Output
- **ISO** — International Organization for Standardization
- **ISSN** — International Standard Serial Number
- **JDBC** — Java Database Connectivity
- **JIT** — Just-in-Time compilation
- **JSON** — JavaScript Object Notation
- **LDAP** — Lightweight Directory Access Protocol
- **LSN** — Log Sequence Number
- **MCF** — Most Common Frequency, that is the frequency associated with some Most Common Value
- **MCV** — Most Common Value, one of the values appearing most often within a particular table column
- **MITM** — Man-in-the-middle attack
- **MSVC** — Microsoft Visual C
- **MVCC** — Multi-Version Concurrency Control
- **NLS** — National Language Support
- **ODBC** — Open Database Connectivity
- **OID** — Object Identifier
- **OLAP** — Online Analytical Processing
- **OLTP** — Online Transaction Processing
- **ORDBMS** — Object-Relational Database Management System
- **PAM** — Pluggable Authentication Modules
- **PGSQL** — PostgreSQL
- **PGXS** — PostgreSQL Extension System
- **PID** — Process Identifier
- **PITR** — Point-In-Time Recovery (Continuous Archiving)
- **PL** — Procedural Languages (server-side)
- **POSIX** — Portable Operating System Interface
- **RDBMS** — Relational Database Management System
- **RFC** — Request For Comments
- **SGML** — Standard Generalized Markup Language
- **SNI** — Server Name Indication, RFC 6066
- **SPI** — Server Programming Interface
- **SP-GiST** — Space-Partitioned Generalized Search Tree
- **SQL** — Structured Query Language
- **SRF** — Set-Returning Function
- **SSH** — Secure Shell
- **SSL** — Secure Sockets Layer
- **SSPI** — Security Support Provider Interface
- **SYSV** — Unix System V
- **TCP/IP** — Transmission Control Protocol (TCP) / Internet Protocol (IP)
- **TID** — Tuple Identifier
- **TLS** — Transport Layer Security
- **TOAST** — The Oversized-Attribute Storage Technique
- **TPC** — Transaction Processing Performance Council
- **URL** — Uniform Resource Locator
- **UTC** — Coordinated Universal Time
- **UTF** — Unicode Transformation Format
- **UTF8** — Eight-Bit Unicode Transformation Format
- **UUID** — Universally Unique Identifier
- **WAL** — Write-Ahead Log
- **XID** — Transaction Identifier
- **XML** — Extensible Markup Language

### Appendix M. Glossary (complete, 146 entries, definitions verbatim; "See" entries are cross-references)

- **ACID** — Atomicity, Consistency, Isolation, and Durability. This set of properties of database transactions is intended to guarantee validity in concurrent operation and even in event of errors, power failures, etc.
- **Aggregate function (routine)** — A function that combines (aggregates) multiple input values, for example by counting, averaging or adding, yielding a single output value. For more information, see Section 9.21. See Also Window function (routine).
- **Access Method** — Interfaces which PostgreSQL use in order to access data in tables and indexes. This abstraction allows for adding support for new types of data storage. For more information, see Chapter 62 and Chapter 63.
- **Analytic function** — See Window function (routine).
- **Analyze (operation)** — The act of collecting statistics from data in tables and other relations to help the query planner to make decisions about how to execute queries. (Don't confuse this term with the ANALYZE option to the EXPLAIN command.) For more information, see ANALYZE.
- **Asynchronous I/O (AIO)** — Asynchronous I/O (AIO) describes performing I/O in a non-blocking way (asynchronously), in contrast to synchronous I/O, which blocks for the entire duration of the I/O. With AIO, starting an I/O operation is separated from waiting for the result of the operation, allowing multiple I/O operations to be initiated concurrently, as well as performing CPU heavy operations concurrently with I/O. The price for that increased concurrency is increased complexity. See Also Input/Output.
- **Atomic** — In reference to a datum: the fact that its value cannot be broken down into smaller components. In reference to a database transaction: see atomicity.
- **Atomicity** — The property of a transaction that either all its operations complete as a single unit or none do. In addition, if a system failure occurs during the execution of a transaction, no partial results are visible after recovery. This is one of the ACID properties.
- **Attribute** — An element with a certain name and data type found within a tuple.
- **Autovacuum (process)** — A set of background processes that routinely perform vacuum and analyze operations. The auxiliary process that coordinates the work and is always present (unless autovacuum is disabled) is known as the autovacuum launcher, and the processes that carry out the tasks are known as the autovacuum workers. For more information, see Section 24.1.6.
- **Auxiliary process** — A process within an instance that is in charge of some specific background task for the instance. The auxiliary processes consist of the autovacuum launcher (but not the autovacuum workers), the background writer, the checkpointer, the logger, the startup process, the WAL archiver, the WAL receiver (but not the WAL senders), the WAL summarizer, and the WAL writer.
- **Backend (process)** — Process of an instance which acts on behalf of a client session and handles its requests. (Don't confuse this term with the similar terms Background Worker or Background Writer).
- **Background worker (process)** — Process within an instance, which runs system- or user-supplied code. Serves as infrastructure for several features in PostgreSQL, such as logical replication and parallel queries. In addition, Extensions can add custom background worker processes. For more information, see Chapter 46.
- **Background writer (process)** — An auxiliary process that writes dirty data pages from shared memory to the file system. It wakes up periodically, but works only for a short period in order to distribute its expensive I/O activity over time to avoid generating larger I/O peaks which could block other processes. For more information, see Section 19.4.4.
- **Base Backup** — A binary copy of all database cluster files. It is generated by the tool pg_basebackup. In combination with WAL files it can be used as the starting point for recovery, log shipping, or streaming replication.
- **Bloat** — Space in data pages which does not contain current row versions, such as unused (free) space or outdated row versions.
- **Bootstrap superuser** — The first user initialized in a database cluster. This user owns all system catalog tables in each database. It is also the role from which all granted permissions originate. Because of these things, this role may not be dropped. This role also behaves as a normal database superuser, and its superuser status cannot be removed.
- **Buffer Access Strategy** — Some operations will access a large number of pages. A Buffer Access Strategy helps to prevent these operations from evicting too many pages from shared buffers. A Buffer Access Strategy sets up references to a limited number of shared buffers and reuses them circularly. When the operation requires a new page, a victim buffer is chosen from the buffers in the strategy ring, which may require flushing the page's dirty data and possibly also unflushed WAL to permanent storage. Buffer Access Strategies are used for various operations such as sequential scans of large tables, VACUUM, COPY, CREATE TABLE AS SELECT, ALTER TABLE, CREATE DATABASE, CREATE INDEX, and CLUSTER.
- **Cast** — A conversion of a datum from its current data type to another data type. For more information, see CREATE CAST.
- **Catalog** — The SQL standard uses this term to indicate what is called a database in PostgreSQL's terminology. (Don't confuse this term with system catalog). For more information, see Section 22.1.
- **Check constraint** — A type of constraint defined on a relation which restricts the values allowed in one or more attributes. The check constraint can make reference to any attribute of the same row in the relation, but cannot reference other rows of the same relation or other relations. For more information, see Section 5.5.
- **Checkpoint** — A point in the WAL sequence at which it is guaranteed that the heap and index data files have been updated with all information from shared memory modified before that checkpoint; a checkpoint record is written and flushed to WAL to mark that point. A checkpoint is also the act of carrying out all the actions that are necessary to reach a checkpoint as defined above. This process is initiated when predefined conditions are met, such as a specified amount of time has passed, or a certain volume of records has been written; or it can be invoked by the user with the command CHECKPOINT. For more information, see Section 28.5.
- **Checkpointer (process)** — An auxiliary process that is responsible for executing checkpoints.
- **Class (archaic)** — See Relation.
- **Client (process)** — Any process, possibly remote, that establishes a session by connecting to an instance to interact with a database.
- **Cluster owner** — The operating system user that owns the data directory and under which the postgres process is run. It is required that this user exist prior to creating a new database cluster. On operating systems with a root user, said user is not allowed to be the cluster owner.
- **Column** — An attribute found in a table or view.
- **Commit** — The act of finalizing a transaction within the database, which makes it visible to other transactions and assures its durability. For more information, see COMMIT.
- **Concurrency** — The concept that multiple independent operations happen within the database at the same time. In PostgreSQL, concurrency is controlled by the multiversion concurrency control mechanism.
- **Connection** — An established line of communication between a client process and a backend process, usually over a network, supporting a session. This term is sometimes used as a synonym for session. For more information, see Section 19.3.
- **Consistency** — The property that the data in the database is always in compliance with integrity constraints. Transactions may be allowed to violate some of the constraints transiently before it commits, but if such violations are not resolved by the time it commits, such a transaction is automatically rolled back. This is one of the ACID properties.
- **Constraint** — A restriction on the values of data allowed within a table, or in attributes of a domain. For more information, see Section 5.5.
- **Cumulative Statistics System** — A system which, if enabled, accumulates statistical information about the instance's activities. For more information, see Section 27.2.
- **Data area** — See Data directory.
- **Database** — A named collection of local SQL objects. For more information, see Section 22.1.
- **Database cluster** — A collection of databases and global SQL objects, and their common static and dynamic metadata. Sometimes referred to as a cluster. A database cluster is created using the initdb program. In PostgreSQL, the term cluster is also sometimes used to refer to an instance. (Don't confuse this term with the SQL command CLUSTER.) See also cluster owner, the operating-system owner of a cluster, and bootstrap superuser, the PostgreSQL owner of a cluster.
- **Database server** — See Instance.
- **Database superuser** — A role having superuser status (see Section 21.2). Frequently referred to as superuser.
- **Data directory** — The base directory on the file system of a server that contains all data files and subdirectories associated with a database cluster (with the exception of tablespaces, and optionally WAL). The environment variable PGDATA is commonly used to refer to the data directory. A cluster's storage space comprises the data directory plus any additional tablespaces. For more information, see Section 66.1.
- **Data page** — The basic structure used to store relation data. All pages are of the same size. Data pages are typically stored on disk, each in a specific file, and can be read to shared buffers where they can be modified, becoming dirty. They become clean when written to disk. New pages, which initially exist in memory only, are also dirty until written.
- **Datum** — The internal representation of one value of an SQL data type.
- **Delete** — An SQL command which removes rows from a given table or relation. For more information, see DELETE.
- **Domain** — A user-defined data type that is based on another underlying data type. It acts the same as the underlying type except for possibly restricting the set of allowed values. For more information, see Section 8.18.
- **Durability** — The assurance that once a transaction has been committed, the changes remain even after a system failure or crash. This is one of the ACID properties.
- **Epoch** — See Transaction ID.
- **Extension** — A software add-on package that can be installed on an instance to get extra features. For more information, see Section 36.17.
- **File segment** — A physical file which stores data for a given relation. File segments are limited in size by a configuration value (typically 1 gigabyte), so if a relation exceeds that size, it is split into multiple segments. For more information, see Section 66.1. (Don't confuse this term with the similar term WAL segment).
- **Foreign data wrapper** — A means of representing data that is not contained in the local database so that it appears as if were in local table(s). With a foreign data wrapper it is possible to define a foreign server and foreign tables. For more information, see CREATE FOREIGN DATA WRAPPER.
- **Foreign key** — A type of constraint defined on one or more columns in a table which requires the value(s) in those columns to identify zero or one row in another (or, infrequently, the same) table.
- **Foreign server** — A named collection of foreign tables which all use the same foreign data wrapper and have other configuration values in common. For more information, see CREATE SERVER.
- **Foreign table (relation)** — A relation which appears to have rows and columns similar to a regular table, but will forward requests for data through its foreign data wrapper, which will return result sets structured according to the definition of the foreign table. For more information, see CREATE FOREIGN TABLE.
- **Fork** — Each of the separate segmented file sets in which a relation is stored. The main fork is where the actual data resides. There also exist two secondary forks for metadata: the free space map and the visibility map. Unlogged relations also have an init fork.
- **Free space map (fork)** — A storage structure that keeps metadata about each data page of a table's main fork. The free space map entry for each page stores the amount of free space that's available for future tuples, and is structured to be efficiently searched for available space for a new tuple of a given size. For more information, see Section 66.3.
- **Function (routine)** — A type of routine that receives zero or more arguments, returns zero or more output values, and is constrained to run within one transaction. Functions are invoked as part of a query, for example via SELECT. Certain functions can return sets; those are called set-returning functions. Functions can also be used for triggers to invoke. For more information, see CREATE FUNCTION.
- **GMT** — See UTC.
- **Grant** — An SQL command that is used to allow a user or role to access specific objects within the database. For more information, see GRANT.
- **Heap** — Contains the values of row attributes (i.e., the data) for a relation. The heap is realized within one or more file segments in the relation's main fork.
- **Host** — A computer that communicates with other computers over a network. This is sometimes used as a synonym for server. It is also used to refer to a computer where client processes run.
- **Index (relation)** — A relation that contains data derived from a table or materialized view. Its internal structure supports fast retrieval of and access to the original data. For more information, see CREATE INDEX.
- **Incremental backup** — A special base backup that for some files may contain only those pages that were modified since a previous backup, as opposed to the full contents of every file. Like base backups, it is generated by the tool pg_basebackup. To restore incremental backups the tool pg_combinebackup is used, which combines incremental backups with a base backup. Afterwards, recovery can use WAL to bring the database cluster to a consistent state. For more information, see Section 25.3.3.
- **Input/Output (I/O)** — Input/Output (I/O) describes the communication between a program and peripheral devices. In the context of database systems, I/O commonly, but not exclusively, refers to interaction with storage devices or the network. See Also Asynchronous I/O.
- **Insert** — An SQL command used to add new data into a table. For more information, see INSERT.
- **Instance** — A group of backend and auxiliary processes that communicate using a common shared memory area. One postmaster process manages the instance; one instance manages exactly one database cluster with all its databases. Many instances can run on the same server as long as their TCP ports do not conflict. The instance handles all key features of a DBMS: read and write access to files and shared memory, assurance of the ACID properties, connections to client processes, privilege verification, crash recovery, replication, etc.
- **Isolation** — The property that the effects of a transaction are not visible to concurrent transactions before it commits. This is one of the ACID properties. For more information, see Section 13.2.
- **Join** — An operation and SQL keyword used in queries for combining data from multiple relations.
- **Key** — A means of identifying a row within a table or other relation by values contained within one or more attributes in that relation.
- **Lock** — A mechanism that allows a process to limit or prevent simultaneous access to a resource.
- **Log file** — Log files contain human-readable text lines about events. Examples include login failures, long-running queries, etc. For more information, see Section 24.3.
- **Logged** — A table is considered logged if changes to it are sent to the WAL. By default, all regular tables are logged. A table can be specified as unlogged either at creation time or via the ALTER TABLE command.
- **Logger (process)** — An auxiliary process which, if enabled, writes information about database events into the current log file. When reaching certain time- or volume-dependent criteria, a new log file is created. Also called syslogger. For more information, see Section 19.8.
- **Logical replication cluster** — A set of publisher and subscriber instances with the publisher instance replicating changes to the subscriber instance.
- **Log record** — Archaic term for a WAL record.
- **Log sequence number (LSN)** — Byte offset into the WAL, increasing monotonically with each new WAL record. For more information, see pg_lsn and Section 28.6.
- **LSN** — See Log sequence number.
- **Master (server)** — See Primary (server).
- **Materialized** — The property that some information has been pre-computed and stored for later use, rather than computing it on-the-fly. This term is used in materialized view, to mean that the data derived from the view's query is stored on disk separately from the sources of that data. This term is also used to refer to some multi-step queries to mean that the data resulting from executing a given step is stored in memory (with the possibility of spilling to disk), so that it can be read multiple times by another step.
- **Materialized view (relation)** — A relation that is defined by a SELECT statement (just like a view), but stores data in the same way that a table does. It cannot be modified via INSERT, UPDATE, DELETE, or MERGE operations. For more information, see CREATE MATERIALIZED VIEW.
- **Merge** — An SQL command used to conditionally add, modify, or remove rows in a given table, using data from a source relation. For more information, see MERGE.
- **Multi-version concurrency control (MVCC)** — A mechanism designed to allow several transactions to be reading and writing the same rows without one process causing other processes to stall. In PostgreSQL, MVCC is implemented by creating copies (versions) of tuples as they are modified; after transactions that can see the old versions terminate, those old versions need to be removed.
- **Null** — A concept of non-existence that is a central tenet of relational database theory. It represents the absence of a definite value.
- **Optimizer** — See Query planner.
- **Parallel query** — The ability to handle parts of executing a query to take advantage of parallel processes on servers with multiple CPUs.
- **Partition** — One of several disjoint (not overlapping) subsets of a larger set. In reference to a partitioned table: One of the tables that each contain part of the data of the partitioned table, which is said to be the parent. The partition is itself a table, so it can also be queried directly; at the same time, a partition can sometimes be a partitioned table, allowing hierarchies to be created. In reference to a window function in a query, a partition is a user-defined criterion that identifies which neighboring rows of the query's result set can be considered by the function.
- **Partitioned table (relation)** — A relation that is in semantic terms the same as a table, but whose storage is distributed across several partitions.
- **Postmaster (process)** — The very first process of an instance. It starts and manages the auxiliary processes and creates backend processes on demand. For more information, see Section 18.3.
- **Primary key** — A special case of a unique constraint defined on a table or other relation that also guarantees that all of the attributes within the primary key do not have null values. As the name implies, there can be only one primary key per table, though it is possible to have multiple unique constraints that also have no null-capable attributes.
- **Primary (server)** — When two or more databases are linked via replication, the server that is considered the authoritative source of information is called the primary, also known as a master.
- **Procedure (routine)** — A type of routine. Their distinctive qualities are that they do not return values, and that they are allowed to make transactional statements such as COMMIT and ROLLBACK. They are invoked via the CALL command. For more information, see CREATE PROCEDURE.
- **Query** — A request sent by a client to a backend, usually to return results or to modify data on the database.
- **Query planner** — The part of PostgreSQL that is devoted to determining (planning) the most efficient way to execute queries. Also known as query optimizer, optimizer, or simply planner.
- **Record** — See Tuple.
- **Recycling** — See WAL file.
- **Referential integrity** — A means of restricting data in one relation by a foreign key so that it must have matching data in another relation.
- **Relation** — The generic term for all objects in a database that have a name and a list of attributes defined in a specific order. Tables, sequences, views, foreign tables, materialized views, composite types, and indexes are all relations. More generically, a relation is a set of tuples; for example, the result of a query is also a relation. In PostgreSQL, Class is an archaic synonym for relation.
- **Replica (server)** — A database that is paired with a primary database and is maintaining a copy of some or all of the primary database's data. The foremost reasons for doing this are to allow for greater access to that data, and to maintain availability of the data in the event that the primary becomes unavailable.
- **Replication** — The act of reproducing data on one server onto another server called a replica. This can take the form of physical replication, where all file changes from one server are copied verbatim, or logical replication where a defined subset of data changes are conveyed using a higher-level representation.
- **Restartpoint** — A variant of a checkpoint performed on a replica. For more information, see Section 28.5.
- **Result set** — A relation transmitted from a backend process to a client upon the completion of an SQL command, usually a SELECT but it can be an INSERT, UPDATE, DELETE, or MERGE command if the RETURNING clause is specified. The fact that a result set is a relation means that a query can be used in the definition of another query, becoming a subquery.
- **Revoke** — A command to prevent access to a named set of database objects for a named list of roles. For more information, see REVOKE.
- **Role** — A collection of access privileges to the instance. Roles are themselves a privilege that can be granted to other roles. This is often done for convenience or to ensure completeness when multiple users need the same privileges. For more information, see CREATE ROLE.
- **Rollback** — A command to undo all of the operations performed since the beginning of a transaction. For more information, see ROLLBACK.
- **Routine** — A defined set of instructions stored in the database system that can be invoked for execution. A routine can be written in a variety of programming languages. Routines can be functions (including set-returning functions and trigger functions), aggregate functions, and procedures. Many routines are already defined within PostgreSQL itself, but user-defined ones can also be added.
- **Row** — See Tuple.
- **Savepoint** — A special mark in the sequence of steps in a transaction. Data modifications after this point in time may be reverted to the time of the savepoint. For more information, see SAVEPOINT.
- **Schema** — A schema is a namespace for SQL objects, which all reside in the same database. Each SQL object must reside in exactly one schema. All system-defined SQL objects reside in schema pg_catalog. More generically, the term schema is used to mean all data descriptions (table definitions, constraints, comments, etc.) for a given database or subset thereof. For more information, see Section 5.10.
- **Segment** — See File segment.
- **Select** — The SQL command used to request data from a database. Normally, SELECT commands are not expected to modify the database in any way, but it is possible that functions invoked within the query could have side effects that do modify data. For more information, see SELECT.
- **Sequence (relation)** — A type of relation that is used to generate values. Typically the generated values are sequential non-repeating numbers. They are commonly used to generate surrogate primary key values.
- **Server** — A computer on which PostgreSQL instances run. The term server denotes real hardware, a container, or a virtual machine. This term is sometimes used to refer to an instance or to a host.
- **Session** — A state that allows a client and a backend to interact, communicating over a connection.
- **Shared memory** — RAM which is used by the processes common to an instance. It mirrors parts of database files, provides a transient area for WAL records, and stores additional common information. Note that shared memory belongs to the complete instance, not to a single database. The largest part of shared memory is known as shared buffers and is used to mirror part of data files, organized into pages. When a page is modified, it is called a dirty page until it is written back to the file system. For more information, see Section 19.4.1.
- **SQL object** — Any object that can be created with a CREATE command. Most objects are specific to one database, and are commonly known as local objects. Most local objects reside in a specific schema in their containing database, such as relations (all types), routines (all types), data types, etc. The names of such objects of the same type in the same schema are enforced to be unique. There also exist local objects that do not reside in schemas; some examples are extensions, data type casts, and foreign data wrappers. The names of such objects of the same type are enforced to be unique within the database. Other object types, such as roles, tablespaces, replication origins, subscriptions for logical replication, and databases themselves are not local SQL objects since they exist entirely outside of any specific database; they are called global objects. The names of such objects are enforced to be unique within the whole database cluster. For more information, see Section 22.1.
- **SQL standard** — A series of documents that define the SQL language.
- **Standby (server)** — See Replica (server).
- **Startup process** — An auxiliary process that replays WAL during crash recovery and in a physical replica. (The name is historical: the startup process was named before replication was implemented; the name refers to its task as it relates to the server startup following a crash.)
- **Superuser** — As used in this documentation, it is a synonym for database superuser.
- **System catalog** — A collection of tables which describe the structure of all SQL objects of the instance. The system catalog resides in the schema pg_catalog. These tables contain data in internal representation and are not typically considered useful for user examination; a number of user-friendlier views, also in schema pg_catalog, offer more convenient access to some of that information, while additional tables and views exist in schema information_schema (see Chapter 35) that expose some of the same and additional information as mandated by the SQL standard. For more information, see Section 5.10.
- **Table** — A collection of tuples having a common data structure (the same number of attributes, in the same order, having the same name and type per position). A table is the most common form of relation in PostgreSQL. For more information, see CREATE TABLE.
- **Tablespace** — A named location on the server file system. All SQL objects which require storage beyond their definition in the system catalog must belong to a single tablespace. Initially, a database cluster contains a single usable tablespace which is used as the default for all SQL objects, called pg_default. For more information, see Section 22.6.
- **Temporary table** — Tables that exist either for the lifetime of a session or a transaction, as specified at the time of creation. The data in them is not visible to other sessions, and is not logged. Temporary tables are often used to store intermediate data for a multi-step operation. For more information, see CREATE TABLE.
- **TOAST** — A mechanism by which large attributes of table rows are split and stored in a secondary table, called the TOAST table. Each relation with large attributes has its own TOAST table. For more information, see Section 66.2.
- **Transaction** — A combination of commands that must act as a single atomic command: they all succeed or all fail as a single unit, and their effects are not visible to other sessions until the transaction is complete, and possibly even later, depending on the isolation level. For more information, see Section 13.2.
- **Transaction ID** — The numerical, unique, sequentially-assigned identifier that each transaction receives when it first causes a database modification. Frequently abbreviated as xid. When stored on disk, xids are only 32-bits wide, so only approximately four billion write transaction IDs can be generated; to permit the system to run for longer than that, epochs are used, also 32 bits wide. When the counter reaches the maximum xid value, it starts over at 3 (values under that are reserved) and the epoch value is incremented by one. In some contexts, the epoch and xid values are considered together as a single 64-bit value; see Section 67.1 for more details. For more information, see Section 8.19.
- **Transactions per second (TPS)** — Average number of transactions that are executed per second, totaled across all sessions active for a measured run. This is used as a measure of the performance characteristics of an instance.
- **Trigger** — A function which can be defined to execute whenever a certain operation (INSERT, UPDATE, DELETE, TRUNCATE) is applied to a relation. A trigger executes within the same transaction as the statement which invoked it, and if the function fails, then the invoking statement also fails. For more information, see CREATE TRIGGER.
- **Tuple** — A collection of attributes in a fixed order. That order may be defined by the table (or other relation) where the tuple is contained, in which case the tuple is often called a row. It may also be defined by the structure of a result set, in which case it is sometimes called a record.
- **Unique constraint** — A type of constraint defined on a relation which restricts the values allowed in one or a combination of columns so that each value or combination of values can only appear once in the relation — that is, no other row in the relation contains values that are equal to those. Because null values are not considered equal to each other, multiple rows with null values are allowed to exist without violating the unique constraint.
- **Unlogged** — The property of certain relations that the changes to them are not reflected in the WAL. This disables replication and crash recovery for these relations. The primary use of unlogged tables is for storing transient work data that must be shared across processes. Temporary tables are always unlogged.
- **Update** — An SQL command used to modify rows that may already exist in a specified table. It cannot create or remove rows. For more information, see UPDATE.
- **User** — A role that has the login privilege (see Section 21.2).
- **User mapping** — The translation of login credentials in the local database to credentials in a remote data system defined by a foreign data wrapper. For more information, see CREATE USER MAPPING.
- **UTC** — Universal Coordinated Time, the primary global time reference, approximately the time prevailing at the zero meridian of longitude. Often but inaccurately referred to as GMT (Greenwich Mean Time).
- **Vacuum** — The process of removing outdated tuple versions from tables or materialized views, and other closely related processing required by PostgreSQL's implementation of MVCC. This can be initiated through the use of the VACUUM command, but can also be handled automatically via autovacuum processes. For more information, see Section 24.1 .
- **View** — A relation that is defined by a SELECT statement, but has no storage of its own. Any time a query references a view, the definition of the view is substituted into the query as if the user had typed it as a subquery instead of the name of the view. For more information, see CREATE VIEW.
- **Visibility map (fork)** — A storage structure that keeps metadata about each data page of a table's main fork. The visibility map entry for each page stores two bits: the first one (all-visible) indicates that all tuples in the page are visible to all transactions. The second one (all-frozen) indicates that all tuples in the page are marked frozen.
- **WAL** — See Write-ahead log.
- **WAL archiver (process)** — An auxiliary process which, if enabled, saves copies of WAL files for the purpose of creating backups or keeping replicas current. For more information, see Section 25.3.
- **WAL file** — Also known as WAL segment or WAL segment file. Each of the sequentially-numbered files that provide storage space for WAL. The files are all of the same predefined size and are written in sequential order, interspersing changes as they occur in multiple simultaneous sessions. If the system crashes, the files are read in order, and each of the changes is replayed to restore the system to the state it was in before the crash. Each WAL file can be released after a checkpoint writes all the changes in it to the corresponding data files. Releasing the file can be done either by deleting it, or by changing its name so that it will be used in the future, which is called recycling. For more information, see Section 28.6.
- **WAL record** — A low-level description of an individual data change. It contains sufficient information for the data change to be re-executed (replayed) in case a system failure causes the change to be lost. WAL records use a non-printable binary format. For more information, see Section 28.6.
- **WAL receiver (process)** — An auxiliary process that runs on a replica to receive WAL from the primary server for replay by the startup process. For more information, see Section 26.2.
- **WAL segment** — See WAL file.
- **WAL sender (process)** — A special backend process that streams WAL over a network. The receiving end can be a WAL receiver in a replica, pg_receivewal, or any other client program that speaks the replication protocol.
- **WAL summarizer (process)** — An auxiliary process that summarizes WAL data for incremental backups. For more information, see Section 19.5.7.
- **WAL writer (process)** — An auxiliary process that writes WAL records from shared memory to WAL files. For more information, see Section 19.5.
- **Window function (routine)** — A type of function used in a query that applies to a partition of the query's result set; the function's result is based on values found in rows of the same partition or frame. All aggregate functions can be used as window functions, but window functions can also be used to, for example, give ranks to each of the rows in the partition. Also known as analytic functions. For more information, see Section 3.5.
- **Write-ahead log** — The journal that keeps track of the changes in the database cluster as user- and system-invoked operations take place. It comprises many individual WAL records written sequentially to WAL files.

### Table C.1. SQL key words, grouped by PostgreSQL classification (complete, 844 words)

- ** ** (350): A, ABS, ACCORDING, ACOS, ADA, ALLOCATE, ANY_VALUE, ARE, ARRAY_AGG, ARRAY_MAX_CARDINALITY, ASIN, ATAN, ATTRIBUTES, AVG, BASE64, BEGIN_FRAME, BEGIN_PARTITION, BERNOULLI, BIT_LENGTH, BLOB, BLOCKED, BOM, BTRIM, C, CARDINALITY, CATALOG_NAME, CEIL, CEILING, CHAINING, CHARACTERS, CHARACTER_LENGTH, CHARACTER_SET_CATALOG, CHARACTER_SET_NAME, CHARACTER_SET_SCHEMA, CHAR_LENGTH, CLASSIFIER, CLASS_ORIGIN, CLOB, COBOL, COLLATION_CATALOG, COLLATION_NAME, COLLATION_SCHEMA, COLLECT, COLUMN_NAME, COMMAND_FUNCTION, COMMAND_FUNCTION_CODE, CONDITION, CONDITION_NUMBER, CONNECT, CONNECTION_NAME, CONSTRAINT_CATALOG, CONSTRAINT_NAME, CONSTRAINT_SCHEMA, CONSTRUCTOR, CONTAINS, CONTROL, CONVERT, COPARTITION, CORR, CORRESPONDING, COS, COSH, COUNT, COVAR_POP, COVAR_SAMP, CUME_DIST, CURRENT_DEFAULT_TRANSFORM_GROUP, CURRENT_PATH, CURRENT_ROW, CURRENT_TRANSFORM_GROUP_FOR_TYPE, CURSOR_NAME, DATALINK, DATE, DATETIME_INTERVAL_CODE, DATETIME_INTERVAL_PRECISION, DB, DECFLOAT, DEFINE, DEFINED, DEGREE, DENSE_RANK, DEREF, DERIVED, DESCRIBE, DESCRIPTOR, DETERMINISTIC, DIAGNOSTICS, DISCONNECT, DISPATCH, DLNEWCOPY, DLPREVIOUSCOPY, DLURLCOMPLETE, DLURLCOMPLETEONLY, DLURLCOMPLETEWRITE, DLURLPATH, DLURLPATHONLY, DLURLPATHWRITE, DLURLSCHEME, DLURLSERVER, DLVALUE, DYNAMIC, DYNAMIC_FUNCTION, DYNAMIC_FUNCTION_CODE, ELEMENT, END-EXEC, END_FRAME, END_PARTITION, EQUALS, EVERY, EXCEPTION, EXEC, EXP, FILE, FINAL, FINISH, FIRST_VALUE, FLAG, FLOOR, FORTRAN, FOUND, FRAME_ROW, FREE, FS, FULFILL, FUSION, G, GENERAL, GET, GO, GOTO, HEX, HIERARCHY, ID, IGNORE, IMMEDIATELY, IMPLEMENTATION, INDICATOR, INITIAL, INSTANCE, INSTANTIABLE, INTEGRITY, INTERSECTION, JSON_TABLE_PRIMITIVE, K, KEY_MEMBER, KEY_TYPE, LAG, LAST_VALUE, LEAD, LENGTH, LIBRARY, LIKE_REGEX, LINK, LISTAGG, LN, LOCATOR, LOG, LOG10, LOWER, LPAD, LTRIM, M, MAP, MATCHES, MATCH_NUMBER, MATCH_RECOGNIZE, MAX, MEASURES, MEMBER, MESSAGE_LENGTH, MESSAGE_OCTET_LENGTH, MESSAGE_TEXT, MIN, MOD, MODIFIES, MODULE, MORE, MULTISET, MUMPS, NAMESPACE, NCLOB, NESTING, NIL, NTH_VALUE, NTILE, NULLABLE, NULL_ORDERING, NUMBER, OCCURRENCE, OCCURRENCES_REGEX, OCTETS, OCTET_LENGTH, ONE, OPEN, ORDERING, OUTPUT, OVERFLOW, P, PAD, PARAMETER_MODE, PARAMETER_NAME, PARAMETER_ORDINAL_POSITION, PARAMETER_SPECIFIC_CATALOG, PARAMETER_SPECIFIC_NAME, PARAMETER_SPECIFIC_SCHEMA, PASCAL, PASS, PASSTHROUGH, PAST, PATTERN, PER, PERCENT, PERCENTILE_CONT, PERCENTILE_DISC, PERCENT_RANK, PERMISSION, PERMUTE, PIPE, PLI, PORTION, POSITION_REGEX, POWER, PRECEDES, PREV, PRIVATE, PRUNE, PTF, PUBLIC, RANK, READS, RECOVERY, REGR_AVGX, REGR_AVGY, REGR_COUNT, REGR_INTERCEPT, REGR_R2, REGR_SLOPE, REGR_SXX, REGR_SXY, REGR_SYY, REQUIRING, RESPECT, RESTORE, RESULT, RETURNED_CARDINALITY, RETURNED_LENGTH, RETURNED_OCTET_LENGTH, RETURNED_SQLSTATE, ROUTINE_CATALOG, ROUTINE_NAME, ROUTINE_SCHEMA, ROW_COUNT, ROW_NUMBER, RPAD, RTRIM, RUNNING, SCALE, SCHEMA_NAME, SCOPE, SCOPE_CATALOG, SCOPE_NAME, SCOPE_SCHEMA, SECTION, SEEK, SELECTIVE, SELF, SEMANTICS, SENSITIVE, SERVER_NAME, SIN, SINH, SIZE, SORT_DIRECTION, SPACE, SPECIFIC, SPECIFICTYPE, SPECIFIC_NAME, SQLCODE, SQLERROR, SQLEXCEPTION, SQLSTATE, SQLWARNING, SQRT, STATE, STATIC, STDDEV_POP, STDDEV_SAMP, STRUCTURE, STYLE, SUBCLASS_ORIGIN, SUBMULTISET, SUBSET, SUBSTRING_REGEX, SUCCEEDS, SUM, SYSTEM_TIME, T, TABLE_NAME, TAN, TANH, THROUGH, TIMEZONE_HOUR, TIMEZONE_MINUTE, TOKEN, TOP_LEVEL_COUNT, TRANSACTIONS_COMMITTED, TRANSACTIONS_ROLLED_BACK, TRANSACTION_ACTIVE, TRANSFORMS, TRANSLATE, TRANSLATE_REGEX, TRANSLATION, TRIGGER_CATALOG, TRIGGER_NAME, TRIGGER_SCHEMA, TRIM_ARRAY, UNDER, UNLINK, UNMATCHED, UNNAMED, UNNEST, UNTYPED, UPPER, URI, USAGE, USER_DEFINED_TYPE_CATALOG, USER_DEFINED_TYPE_CODE, USER_DEFINED_TYPE_NAME, USER_DEFINED_TYPE_SCHEMA, UTF16, UTF32, UTF8, VALUE_OF, VARBINARY, VAR_POP, VAR_SAMP, VERSIONING, WHENEVER, WIDTH_BUCKET, XMLAGG, XMLBINARY, XMLCAST, XMLCOMMENT, XMLDECLARATION, XMLDOCUMENT, XMLITERATE, XMLQUERY, XMLSCHEMA, XMLTEXT, XMLVALIDATE
- **non-reserved (cannot be function or type), requires AS** (3): CHAR, CHARACTER, PRECISION
- **non-reserved (cannot be function or type)** (60): BETWEEN, BIGINT, BIT, BOOLEAN, COALESCE, DEC, DECIMAL, EXISTS, EXTRACT, FLOAT, GREATEST, GROUPING, INOUT, INT, INTEGER, INTERVAL, JSON, JSON_ARRAY, JSON_ARRAYAGG, JSON_EXISTS, JSON_OBJECT, JSON_OBJECTAGG, JSON_QUERY, JSON_SCALAR, JSON_SERIALIZE, JSON_TABLE, JSON_VALUE, LEAST, MERGE_ACTION, NATIONAL, NCHAR, NONE, NORMALIZE, NULLIF, NUMERIC, OUT, OVERLAY, POSITION, REAL, ROW, SETOF, SMALLINT, SUBSTRING, TIME, TIMESTAMP, TREAT, TRIM, VALUES, VARCHAR, XMLATTRIBUTES, XMLCONCAT, XMLELEMENT, XMLEXISTS, XMLFOREST, XMLNAMESPACES, XMLPARSE, XMLPI, XMLROOT, XMLSERIALIZE, XMLTABLE
- **non-reserved, requires AS** (11): DAY, FILTER, HOUR, MINUTE, MONTH, OVER, SECOND, VARYING, WITHIN, WITHOUT, YEAR
- **non-reserved** (319): ABORT, ABSENT, ABSOLUTE, ACCESS, ACTION, ADD, ADMIN, AFTER, AGGREGATE, ALSO, ALTER, ALWAYS, ASENSITIVE, ASSERTION, ASSIGNMENT, AT, ATOMIC, ATTACH, ATTRIBUTE, BACKWARD, BEFORE, BEGIN, BREADTH, BY, CACHE, CALL, CALLED, CASCADE, CASCADED, CATALOG, CHAIN, CHARACTERISTICS, CHECKPOINT, CLASS, CLOSE, CLUSTER, COLUMNS, COMMENT, COMMENTS, COMMIT, COMMITTED, COMPRESSION, CONDITIONAL, CONFIGURATION, CONFLICT, CONNECTION, CONSTRAINTS, CONTENT, CONTINUE, CONVERSION, COPY, COST, CSV, CUBE, CURRENT, CURSOR, CYCLE, DATA, DATABASE, DEALLOCATE, DECLARE, DEFAULTS, DEFERRED, DEFINER, DELETE, DELIMITER, DELIMITERS, DEPENDS, DEPTH, DETACH, DICTIONARY, DISABLE, DISCARD, DOCUMENT, DOMAIN, DOUBLE, DROP, EACH, EMPTY, ENABLE, ENCODING, ENCRYPTED, ENFORCED, ENUM, ERROR, ESCAPE, EVENT, EXCLUDE, EXCLUDING, EXCLUSIVE, EXECUTE, EXPLAIN, EXPRESSION, EXTENSION, EXTERNAL, FAMILY, FINALIZE, FIRST, FOLLOWING, FORCE, FORMAT, FORWARD, FUNCTION, FUNCTIONS, GENERATED, GLOBAL, GRANTED, GROUPS, HANDLER, HEADER, HOLD, IDENTITY, IF, IMMEDIATE, IMMUTABLE, IMPLICIT, IMPORT, INCLUDE, INCLUDING, INCREMENT, INDENT, INDEX, INDEXES, INHERIT, INHERITS, INLINE, INPUT, INSENSITIVE, INSERT, INSTEAD, INVOKER, ISOLATION, KEEP, KEY, KEYS, LABEL, LANGUAGE, LARGE, LAST, LEAKPROOF, LEVEL, LISTEN, LOAD, LOCAL, LOCATION, LOCK, LOCKED, LOGGED, MAPPING, MATCH, MATCHED, MATERIALIZED, MAXVALUE, MERGE, METHOD, MINVALUE, MODE, MOVE, NAME, NAMES, NESTED, NEW, NEXT, NFC, NFD, NFKC, NFKD, NO, NORMALIZED, NOTHING, NOTIFY, NOWAIT, NULLS, OBJECT, OBJECTS, OF, OFF, OIDS, OLD, OMIT, OPERATOR, OPTION, OPTIONS, ORDINALITY, OTHERS, OVERRIDING, OWNED, OWNER, PARALLEL, PARAMETER, PARSER, PARTIAL, PARTITION, PASSING, PASSWORD, PATH, PERIOD, PLAN, PLANS, POLICY, PRECEDING, PREPARE, PREPARED, PRESERVE, PRIOR, PRIVILEGES, PROCEDURAL, PROCEDURE, PROCEDURES, PROGRAM, PUBLICATION, QUOTE, QUOTES, RANGE, READ, REASSIGN, RECURSIVE, REF, REFERENCING, REFRESH, REINDEX, RELATIVE, RELEASE, RENAME, REPEATABLE, REPLACE, REPLICA, RESET, RESTART, RESTRICT, RETURN, RETURNS, REVOKE, ROLE, ROLLBACK, ROLLUP, ROUTINE, ROUTINES, ROWS, RULE, SAVEPOINT, SCALAR, SCHEMA, SCHEMAS, SCROLL, SEARCH, SECURITY, SEQUENCE, SEQUENCES, SERIALIZABLE, SERVER, SESSION, SET, SETS, SHARE, SHOW, SIMPLE, SKIP, SNAPSHOT, SOURCE, SQL, STABLE, STANDALONE, START, STATEMENT, STATISTICS, STDIN, STDOUT, STORAGE, STORED, STRICT, STRING, STRIP, SUBSCRIPTION, SUPPORT, SYSID, SYSTEM, TABLES, TABLESPACE, TARGET, TEMP, TEMPLATE, TEMPORARY, TEXT, TIES, TRANSACTION, TRANSFORM, TRIGGER, TRUNCATE, TRUSTED, TYPE, TYPES, UESCAPE, UNBOUNDED, UNCOMMITTED, UNCONDITIONAL, UNENCRYPTED, UNKNOWN, UNLISTEN, UNLOGGED, UNTIL, UPDATE, VACUUM, VALID, VALIDATE, VALIDATOR, VALUE, VERSION, VIEW, VIEWS, VIRTUAL, VOLATILE, WHITESPACE, WORK, WRAPPER, WRITE, XML, YES, ZONE
- **reserved (can be function or type), requires AS** (3): ISNULL, NOTNULL, OVERLAPS
- **reserved (can be function or type)** (20): AUTHORIZATION, BINARY, COLLATION, CONCURRENTLY, CROSS, CURRENT_SCHEMA, FREEZE, FULL, ILIKE, INNER, IS, JOIN, LEFT, LIKE, NATURAL, OUTER, RIGHT, SIMILAR, TABLESAMPLE, VERBOSE
- **reserved, requires AS** (22): ARRAY, AS, CREATE, EXCEPT, FETCH, FOR, FROM, GRANT, GROUP, HAVING, INTERSECT, INTO, LIMIT, OFFSET, ON, ORDER, RETURNING, TO, UNION, WHERE, WINDOW, WITH
- **reserved** (56): ALL, ANALYSE, ANALYZE, AND, ANY, ASC, ASYMMETRIC, BOTH, CASE, CAST, CHECK, COLLATE, COLUMN, CONSTRAINT, CURRENT_CATALOG, CURRENT_DATE, CURRENT_ROLE, CURRENT_TIME, CURRENT_TIMESTAMP, CURRENT_USER, DEFAULT, DEFERRABLE, DESC, DISTINCT, DO, ELSE, END, FALSE, FOREIGN, IN, INITIALLY, LATERAL, LEADING, LOCALTIME, LOCALTIMESTAMP, NOT, NULL, ONLY, OR, PLACING, PRIMARY, REFERENCES, SELECT, SESSION_USER, SOME, SYMMETRIC, SYSTEM_USER, TABLE, THEN, TRAILING, TRUE, UNIQUE, USER, USING, VARIADIC, WHEN

### D.1. Supported SQL:2023 features (complete; "(Core)" marks Core rows, "[...]" is the docs' comment)

- **B-series (3)**: B012 Embedded C; B021 Direct SQL; B128 Routine language SQL
- **E-series (107)**: E011 Numeric data types (Core); E011-01 INTEGER and SMALLINT data types (Core); E011-02 REAL, DOUBLE PRECISION, and FLOAT data types (Core); E011-03 DECIMAL and NUMERIC data types (Core); E011-04 Arithmetic operators (Core); E011-05 Numeric comparison (Core); E011-06 Implicit casting among the numeric data types (Core); E021 Character data types (Core); E021-01 CHARACTER data type (Core); E021-02 CHARACTER VARYING data type (Core); E021-03 Character literals (Core); E021-04 CHARACTER_LENGTH function (Core) [trims trailing spaces from CHARACTER values before counting]; E021-05 OCTET_LENGTH function (Core); E021-06 SUBSTRING function (Core); E021-07 Character concatenation (Core); E021-08 UPPER and LOWER functions (Core); E021-09 TRIM function (Core); E021-10 Implicit casting among the character string types (Core); E021-11 POSITION function (Core); E021-12 Character comparison (Core); E031 Identifiers (Core); E031-01 Delimited identifiers (Core); E031-02 Lower case identifiers (Core); E031-03 Trailing underscore (Core); E051 Basic query specification (Core); E051-01 SELECT DISTINCT (Core); E051-02 GROUP BY clause (Core); E051-04 GROUP BY can contain columns not in <select list> (Core); E051-05 Select list items can be renamed (Core); E051-06 HAVING clause (Core); E051-07 Qualified * in select list (Core); E051-08 Correlation names in the FROM clause (Core); E051-09 Rename columns in the FROM clause (Core); E061 Basic predicates and search conditions (Core); E061-01 Comparison predicate (Core); E061-02 BETWEEN predicate (Core); E061-03 IN predicate with list of values (Core); E061-04 LIKE predicate (Core); E061-05 LIKE predicate ESCAPE clause (Core); E061-06 NULL predicate (Core); E061-07 Quantified comparison predicate (Core); E061-08 EXISTS predicate (Core); E061-09 Subqueries in comparison predicate (Core); E061-11 Subqueries in IN predicate (Core); E061-12 Subqueries in quantified comparison predicate (Core); E061-13 Correlated subqueries (Core); E061-14 Search condition (Core); E071 Basic query expressions (Core); E071-01 UNION DISTINCT table operator (Core); E071-02 UNION ALL table operator (Core); E071-03 EXCEPT DISTINCT table operator (Core); E071-05 Columns combined via table operators need not have exactly the same data type (Core); E071-06 Table operators in subqueries (Core); E081 Basic Privileges (Core); E081-01 SELECT privilege (Core); E081-02 DELETE privilege (Core); E081-03 INSERT privilege at the table level (Core); E081-04 UPDATE privilege at the table level (Core); E081-05 UPDATE privilege at the column level (Core); E081-06 REFERENCES privilege at the table level (Core); E081-07 REFERENCES privilege at the column level (Core); E081-08 WITH GRANT OPTION (Core); E081-09 USAGE privilege (Core); E081-10 EXECUTE privilege (Core); E091 Set functions (Core); E091-01 AVG (Core); E091-02 COUNT (Core); E091-03 MAX (Core); E091-04 MIN (Core); E091-05 SUM (Core); E091-06 ALL quantifier (Core); E091-07 DISTINCT quantifier (Core); E101 Basic data manipulation (Core); E101-01 INSERT statement (Core); E101-03 Searched UPDATE statement (Core); E101-04 Searched DELETE statement (Core); E111 Single row SELECT statement (Core); E121 Basic cursor support (Core); E121-01 DECLARE CURSOR (Core); E121-02 ORDER BY columns need not be in select list (Core); E121-03 Value expressions in ORDER BY clause (Core); E121-04 OPEN statement (Core); E121-06 Positioned UPDATE statement (Core); E121-07 Positioned DELETE statement (Core); E121-08 CLOSE statement (Core); E121-10 FETCH statement implicit NEXT (Core); E121-17 WITH HOLD cursors (Core); E131 Null value support (nulls in lieu of values) (Core); E141 Basic integrity constraints (Core); E141-01 NOT NULL constraints (Core); E141-02 UNIQUE constraints of NOT NULL columns (Core); E141-03 PRIMARY KEY constraints (Core); E141-04 Basic FOREIGN KEY constraint with the NO ACTION default for both referential delete action and referential update action (Core); E141-06 CHECK constraints (Core); E141-07 Column defaults (Core); E141-08 NOT NULL inferred on PRIMARY KEY (Core); E141-10 Names in a foreign key can be specified in any order (Core); E151 Transaction support (Core); E151-01 COMMIT statement (Core); E151-02 ROLLBACK statement (Core); E152 Basic SET TRANSACTION statement (Core); E152-01 SET TRANSACTION statement: ISOLATION LEVEL SERIALIZABLE clause (Core); E152-02 SET TRANSACTION statement: READ ONLY and READ WRITE clauses (Core); E153 Updatable queries with subqueries (Core); E161 SQL comments using leading double minus (Core); E171 SQLSTATE support (Core); E182 Host language binding (Core)
- **F-series (165)**: F021 Basic information schema (Core); F021-01 COLUMNS view (Core); F021-02 TABLES view (Core); F021-03 VIEWS view (Core); F021-04 TABLE_CONSTRAINTS view (Core); F021-05 REFERENTIAL_CONSTRAINTS view (Core); F021-06 CHECK_CONSTRAINTS view (Core); F031 Basic schema manipulation (Core); F031-01 CREATE TABLE statement to create persistent base tables (Core); F031-02 CREATE VIEW statement (Core); F031-03 GRANT statement (Core); F031-04 ALTER TABLE statement: ADD COLUMN clause (Core); F031-13 DROP TABLE statement: RESTRICT clause (Core); F031-16 DROP VIEW statement: RESTRICT clause (Core); F031-19 REVOKE statement: RESTRICT clause (Core); F032 CASCADE drop behavior; F033 ALTER TABLE statement: DROP COLUMN clause; F034 Extended REVOKE statement; F035 REVOKE with CASCADE; F036 REVOKE statement performed by non-owner; F037 REVOKE statement: GRANT OPTION FOR clause; F038 REVOKE of a WITH GRANT OPTION privilege; F041 Basic joined table (Core); F041-01 Inner join (but not necessarily the INNER keyword) (Core); F041-02 INNER keyword (Core); F041-03 LEFT OUTER JOIN (Core); F041-04 RIGHT OUTER JOIN (Core); F041-05 Outer joins can be nested (Core); F041-07 The inner table in a left or right outer join can also be used in an inner join (Core); F041-08 All comparison operators are supported (rather than just =) (Core); F051 Basic date and time (Core); F051-01 DATE data type (including support of DATE literal) (Core); F051-02 TIME data type (including support of TIME literal) with fractional seconds precision of at least 0 (Core); F051-03 TIMESTAMP data type (including support of TIMESTAMP literal) with fractional seconds precision of at least 0 and 6 (Core); F051-04 Comparison predicate on DATE, TIME, and TIMESTAMP data types (Core); F051-05 Explicit CAST between datetime types and character string types (Core); F051-06 CURRENT_DATE (Core); F051-07 LOCALTIME (Core); F051-08 LOCALTIMESTAMP (Core); F052 Intervals and datetime arithmetic; F053 OVERLAPS predicate; F081 UNION and EXCEPT in views (Core); F111 Isolation levels other than SERIALIZABLE; F112 Isolation level READ UNCOMMITTED; F113 Isolation level READ COMMITTED; F114 Isolation level REPEATABLE READ; F131 Grouped operations (Core); F131-01 WHERE, GROUP BY, and HAVING clauses supported in queries with grouped views (Core); F131-02 Multiple tables supported in queries with grouped views (Core); F131-03 Set functions supported in queries with grouped views (Core); F131-04 Subqueries with GROUP BY and HAVING clauses and grouped views (Core); F131-05 Single row SELECT with GROUP BY and HAVING clauses and grouped views (Core); F171 Multiple schemas per user; F181 Multiple module support (Core); F191 Referential delete actions; F200 TRUNCATE TABLE statement; F201 CAST function (Core); F202 TRUNCATE TABLE: identity column restart option; F221 Explicit defaults (Core); F222 INSERT statement: DEFAULT VALUES clause; F231 Privilege tables; F251 Domain support; F261 CASE expression (Core); F261-01 Simple CASE (Core); F261-02 Searched CASE (Core); F261-03 NULLIF (Core); F261-04 COALESCE (Core); F262 Extended CASE expression; F271 Compound character literals; F281 LIKE enhancements; F292 UNIQUE null treatment; F302 INTERSECT table operator; F303 INTERSECT DISTINCT table operator; F304 EXCEPT ALL table operator; F305 INTERSECT ALL table operator; F311 Schema definition statement (Core); F311-01 CREATE SCHEMA (Core); F311-02 CREATE TABLE for persistent base tables (Core); F311-03 CREATE VIEW (Core); F311-04 CREATE VIEW: WITH CHECK OPTION (Core); F311-05 GRANT statement (Core); F312 MERGE statement; F313 Enhanced MERGE statement; F314 MERGE statement with DELETE branch; F321 User authorization; F341 Usage tables; F361 Subprogram support; F381 Extended schema manipulation; F382 Alter column data type; F383 Set column not null clause; F384 Drop identity property clause; F385 Drop column generation expression clause; F386 Set identity column generation clause; F387 ALTER TABLE statement: ALTER COLUMN clause; F388 ALTER TABLE statement: ADD/DROP CONSTRAINT clause; F391 Long identifiers; F392 Unicode escapes in identifiers; F393 Unicode escapes in literals; F394 Optional normal form specification; F401 Extended joined table; F402 Named column joins for LOBs, arrays, and multisets; F404 Range variable for common column names; F405 NATURAL JOIN; F406 FULL OUTER JOIN; F407 CROSS JOIN; F411 Time zone specification [differences regarding literal interpretation]; F421 National character; F431 Read-only scrollable cursors; F432 FETCH with explicit NEXT; F433 FETCH FIRST; F434 FETCH LAST; F435 FETCH PRIOR; F436 FETCH ABSOLUTE; F437 FETCH RELATIVE; F438 Scrollable cursors; F441 Extended set function support; F442 Mixed column references in set functions; F471 Scalar subquery values (Core); F481 Expanded NULL predicate (Core); F491 Constraint management; F492 Optional table constraint enforcement [except not-null constraints]; F501 Features and conformance views (Core); F501-01 SQL_FEATURES view (Core); F501-02 SQL_SIZING view (Core); F502 Enhanced documentation tables; F531 Temporary tables; F555 Enhanced seconds precision; F561 Full value expressions; F571 Truth value tests; F591 Derived tables; F611 Indicator data types; F641 Row and table constructors; F651 Catalog name qualifiers; F661 Simple tables; F672 Retrospective CHECK constraints; F690 Collation support; F692 Extended collation support; F701 Referential update actions; F711 ALTER domain; F731 INSERT column privileges; F751 View CHECK enhancements; F761 Session management; F762 CURRENT_CATALOG; F763 CURRENT_SCHEMA; F771 Connection management; F781 Self-referencing operations; F791 Insensitive cursors; F801 Full set function; F850 Top-level ORDER BY in query expression; F851 ORDER BY in subqueries; F852 Top-level ORDER BY in views; F855 Nested ORDER BY in query expression; F856 Nested FETCH FIRST in query expression; F857 Top-level FETCH FIRST in query expression; F858 FETCH FIRST in subqueries; F859 Top-level FETCH FIRST in views; F860 Dynamic FETCH FIRST row count; F861 Top-level OFFSET in query expression; F862 OFFSET in subqueries; F863 Nested OFFSET in query expression; F864 Top-level OFFSET in views; F865 Dynamic offset row count in OFFSET; F867 FETCH FIRST clause: WITH TIES option; F868 ORDER BY in grouped table; F869 SQL implementation info population
- **S-series (14)**: S071 SQL paths in function and type name resolution; S090 Minimal array support; S092 Arrays of user-defined types; S095 Array constructors by query; S096 Optional array bounds; S098 ARRAY_AGG; S099 Array expressions; S111 ONLY in query expressions; S201 SQL-invoked routines on arrays; S203 Array parameters; S204 Array as result type of functions; S211 User-defined cast functions; S301 Enhanced UNNEST; S404 TRIM_ARRAY
- **T-series (122)**: T031 BOOLEAN data type; T054 GREATEST and LEAST [different null handling]; T055 String padding functions; T056 Multi-character TRIM functions; T061 UCS support; T071 BIGINT data type; T081 Optional string types maximum length; T121 WITH (excluding RECURSIVE) in query expression; T122 WITH (excluding RECURSIVE) in subquery; T131 Recursive query; T132 Recursive query in subquery; T133 Enhanced cycle mark values; T141 SIMILAR predicate; T151 DISTINCT predicate; T152 DISTINCT predicate with negation; T171 LIKE clause in table definition; T172 AS subquery clause in table definition; T173 Extended LIKE clause in table definition; T174 Identity columns; T177 Sequence generator support: simple restart option; T178 Identity columns: simple restart option; T191 Referential action RESTRICT; T201 Comparable data types for referential constraints; T212 Enhanced trigger capability; T213 INSTEAD OF triggers; T214 BEFORE triggers; T215 AFTER triggers; T216 Ability to require true search condition before trigger is invoked; T217 TRIGGER privilege; T241 START TRANSACTION statement; T261 Chained transactions; T271 Savepoints; T281 SELECT privilege with column granularity; T285 Enhanced derived column names; T312 OVERLAY function; T321-01 User-defined functions with no overloading (Core); T321-02 User-defined stored procedures with no overloading (Core); T321-03 Function invocation (Core); T321-04 CALL statement (Core); T321-05 RETURN statement (Core); T321-06 ROUTINES view (Core); T321-07 PARAMETERS view (Core); T323 Explicit security for external routines; T325 Qualified SQL parameter references; T331 Basic roles; T332 Extended roles; T341 Overloading of SQL-invoked functions and SQL-invoked procedures; T351 Bracketed comments; T431 Extended grouping capabilities; T432 Nested and concatenated GROUPING SETS; T433 Multi-argument GROUPING function; T434 GROUP BY DISTINCT; T441 ABS and MOD functions; T461 Symmetric BETWEEN predicate; T491 LATERAL derived table; T501 Enhanced EXISTS predicate; T521 Named arguments in CALL statement; T523 Default values for INOUT parameters of SQL-invoked procedures; T524 Named arguments in routine invocations other than a CALL statement; T525 Default values for parameters of SQL-invoked functions; T551 Optional key words for default syntax; T581 Regular expression substring function; T591 UNIQUE constraints of possibly null columns; T611 Elementary OLAP operations; T612 Advanced OLAP operations; T613 Sampling; T614 NTILE function; T615 LEAD and LAG functions; T617 FIRST_VALUE and LAST_VALUE functions; T620 WINDOW clause: GROUPS option; T621 Enhanced numeric functions; T622 Trigonometric functions; T623 General logarithm functions; T624 Common logarithm functions; T626 ANY_VALUE; T627 Window framed COUNT DISTINCT; T631 IN predicate with one list element (Core); T651 SQL-schema statements in SQL routines; T653 SQL-schema statements in external routines; T655 Cyclically dependent routines; T661 Non-decimal integer literals; T662 Underscores in numeric literals; T670 Schema and data statement mixing; T803 String-based JSON; T811 Basic SQL/JSON constructor functions; T812 SQL/JSON: JSON_OBJECTAGG; T813 SQL/JSON: JSON_ARRAYAGG with ORDER BY; T814 Colon in JSON_OBJECT or JSON_OBJECTAGG; T821 Basic SQL/JSON query operators; T822 SQL/JSON: IS JSON WITH UNIQUE KEYS predicate; T823 SQL/JSON: PASSING clause; T825 SQL/JSON: ON EMPTY and ON ERROR clauses; T826 General value expression in ON ERROR or ON EMPTY clauses; T827 JSON_TABLE: sibling NESTED COLUMNS clauses; T828 JSON_QUERY; T829 JSON_QUERY: array wrapper options; T830 Enforcing unique keys in SQL/JSON constructor functions; T831 SQL/JSON path language: strict mode; T832 SQL/JSON path language: item method; T833 SQL/JSON path language: multiple subscripts; T834 SQL/JSON path language: wildcard member accessor; T835 SQL/JSON path language: filter expressions; T836 SQL/JSON path language: starts with predicate; T837 SQL/JSON path language: regex_like predicate; T840 Hex integer literals in SQL/JSON path language; T851 SQL/JSON: optional keywords for default syntax; T865 SQL/JSON item method: bigint(); T866 SQL/JSON item method: boolean(); T867 SQL/JSON item method: date(); T868 SQL/JSON item method: decimal(); T869 SQL/JSON item method: decimal() with precision and scale; T870 SQL/JSON item method: integer(); T871 SQL/JSON item method: number(); T872 SQL/JSON item method: string(); T873 SQL/JSON item method: time(); T874 SQL/JSON item method: time_tz(); T875 SQL/JSON item method: time precision; T876 SQL/JSON item method: timestamp(); T877 SQL/JSON item method: timestamp_tz(); T878 SQL/JSON item method: timestamp precision; T879 JSON in equality operations [with jsonb]; T880 JSON in grouping operations [with jsonb]
- **X-series (48)**: X010 XML type; X011 Arrays of XML type; X014 Attributes of XML type; X016 Persistent XML values; X020 XMLConcat; X031 XMLElement; X032 XMLForest; X034 XMLAgg; X035 XMLAgg: ORDER BY option; X036 XMLComment; X037 XMLPI; X038 XMLText [supported except for RETURNING]; X040 Basic table mapping; X041 Basic table mapping: null absent; X042 Basic table mapping: null as nil; X043 Basic table mapping: table as forest; X044 Basic table mapping: table as element; X045 Basic table mapping: with target namespace; X046 Basic table mapping: data mapping; X047 Basic table mapping: metadata mapping; X048 Basic table mapping: base64 encoding of binary strings; X049 Basic table mapping: hex encoding of binary strings; X050 Advanced table mapping; X051 Advanced table mapping: null absent; X052 Advanced table mapping: null as nil; X053 Advanced table mapping: table as forest; X054 Advanced table mapping: table as element; X055 Advanced table mapping: with target namespace; X056 Advanced table mapping: data mapping; X057 Advanced table mapping: metadata mapping; X058 Advanced table mapping: base64 encoding of binary strings; X059 Advanced table mapping: hex encoding of binary strings; X060 XMLParse: character string input and CONTENT option; X061 XMLParse: character string input and DOCUMENT option; X069 XMLSerialize: INDENT; X070 XMLSerialize: character string serialization and CONTENT option; X071 XMLSerialize: character string serialization and DOCUMENT option; X072 XMLSerialize: character string serialization; X090 XML document predicate; X120 XML parameters in SQL routines; X121 XML parameters in external routines; X221 XML passing mechanism BY VALUE; X301 XMLTable: derived column list option; X302 XMLTable: ordinality column option; X303 XMLTable: column default option; X304 XMLTable: passing a context item [must be XML DOCUMENT]; X400 Name and identifier mapping; X410 Alter column data type: XML type

### D.2. Unsupported SQL:2023 features (complete)

- **B-series (41)**: B011 Embedded Ada; B013 Embedded COBOL; B014 Embedded Fortran; B015 Embedded MUMPS; B016 Embedded Pascal; B017 Embedded PL/I; B030 Enhanced dynamic SQL; B031 Basic dynamic SQL; B032 Extended dynamic SQL; B033 Untyped SQL-invoked function arguments; B034 Dynamic specification of cursor attributes; B035 Non-extended descriptor names; B036 Describe input statement; B041 Extensions to embedded SQL exception declarations; B051 Enhanced execution rights; B111 Module language Ada; B112 Module language C; B113 Module language COBOL; B114 Module language Fortran; B115 Module language MUMPS; B116 Module language Pascal; B117 Module language PL/I; B121 Routine language Ada; B122 Routine language C; B123 Routine language COBOL; B124 Routine language Fortran; B125 Routine language MUMPS; B126 Routine language Pascal; B127 Routine language PL/I; B200 Polymorphic table functions; B201 More than one PTF generic table parameter; B202 PTF copartitioning; B203 More than one copartition specification; B204 PRUNE WHEN EMPTY; B205 Pass-through columns; B206 PTF descriptor parameters; B207 Cross products of partitionings; B208 PTF component procedure interface; B209 PTF extended names; B211 Module language Ada: VARCHAR and NUMERIC support; B221 Routine language Ada: VARCHAR and NUMERIC support
- **F-series (34)**: F054 TIMESTAMP in DATE type precedence list; F120 Get diagnostics statement; F121 Basic diagnostics management; F122 Enhanced diagnostics management; F123 All diagnostics; F124 SET TRANSACTION statement: DIAGNOSTICS SIZE clause; F263 Comma-separated predicates in simple CASE expression; F291 UNIQUE predicate; F301 CORRESPONDING in query expressions; F403 Partitioned join tables; F451 Character set definition; F461 Named character sets; F521 Assertions; F671 Subqueries in CHECK constraints [intentionally omitted]; F673 Reads SQL-data routine invocations in CHECK constraints; F693 SQL-session and client module collations; F695 Translation support; F696 Additional translation documentation; F721 Deferrable constraints [foreign and unique keys only]; F741 Referential MATCH types [no partial match yet]; F812 Basic flagging; F813 Extended flagging; F821 Local table references; F831 Full cursor update; F832 Updatable scrollable cursors; F833 Updatable ordered cursors; F841 LIKE_REGEX predicate [consider regexp_like()]; F842 OCCURRENCES_REGEX function [consider regexp_matches()]; F843 POSITION_REGEX function [consider regexp_instr()]; F844 SUBSTRING_REGEX function [consider regexp_substr()]; F845 TRANSLATE_REGEX function [consider regexp_replace()]; F846 Octet support in regular expression operators; F847 Non-constant regular expressions; F866 FETCH FIRST clause: PERCENT option
- **R-series (3)**: R010 Row pattern recognition: FROM clause; R020 Row pattern recognition: WINDOW clause; R030 Row pattern recognition: full aggregate support
- **S-series (36)**: S011 Distinct data types (Core); S011-01 USER_DEFINED_TYPES view (Core); S023 Basic structured types; S024 Enhanced structured types; S025 Final structured types; S026 Self-referencing structured types; S027 Create method by specific method name; S028 Permutable UDT options list; S041 Basic reference types; S043 Enhanced reference types; S051 Create table of type [partially supported]; S081 Subtables; S091 Basic array support [partially supported]; S093 Arrays of distinct types; S094 Arrays of reference types; S097 Array element assignment; S151 Type predicate [see pg_typeof()]; S161 Subtype treatment; S162 Subtype treatment for references; S202 SQL-invoked routines on multisets; S231 Structured type locators; S232 Array locators; S233 Multiset locators; S241 Transform functions; S242 Alter transform statement; S251 User-defined orderings; S261 Specific type method; S271 Basic multiset support; S272 Multisets of user-defined types; S274 Multisets of reference types; S275 Advanced multiset support; S281 Nested collection types; S291 Unique constraint on entire row; S401 Distinct types based on array types; S402 Distinct types based on multiset types; S403 ARRAY_MAX_CARDINALITY
- **T-series (68)**: T011 Timestamp in Information Schema; T021 BINARY and VARBINARY data types; T022 Advanced support for BINARY and VARBINARY data types; T023 Compound binary literals; T024 Spaces in binary literals; T039 CLOB locator: non-holdable; T040 Concatenation of CLOBs; T041 Basic LOB data type support; T042 Extended LOB data type support; T043 Multiplier T; T044 Multiplier P; T045 BLOB data type; T046 CLOB data type; T047 POSITION, OCTET_LENGTH, TRIM, and SUBSTRING for BLOBs; T048 Concatenation of BLOBs; T049 BLOB locator: non-holdable; T050 POSITION, CHAR_LENGTH, OCTET_LENGTH, LOWER, TRIM, UPPER, and SUBSTRING for CLOBs; T051 Row types; T053 Explicit aliases for all-fields reference; T062 Character length units; T076 DECFLOAT data type; T101 Enhanced nullability determination; T111 Updatable joins, unions, and columns; T175 Generated columns [mostly supported]; T176 Sequence generator support [supported except for NEXT VALUE FOR]; T180 System-versioned tables; T181 Application-time period tables; T200 Trigger DDL [similar but not fully compatible]; T211 Basic trigger capability; T218 Multiple triggers for the same event executed in the order created [intentionally omitted]; T231 Sensitive cursors; T251 SET TRANSACTION statement: LOCAL option; T262 Multiple server transactions; T272 Enhanced savepoint management; T301 Functional dependencies [partially supported]; T321 Basic SQL-invoked routines (Core) [partially supported]; T322 Declared data type attributes; T324 Explicit security for SQL routines; T326 Table functions; T471 Result sets return value; T472 DESCRIBE CURSOR; T495 Combined data change and retrieval [different syntax]; T502 Period predicates; T511 Transaction counts; T522 Default values for IN parameters of SQL-invoked procedures [supported except DEFAULT key word in invocation]; T561 Holdable locators; T571 Array-returning external SQL-invoked functions; T572 Multiset-returning external SQL-invoked functions; T601 Local cursor references; T616 Null treatment option for LEAD and LAG functions; T618 NTH_VALUE function [function exists, but some options missing]; T619 Nested window functions; T625 LISTAGG; T641 Multiple column assignment [only some syntax variants supported]; T652 SQL-dynamic statements in SQL routines; T654 SQL-dynamic statements in external routines; T801 JSON data type; T802 Enhanced JSON data type; T824 JSON_TABLE: specific PLAN clause; T838 JSON_TABLE: PLAN DEFAULT clause; T839 Formatted cast of datetimes to/from character strings; T860 SQL/JSON simplified accessor: column reference only; T861 SQL/JSON simplified accessor: case-sensitive JSON member accessor; T862 SQL/JSON simplified accessor: wildcard member accessor; T863 SQL/JSON simplified accessor: single-quoted string literal as member accessor; T864 SQL/JSON simplified accessor; T881 JSON in ordering operations [with jsonb, partially supported]; T882 JSON in multiset element grouping operations
- **M-series (25)**: M001 Datalinks; M002 Datalinks via SQL/CLI; M003 Datalinks via Embedded SQL; M004 Foreign data support [partially supported]; M005 Foreign schema support; M006 GetSQLString routine; M007 TransmitRequest; M009 GetOpts and GetStatistics routines; M010 Foreign-data wrapper support [different API]; M011 Datalinks via Ada; M012 Datalinks via C; M013 Datalinks via COBOL; M014 Datalinks via Fortran; M015 Datalinks via M; M016 Datalinks via Pascal; M017 Datalinks via PL/I; M018 Foreign-data wrapper interface routines in Ada; M019 Foreign-data wrapper interface routines in C [different API]; M020 Foreign-data wrapper interface routines in COBOL; M021 Foreign-data wrapper interface routines in Fortran; M022 Foreign-data wrapper interface routines in MUMPS; M023 Foreign-data wrapper interface routines in Pascal; M024 Foreign-data wrapper interface routines in PL/I; M030 SQL-server foreign data support; M031 Foreign-data wrapper general routines
- **X-series (89)**: X012 Multisets of XML type; X013 Distinct types of XML type; X015 Fields of XML type; X025 XMLCast; X030 XMLDocument; X065 XMLParse: binary string input and CONTENT option; X066 XMLParse: binary string input and DOCUMENT option; X068 XMLSerialize: BOM; X073 XMLSerialize: binary string serialization and CONTENT option; X074 XMLSerialize: binary string serialization and DOCUMENT option; X075 XMLSerialize: binary string serialization; X076 XMLSerialize: VERSION; X077 XMLSerialize: explicit ENCODING option; X078 XMLSerialize: explicit XML declaration; X080 Namespaces in XML publishing; X081 Query-level XML namespace declarations; X082 XML namespace declarations in DML; X083 XML namespace declarations in DDL; X084 XML namespace declarations in compound statements; X085 Predefined namespace prefixes; X086 XML namespace declarations in XMLTable; X091 XML content predicate; X096 XMLExists [XPath 1.0 only]; X100 Host language support for XML: CONTENT option; X101 Host language support for XML: DOCUMENT option; X110 Host language support for XML: VARCHAR mapping; X111 Host language support for XML: CLOB mapping; X112 Host language support for XML: BLOB mapping; X113 Host language support for XML: STRIP WHITESPACE option; X114 Host language support for XML: PRESERVE WHITESPACE option; X131 Query-level XMLBINARY clause; X132 XMLBINARY clause in DML; X133 XMLBINARY clause in DDL; X134 XMLBINARY clause in compound statements; X135 XMLBINARY clause in subqueries; X141 IS VALID predicate: data-driven case; X142 IS VALID predicate: ACCORDING TO clause; X143 IS VALID predicate: ELEMENT clause; X144 IS VALID predicate: schema location; X145 IS VALID predicate outside check constraints; X151 IS VALID predicate: with DOCUMENT option; X152 IS VALID predicate: with CONTENT option; X153 IS VALID predicate: with SEQUENCE option; X155 IS VALID predicate: NAMESPACE without ELEMENT clause; X157 IS VALID predicate: NO NAMESPACE with ELEMENT clause; X160 Basic Information Schema for registered XML schemas; X161 Advanced Information Schema for registered XML schemas; X170 XML null handling options; X171 NIL ON NO CONTENT option; X181 XML(DOCUMENT(UNTYPED)) type; X182 XML(DOCUMENT(ANY)) type; X190 XML(SEQUENCE) type; X191 XML(DOCUMENT(XMLSCHEMA)) type; X192 XML(CONTENT(XMLSCHEMA)) type; X200 XMLQuery; X201 XMLQuery: RETURNING CONTENT; X202 XMLQuery: RETURNING SEQUENCE; X203 XMLQuery: passing a context item; X204 XMLQuery: initializing an XQuery variable; X205 XMLQuery: EMPTY ON EMPTY option; X206 XMLQuery: NULL ON EMPTY option; X211 XML 1.1 support; X222 XML passing mechanism BY REF [parser accepts BY REF but ignores it; passing is always BY VALUE]; X231 XML(CONTENT(UNTYPED)) type; X232 XML(CONTENT(ANY)) type; X241 RETURNING CONTENT in XML publishing; X242 RETURNING SEQUENCE in XML publishing; X251 Persistent XML values of XML(DOCUMENT(UNTYPED)) type; X252 Persistent XML values of XML(DOCUMENT(ANY)) type; X253 Persistent XML values of XML(CONTENT(UNTYPED)) type; X254 Persistent XML values of XML(CONTENT(ANY)) type; X255 Persistent XML values of XML(SEQUENCE) type; X256 Persistent XML values of XML(DOCUMENT(XMLSCHEMA)) type; X257 Persistent XML values of XML(CONTENT(XMLSCHEMA)) type; X260 XML type: ELEMENT clause; X261 XML type: NAMESPACE without ELEMENT clause; X263 XML type: NO NAMESPACE with ELEMENT clause; X264 XML type: schema location; X271 XMLValidate: data-driven case; X272 XMLValidate: ACCORDING TO clause; X273 XMLValidate: ELEMENT clause; X274 XMLValidate: schema location; X281 XMLValidate with DOCUMENT option; X282 XMLValidate with CONTENT option; X283 XMLValidate with SEQUENCE option; X284 XMLValidate: NAMESPACE without ELEMENT clause; X286 XMLValidate: NO NAMESPACE with ELEMENT clause; X300 XMLTable [XPath 1.0 only]; X305 XMLTable: initializing an XQuery variable

## Lesson ideas

### Visualizers
- **SQLSTATE decoder** [M1, M3, M5]: type or click a 5-character code; split it into class (2 chars) and condition (3 chars), show the class name, mark `xx000` as class-generic, and show whether PL/pgSQL can catch it by condition name (it cannot for classes 00/01/02). Highlight the retry-worthy class 40 codes (`40001`, `40P01`) next to the class 23 integrity codes. Source: Table A.1.
- **Date-input token classifier** [M2]: animate B.1 on an input string such as `'990118 1415'` or `'January 8, 99 BC'`: tokenise, tag each token (time / date / number / string), apply the numeric rules in order (8 or 6 digits → concatenated date; 3 digits after a year → day of year; ...), then apply the BC rule (negate and add one) and the two-digit-year pivot (<70 → +2000, else +1900).
- **DST gap/overlap timeline** [M2]: a New York clock on 2018-03-11 and 2018-11-04 showing the missing 02:00–03:00 hour and the repeated 01:00–02:00 hour; drop a timestamp in and show which UTC offset the B.2 rule picks ("standard time preferred when in doubt").
- **POSIX TZ string builder** [M2]: assemble `CET-1CEST,M3.5.0,M10.5.0/3` field by field, with a warning banner that the POSIX sign convention (positive = west) is the reverse of ISO-8601.
- **Limits calculator** [M2]: choose a column type and count; fill an 8192-byte page bar. 1,600 `int` = 6400 bytes fits; 1,600 `bigint` = 12800 bytes overflows. Toggle "TOASTed" on a text column to shrink it to an 18-byte pointer; drop columns and watch them still count toward 1,600 and still take null-bitmap space. Source: Appendix K.
- **XID + epoch odometer** [M7]: a 32-bit counter that wraps from its maximum back to 3 (0–2 reserved) and bumps a 32-bit epoch; show the combined 64-bit value. Source: glossary "Transaction ID".
- **Instance process map** [M1]: postmaster at the root; auxiliary processes exactly as the glossary lists them (autovacuum launcher, background writer, checkpointer, logger, startup, WAL archiver, WAL receiver, WAL summarizer, WAL writer); backends, autovacuum workers, background workers and WAL senders drawn as *not* auxiliary. Click a node for its glossary definition.
- **Version 18 "what changed" board** [all]: cards for each overview feature and each incompatibility from E.7, each linking to the module lesson that uses it (AIO → M1/M4, skip scan → M4, virtual generated columns → M2, OLD/NEW RETURNING → M3, checksums default → M2/M7).
- **Buffer access strategy ring** [M1, M4]: a sequential scan of a large table cycling through a small ring of buffers instead of flushing shared_buffers (glossary "Buffer Access Strategy").

### Playground SQL (PGlite, PostgreSQL 18)
```sql
-- SQLSTATE 23505 and catching it by condition name
CREATE TABLE t (id int PRIMARY KEY);
INSERT INTO t VALUES (1);
DO $$ BEGIN INSERT INTO t VALUES (1);
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'caught %', SQLSTATE; END $$;

-- v18: RESTRICT violations report 23001, NO ACTION still 23503
CREATE TABLE p (id int PRIMARY KEY);
CREATE TABLE c_restrict (pid int REFERENCES p ON DELETE RESTRICT);
CREATE TABLE c_noaction (pid int REFERENCES p);
INSERT INTO p VALUES (1), (2);
INSERT INTO c_restrict VALUES (1); INSERT INTO c_noaction VALUES (2);
DO $$ BEGIN DELETE FROM p WHERE id = 1;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'restrict: %', SQLSTATE; END $$;
DO $$ BEGIN DELETE FROM p WHERE id = 2;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'no action: %', SQLSTATE; END $$;

-- other codes
SELECT 1/0;                         -- 22012 division_by_zero
SELECT 'abc'::int;                  -- 22P02 invalid_text_representation
SELECT 55 AS CHECK;                 -- reserved key word allowed as column label
SELECT 1 CHECK;                     -- error: reserved word needs AS

-- v18 functions and syntax from E.7
SELECT uuidv7(), uuidv4();
SELECT array_sort(ARRAY[3,1,2]), array_reverse(ARRAY[1,2,3]), casefold('Straße');
CREATE TABLE g (a int, b int GENERATED ALWAYS AS (a * 2));        -- virtual by default
CREATE TABLE gs (a int, b int GENERATED ALWAYS AS (a * 2) STORED);
INSERT INTO g VALUES (1) RETURNING old.a, new.a, new.b;
UPDATE g SET a = 5 RETURNING old.b AS before, new.b AS after;
EXPLAIN ANALYZE SELECT * FROM g;                                   -- BUFFERS shown automatically

-- v18 temporal and NOT ENFORCED constraints (range column last; btree_gist needed for the int part)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE booking (room int, during tstzrange,
  PRIMARY KEY (room, during WITHOUT OVERLAPS));
CREATE TABLE chk (x int CHECK (x > 0) NOT ENFORCED);
INSERT INTO chk VALUES (-1);                                       -- accepted
SELECT conname, conenforced FROM pg_constraint WHERE conrelid = 'chk'::regclass;
-- v18: NOT NULL constraints are rows in pg_constraint (contype 'n')
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'booking'::regclass;

-- Appendix B examples
SET TimeZone = 'America/New_York';
SELECT '2018-03-11 02:30'::timestamptz, '2018-11-04 01:30'::timestamptz,
       '2018-11-04 01:30 EDT'::timestamptz;
SELECT extract(julian from '2021-06-23 8:00:00-04'::timestamptz at time zone 'UTC+12');
SELECT '19990113'::date, '0099-01-01'::date, '99-01-01'::date, date '0001-01-01 BC';
SET TIMEZONE TO FOOBAR0; SELECT now();                             -- the B.5 pitfall
RESET TimeZone;

-- limits: 1,600 columns and the 8 kB page (Appendix K)
DO $$ BEGIN EXECUTE 'CREATE TABLE wide (' ||
  (SELECT string_agg('c'||i||' bigint', ',') FROM generate_series(1,1600) i) || ')'; END $$;
INSERT INTO wide (c1) VALUES (1);   -- fits: other columns are NULL
-- filling all 1,600 bigint columns would need 12800 bytes and fail

-- 18.6 and 18.7 diagnostic queries, verbatim from the release notes
SELECT DISTINCT t.oid::regclass, t.reltuples
FROM pg_class t JOIN pg_index i ON t.oid = i.indrelid
  JOIN pg_class ic ON i.indexrelid = ic.oid
WHERE t.relhasindex AND ic.relam = 2742;
SELECT conrelid::regclass, conname FROM pg_constraint
WHERE contype = 'n' AND connoinherit
  AND conrelid IN (SELECT oid FROM pg_class WHERE relkind = 'p');
```
(The `SELECT 1 CHECK` error, the exact `casefold` output, and the success of the 1,600-column table in PGlite are expectations to check in the playground, not doc-quoted outputs.)

### Pitfalls the docs warn about, with the documented fix
- **Matching on error text** instead of the SQLSTATE: text can change between releases and is localized. Fix: test the code; use the separate object-name fields (full coverage only for class 23).
- **POSIX offset sign**: positive means west of Greenwich, the opposite of ISO-8601. Misspelled specs such as `FOOBAR0` are accepted silently. Fix: prefer IANA zone names.
- **Abbreviation shadowing**: with the `Australia` abbreviation file, `SAT` is no longer Saturday. **Backups**: `share/timezonesets/` is not included in dumps. Fix: back it up yourself.
- **DST gaps and overlaps are not errors**: the offset is inferred. Fix: give an explicit offset or a fixed-offset abbreviation (e.g. `EDT`).
- **Two-digit years** pivot at 70. Fix: use 4 digits (`0099` for AD 99).
- **Hitting the column limit with dropped columns**: they still count toward 1,600 and occupy null-bitmap space. **Wide fixed-width rows** may not fit a page even under 1,600 columns.
- **TOAST OID exhaustion**: at most 2^32 out-of-line values per table, and inserts slow as the OID space fills. Fix: partitioning.
- **Leftover `recovery.conf`**: the server will not start. Fix: set the parameters in `postgresql.conf` or via `ALTER SYSTEM`, use `standby.signal`, and promote with `pg_ctl promote` or `pg_promote()`.
- **Upgrading to 18**:
  - pg_upgrade needs matching checksum settings. Fix: `initdb --no-data-checksums` for the new cluster if the old one had none.
  - Clusters with an ICU or builtin default provider should reindex full-text-search and pg_trgm indexes.
  - Primary/foreign key collation mismatches block restore. Fix: change the schema first.
  - Extended statistics are not carried over. Fix: run ANALYZE.
- **COPY CSV `\.`** is no longer end-of-file on the server, and old psql clients may mishandle `\copy`. Scripts that intentionally fail `COPY FROM STDIN` need a `\.` line (18.6).
- **VACUUM/ANALYZE on inheritance parents** now recurses into children. Fix: `ONLY` gives the old behaviour.
- **MD5 passwords** are deprecated and warn. Fix: migrate to SCRAM. The warnings can be silenced with `md5_password_warnings = off`.
- **Minor-release actions**:
  - 18.7 REINDEX list: `bpchar` btree, GIN, TOAST-table indexes, `gist_trgm_ops`.
  - 18.7: take a new full backup before further incremental backups.
  - 18.6: add non-core decoding plugins to `output_plugin_libraries`, and check `reltuples` on tables with GIN indexes.
  - 18.2: reindex `ltree` indexes.
  - 18.3: manual `pg_proc` fix for `json[b]_strip_nulls` volatility.
- **vacuumlo**: too many large-object removals in one transaction can exceed `max_locks_per_transaction`. Fix: `-l` (default 1000). Domains over `oid` or `lo` are not scanned.
- **oid2name** needs intact catalogs, so it is of limited use in corruption recovery. Do not confuse table OIDs with filenodes.
