# Slice B — Part II: ch.8 Data Types, ch.10 Type Conversion, ch.11 Indexes, ch.12 Full Text Search, ch.13 Concurrency Control, ch.14 Performance Tips, ch.15 Parallel Query (PostgreSQL 18 docs)

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 66 | datatype.txt | Ch.8 TOC + Table 8.1: all built-in general-purpose types with aliases; SQL-standard subset; I/O functions not always invertible |
| 67 | datatype-numeric.txt | smallint/integer/bigint, numeric/decimal (precision, scale, negative scale, NaN/Infinity, storage), real/double (IEEE 754, extra_float_digits), serial pseudo-types |
| 68 | datatype-money.txt | money: 8 bytes, lc_monetary-dependent fractional precision, casting rules, division semantics |
| 69 | datatype-character.txt | varchar(n)/char(n)/bpchar/text semantics, padding, 1-byte vs 4-byte header, 1 GB limit, `"char"` and `name` internal types |
| 70 | datatype-binary.txt | bytea: hex vs escape formats, bytea_output, escape tables |
| 71 | datatype-datetime.txt | timestamp/timestamptz/date/time/timetz/interval sizes+ranges, input formats, special values, DateStyle, time zones, interval internal (months, days, microseconds), IntervalStyle |
| 72 | datatype-boolean.txt | boolean: 1 byte, accepted input literals, output t/f |
| 73 | datatype-enum.txt | enums: CREATE TYPE AS ENUM, ordering = declaration order, type safety, 4 bytes on disk, pg_enum, labels <= 63 bytes |
| 74 | datatype-geometric.txt | point/line/lseg/box/path/polygon/circle sizes and input/output syntaxes |
| 75 | datatype-net-types.txt | inet/cidr (7 or 19 bytes), macaddr (6), macaddr8 (8), input rules, inet vs cidr |
| 76 | datatype-bit.txt | bit(n)/bit varying(n): exact-length vs max-length, cast truncation/padding, storage overhead |
| 77 | datatype-textsearch.txt | tsvector (sorted distinct lexemes, positions 1..16383, weights A-D) and tsquery (& | ! <-> <N>, weights, prefix :*) |
| 78 | datatype-uuid.txt | uuid: 128-bit, RFC 9562, native generation of UUIDv4 and UUIDv7, accepted input forms |
| 79 | datatype-xml.txt | xml type: XMLPARSE/XMLSERIALIZE, xmloption, encoding handling, no comparison operators so no direct index |
| 80 | datatype-json.txt | json vs jsonb, primitive mapping, containment/existence, GIN jsonb_ops vs jsonb_path_ops, btree ordering, subscripting, transforms, jsonpath |
| 81 | arrays.txt | array declaration, literals, subscripts/slices, modification, concatenation, searching, I/O syntax |
| 82 | rowtypes.txt | composite types: declaration, ROW constructor, field access, .* expansion rules, functional notation, I/O syntax |
| 83 | rangetypes.txt | range and multirange types, bounds, canonical form, CREATE TYPE AS RANGE, GiST/SP-GiST indexing, exclusion constraints |
| 84 | domains.txt | CREATE DOMAIN, CHECK (VALUE ...), automatic down-cast to the underlying type |
| 85 | datatype-oid.txt | oid (unsigned 4-byte) and reg* alias types, early/late binding, dependencies; xid, xid8, cid, tid |
| 86 | datatype-pg-lsn.txt | pg_lsn: 64-bit WAL byte position, text format, arithmetic operators |
| 87 | datatype-pseudo.txt | Table 8.27 pseudo-types list and rules for internal |
| 120 | typeconv.txt | Ch.10 intro and TOC |
| 121 | typeconv-overview.txt | parser lexical categories, unknown type, four conversion contexts, type categories and preferred types, design principles |
| 122 | typeconv-oper.txt | operator type resolution algorithm (steps 1-3.f) with examples and domain-operator pitfall |
| 123 | typeconv-func.txt | function type resolution algorithm, VARIADIC and default-argument hazards, function-style casts, examples |
| 124 | typeconv-query.txt | value storage conversion: assignment casts, sizing casts with atttypmod |
| 125 | typeconv-union-case.txt | common-type resolution for UNION/CASE/ARRAY/VALUES/GREATEST/LEAST; pairwise nested UNION pitfall |
| 126 | typeconv-select.txt | unknown literals in SELECT output resolve to text (since PG 10) |
| 127 | indexes.txt | Ch.11 intro and TOC |
| 128 | indexes-intro.txt | what an index is, CREATE/DROP INDEX, indexable clause form, build blocks writes, maintenance overhead and HOT |
| 129 | indexes-types.txt | B-tree, Hash, GiST, SP-GiST, GIN, BRIN (plus bloom extension): operators each supports |
| 130 | indexes-multicolumn.txt | multicolumn rules per AM, 32-column limit, B-tree leading-column rule and PG18 skip scan |
| 131 | indexes-ordering.txt | B-tree sorted output, ASC/DESC/NULLS FIRST/LAST, ORDER BY + LIMIT |
| 132 | indexes-bitmap-scans.txt | combining indexes with in-memory bitmaps (AND/OR), loss of ordering, index design trade-offs |
| 133 | indexes-unique.txt | unique indexes (B-tree only), NULLS [NOT] DISTINCT, auto-created for PK/UNIQUE |
| 134 | indexes-expressional.txt | expression indexes, syntax, maintenance cost |
| 135 | indexes-partial.txt | partial indexes: four uses, predicate implication rules, anti-pattern vs partitioning |
| 136 | indexes-index-only-scans.txt | index-only scans, visibility map dependence, INCLUDE covering indexes, suffix truncation, expression/partial interactions |
| 137 | indexes-opclass.txt | operator classes and families, *_pattern_ops, catalog queries, psql \dAc \dAf \dAo |
| 138 | indexes-collations.txt | one collation per index column; extra index for other collations |
| 139 | indexes-examine.txt | tips for examining index usage: ANALYZE first, real data, enable_* switches, cost vs selectivity errors |
| 140 | textsearch.txt | Ch.12 TOC |
| 141 | textsearch-intro.txt | FTS rationale, tokens vs lexemes, documents, @@ operator and variants, phrase operators, configurations and the four object types |
| 142 | textsearch-tables.txt | searching tables, GIN expression indexes (2-arg to_tsvector rule), stored generated tsvector column |
| 143 | textsearch-controls.txt | to_tsvector, setweight, to_tsquery/plainto/phraseto/websearch_to_tsquery, ts_rank/ts_rank_cd weights and normalization flags, ts_headline options |
| 144 | textsearch-features.txt | tsvector/tsquery manipulation operators and functions, ts_rewrite, update triggers (obsolete), ts_stat |
| 145 | textsearch-parsers.txt | default parser pg_catalog.default and its 23 token types, overlapping tokens |
| 146 | textsearch-dictionaries.txt | dictionary contract, stop words, simple/synonym/thesaurus/ispell/snowball templates with parameters and files |
| 147 | textsearch-configuration.txt | worked example building configuration public.pg |
| 148 | textsearch-debugging.txt | ts_debug, ts_parse, ts_token_type (tokid table), ts_lexize |
| 149 | textsearch-indexes.txt | GIN vs GiST for FTS, GiST signature siglen (default 124, max 2024 bytes), lossiness, maintenance_work_mem |
| 150 | textsearch-psql.txt | psql \dF, \dFd, \dFp, \dFt with listings of built-in dictionaries and templates |
| 151 | textsearch-limitations.txt | FTS hard limits (lexeme < 2 kB, 256 positions, position <= 16383, tsvector < 1 MB, distance <= 16384) |
| 152 | mvcc.txt | Ch.13 intro and TOC |
| 153 | mvcc-intro.txt | MVCC: statements see snapshots; readers never block writers and vice versa; SSI; explicit and advisory locks exist |
| 154 | transaction-iso.txt | four phenomena, Table 13.1, Read Committed / Repeatable Read / Serializable behavior in detail, predicate locks (SIReadLock), SSI tuning |
| 155 | explicit-locking.txt | 8 table lock modes with acquiring commands, Table 13.2 conflicts, 4 row lock modes, Table 13.3, page locks, deadlocks, advisory locks |
| 156 | applevel-consistency.txt | enforcing consistency via Serializable or via explicit blocking locks; snapshot vs lock timing in Repeatable Read |
| 157 | mvcc-serialization-failure-handling.txt | SQLSTATEs 40001, 40P01, 23505, 23P01 and retry rules |
| 158 | mvcc-caveats.txt | TRUNCATE / rewriting ALTER TABLE not MVCC-safe; no Serializable on hot standby; catalog access ignores isolation level |
| 159 | locking-indexes.txt | per-index-AM locking: B-tree/GiST/SP-GiST page locks, hash bucket locks, GIN page locks |
| 160 | performance-tips.txt | Ch.14 intro and TOC |
| 161 | using-explain.txt | EXPLAIN anatomy (cost pair, rows, width), cost formula, scan/join/sort node walkthrough, subplans/initplans, EXPLAIN ANALYZE fields, BUFFERS, Index Searches, caveats |
| 162 | planner-stats.txt | pg_class reltuples/relpages, pg_statistic vs pg_stats, default_statistics_target (100), extended statistics: dependencies, ndistinct, mcv |
| 163 | explicit-joins.txt | join order search, geqo_threshold, outer-join constraints, join_collapse_limit, from_collapse_limit |
| 164 | populate.txt | bulk-load tips: single transaction, COPY, drop indexes/FKs, maintenance_work_mem, max_wal_size, wal_level minimal, ANALYZE, pg_dump/pg_restore notes |
| 165 | non-durability.txt | non-durable settings: RAM disk, fsync, synchronous_commit, full_page_writes, checkpoints, unlogged tables |
| 166 | parallel-query.txt | Ch.15 intro: which queries benefit from parallel query |
| 167 | how-parallel-query-works.txt | Gather / Gather Merge, worker limits, leader's dual role |
| 168 | when-can-parallel-query-be-used.txt | settings and query properties that prevent parallel plans; run-time fallback to serial |
| 169 | parallel-plans.txt | partial plans; parallel seq/bitmap/index scans; parallel joins; Partial/Finalize Aggregate; Parallel Append; tips |
| 170 | parallel-safety.txt | parallel safe / restricted / unsafe; always-restricted operations; labeling functions and aggregates |

## Notes by topic

### Data type overview  [M2]  (source: datatype.txt)
- Users add types with `CREATE TYPE`. Table 8.1 lists the general-purpose built-ins (full list in "Complete inventories" below). Most "alias" names (int8, int4, float8, bool, varbit, timestamptz, timetz ...) are the internal names used for historical reasons.
- SQL-standard types (or spellings): bigint, bit, bit varying, boolean, char, character varying, character, varchar, date, double precision, integer, interval, numeric, decimal, real, smallint, time (with/without time zone), timestamp (with/without time zone), xml.
- Each type has an external representation determined by its input and output functions. Some I/O functions are not invertible: output may lose accuracy relative to the original input.

### Integer types  [M2]  (source: datatype-numeric.txt)
- `smallint` (int2): 2 bytes, -32768 .. +32767. `integer` (int, int4): 4 bytes, -2147483648 .. +2147483647. `bigint` (int8): 8 bytes, -9223372036854775808 .. +9223372036854775807.
- Out-of-range store attempts raise an error (no silent wraparound).
- `integer` is "the common choice" (best balance of range, storage size, performance); `smallint` only when disk space is at a premium; `bigint` when integer range is insufficient.
- SQL only specifies integer/int, smallint, bigint; int2/int4/int8 are extensions.

### numeric / decimal  [M2]  (source: datatype-numeric.txt)
- Variable storage; up to 131072 digits before the decimal point, up to 16383 digits after. `decimal` and `numeric` are equivalent; both SQL standard.
- Exact results for addition, subtraction, multiplication; "very slow compared to the integer types, or to the floating-point types". Recommended for monetary amounts.
- Precision = total count of significant digits (both sides of the decimal point); scale = count of decimal digits in the fractional part. 23.5141 has precision 6, scale 4.
- Declarations: `NUMERIC(precision, scale)`; `NUMERIC(precision)` => scale 0; bare `NUMERIC` => "unconstrained numeric": any length up to implementation limits, input NOT coerced to any scale. (SQL standard would require default scale 0; PostgreSQL deliberately deviates.)
- Max precision that can be explicitly declared: 1000. Scale may be declared in the range -1000 .. 1000 (SQL standard requires 0..precision).
- Storing a value with more fractional digits than the declared scale: rounded. Then if digits left of the decimal point exceed precision - scale: error. `NUMERIC(3,1)` holds -99.9 .. 99.9.
- Negative scale (since PG 15): `NUMERIC(2,-3)` rounds to nearest thousand, holds -99000 .. 99000. Scale > precision: `NUMERIC(3,5)` rounds to 5 decimals, holds -0.00999 .. 0.00999.
- Physical storage: no extra leading/trailing zeroes; declared precision/scale are maximums, not fixed allocations (akin to varchar(n), not char(n)). "The actual storage requirement is two bytes for each group of four decimal digits, plus three to eight bytes overhead."
- Special values `Infinity`, `-Infinity`, `NaN` (must be quoted in SQL: `'-Infinity'`; case-insensitive; also `inf`, `-inf`). Infinity + finite = Infinity; Infinity - Infinity = NaN. Infinity can only be stored in an unconstrained numeric column.
- NaN: any operation with NaN input yields NaN, except when the result would be the same for any finite/infinite replacement value (e.g. NaN ^ 0 = 1).
- Sorting/indexing: PostgreSQL treats NaN values as equal to each other and greater than all non-NaN values (differs from IEEE semantics) so they can be sorted and used in tree-based indexes. Same rule for float types.
- Rounding: numeric rounds ties away from zero; real/double precision round ties to nearest even (on most machines). `round(2.5::numeric)` = 3, `round(2.5::double precision)` = 2; `round(-0.5::float8)` = -0.

### Floating point  [M2]  (source: datatype-numeric.txt)
- `real` (float4): 4 bytes, range around 1E-37 .. 1E+37, at least 6 decimal digits precision. `double precision` (float8, float): 8 bytes, around 1E-307 .. 1E+308, at least 15 digits. IEEE 754 binary floating point on all supported platforms.
- Too large/small => error. Too many input digits => rounding. Numbers too close to zero that are not representable as distinct from zero => underflow error.
- Default text output is "shortest precise" decimal representation: at most 17 significant digits for float8, at most 9 for float4; never exactly midway between two representable values. Much faster to generate than the historical rounded format.
- `extra_float_digits`: value 0 restores old rounding to 6 (float4) / 15 (float8) significant digits; negative reduces further (-2 => 4 / 13 digits); any value > 0 selects shortest-precise. Apps wanting precise values historically set it to 3 and should keep doing so for cross-version compatibility.
- Special values Infinity, -Infinity, NaN (quoted, case-insensitive, `inf`/`-inf`).
- `float(p)`: p = minimum precision in binary digits. float(1)..float(24) => real; float(25)..float(53) => double precision; out of range => error; bare `float` => double precision.
- Advice: use numeric for exact storage; equality comparison of floats "might not always work as expected".

### Serial types  [M2, M1]  (source: datatype-numeric.txt)
- `smallserial` (serial2): 2 bytes, 1..32767; `serial` (serial4): 4 bytes, 1..2147483647; `bigserial` (serial8): 8 bytes, 1..9223372036854775807.
- Not true types; notational convenience. `colname SERIAL` is equivalent to:
  1. `CREATE SEQUENCE tablename_colname_seq AS integer;`
  2. column `integer NOT NULL DEFAULT nextval('tablename_colname_seq')`
  3. `ALTER SEQUENCE tablename_colname_seq OWNED BY tablename.colname;`
- NOT NULL is applied; UNIQUE / PRIMARY KEY is NOT automatic.
- Gaps: a value allocated from the sequence is "used up" even if the row is never successfully inserted (e.g. transaction rollback).
- Insert next value by omitting the column or using the `DEFAULT` key word.
- Dropping the column drops the owned sequence; dropping the sequence alone forces removal of the column default expression.
- The SQL-standard alternative is identity columns (docs section 5.3). Use bigserial if more than 2^31 identifiers are anticipated over the table lifetime.

### money  [M2]  (source: datatype-money.txt)
- 8 bytes; range -92233720368547758.08 .. +92233720368547758.07 (assuming two fractional digits). Fractional precision is determined by the database's `lc_monetary`.
- Input: integer and floating-point literals and currency formatting like `'$1,000.00'`; output is locale dependent.
- Pitfall: output is locale-sensitive so loading a dump into a database with different `lc_monetary` may not work; make lc_monetary equivalent before restoring.
- numeric, int, bigint can be cast to money. real/double must go through numeric (`'12.34'::float8::numeric::money`), not recommended. money -> numeric is lossless; to other types go via numeric (`'52093.89'::money::numeric::float8`).
- money / integer truncates the fractional part toward zero; for rounding divide by a float or cast to numeric and back (preferred). money / money = double precision (units cancel).

### Character types  [M2]  (source: datatype-character.txt)
- `character varying(n)` / `varchar(n)`: variable-length with limit. `character(n)` / `char(n)` / `bpchar(n)`: fixed-length, blank-padded. `bpchar` (no length): variable unlimited length, blank-trimmed (trailing spaces semantically insignificant). `text`: variable unlimited length.
- n counts characters, not bytes. n must be > 0 and <= 10,485,760. `varchar` without length = any length. `character` / `char` without length = `character(1)`.
- Storing an over-length string is an error, unless the excess characters are all spaces (then truncated to max length — SQL standard requirement). An explicit cast to varchar(n)/char(n) silently truncates to n characters (also per standard).
- `character` values are physically padded with spaces to width n and stored and displayed that way; trailing spaces are disregarded when comparing two character values and removed when converting to other string types. Trailing spaces ARE significant in varchar and text, and in LIKE / regular expressions. Oddity: `SELECT 'a '::CHAR(2) collate "C" < E'a\n'::CHAR(2)` returns true.
- text is the native string type: most built-in string functions take/return text. varchar acts "as though it were a domain over text".
- Character with code zero (NUL) cannot be stored in any of these, regardless of the database character set.
- Storage: short string (up to 126 bytes) = 1 byte header + string (including padding for character). Longer strings have 4 bytes of overhead instead of 1. Long strings are compressed automatically; very long values are stored in background (TOAST) tables. Longest possible character string is about 1 GB.
- Tip: no performance difference among the three types apart from extra storage for blank-padded and a few CPU cycles to check length; `character(n)` is usually the slowest. Use text or varchar.
- Special internal types (Table 8.5): `"char"` (with quotes) 1 byte, single-byte internal type, stores only a single ASCII character, used in system catalogs as a simplistic enumeration type; `name` 64 bytes (63 usable characters plus terminator), constant `NAMEDATALEN` in C, set at compile time, used for identifiers.

### bytea  [M2]  (source: datatype-binary.txt)
- Storage: 1 or 4 bytes plus the actual binary string. Allows zero octets and non-printable octets; operations process actual bytes, independent of locale.
- Two I/O formats, both always accepted on input: "hex" and historical "escape". Output governed by `bytea_output` (default `hex`; hex introduced in 9.0).
- Hex: `\x` followed by 2 hex digits per byte, most significant nibble first; hex digits may be upper or lower case; whitespace allowed between digit pairs (not within a pair nor in the `\x`). Faster to convert; preferred. `SELECT '\xDEADBEEF'::bytea;` => `\xdeadbeef`.
- Escape input: octets that MUST be escaped: 0 (`'\000'`), 39 single quote (`''''` or `'\047'`), 92 backslash (`'\\'` or `'\134'`), 0..31 and 127..255 (`'\xxx'` octal). Escape output: backslash => `\\`; 0..31 and 127..255 => `\xxx` octal; 32..126 => client character set representation.
- SQL standard's BLOB / BINARY LARGE OBJECT is a different type with a different input format; functions/operators mostly the same.

### Date/time types  [M2]  (source: datatype-datetime.txt)
- Sizes/ranges/resolution (Table 8.9):
  - `timestamp [(p)] [without time zone]`: 8 bytes, 4713 BC .. 294276 AD, 1 microsecond.
  - `timestamp [(p)] with time zone` (timestamptz): 8 bytes, 4713 BC .. 294276 AD, 1 microsecond.
  - `date`: 4 bytes, 4713 BC .. 5874897 AD, 1 day.
  - `time [(p)] [without time zone]`: 8 bytes, 00:00:00 .. 24:00:00, 1 microsecond.
  - `time [(p)] with time zone` (timetz): 12 bytes, 00:00:00+1559 .. 24:00:00-1559, 1 microsecond.
  - `interval [fields] [(p)]`: 16 bytes, -178000000 years .. 178000000 years, 1 microsecond.
- Dates are counted per the Gregorian calendar even before it was introduced. p = fractional seconds digits, 0..6; default no explicit bound.
- interval `fields` restriction phrases: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, YEAR TO MONTH, DAY TO HOUR, DAY TO MINUTE, DAY TO SECOND, HOUR TO MINUTE, HOUR TO SECOND, MINUTE TO SECOND. If both fields and p are given, fields must include SECOND.
- `time with time zone` is of "questionable usefulness"; not recommended.
- Input: ISO 8601, SQL-compatible, traditional POSTGRES, others. `DateStyle` MDY / DMY / YMD resolves ambiguous field order. Literal syntax `type [(p)] 'value'`. `1999-01-08` ISO is the recommended format. `01/02/03` = Jan 2 2003 (MDY), Feb 1 2003 (DMY), Feb 3 2001 (YMD). `J2451187` Julian date; `1999.008` year and day of year.
- time input: time zone in a `time without time zone` input is silently ignored. `04:05 PM` = 16:05. Zone forms: abbreviation (PST), full name (America/New_York), POSIX (PST8PDT), offsets (-8:00:00, -8:00, -800, -8), `zulu`, `z`.
- Literal typing pitfall: PostgreSQL never examines the content of a literal string before determining its type, so `TIMESTAMP '2004-10-19 10:23:54+02'` is a timestamp WITHOUT time zone and the +02 is silently ignored. Use `TIMESTAMP WITH TIME ZONE '...'`.
- timestamptz semantics: input with explicit zone is converted to UTC; without zone it is assumed to be in the `TimeZone` setting and converted to UTC. "the value is stored internally as UTC, and the originally stated or assumed time zone is not retained." On output it is always converted from UTC to the current `timezone` and shown as local time. Use `AT TIME ZONE` to see another zone or to convert between timestamp and timestamptz.
- Special input values (Table 8.13): `epoch` (date, timestamp; 1970-01-01 00:00:00+00), `infinity` and `-infinity` (date, timestamp, interval), `now` (date, time, timestamp; current transaction's start time), `today`, `tomorrow`, `yesterday` (date, timestamp; midnight), `allballs` (time; 00:00:00.00 UTC). Only infinity/-infinity are stored specially; the others are converted to ordinary values when read.
- Caution: `'now'`, `'today'`, `'tomorrow'`, `'yesterday'` in prepared statements, views, function definitions can be frozen to a stale value. Use `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_TIMESTAMP`, `LOCALTIME`, `LOCALTIMESTAMP` (e.g. `CURRENT_DATE + 1` rather than `'tomorrow'::date`).
- Output styles (`SET datestyle`, postgresql.conf DateStyle, PGDATESTYLE env): ISO (default; `1997-12-17 07:37:16-08`), SQL (`12/17/1997 07:37:16.00 PST`), Postgres (`Wed Dec 17 07:37:16 1997 PST`), German (`17.12.1997 07:37:16.00 PST`). Output uses a space, not `T`, between date and time (T accepted on input).
- Time zones: IANA (Olson) database. Three forms: full name (view `pg_timezone_names`), abbreviation (view `pg_timezone_abbrevs`; fixed offset only; cannot be used for the `TimeZone` or `log_timezone` parameters), POSIX-style spec. POSIX sign is opposite of ISO-8601 sign. Names and abbreviations are case-insensitive. `2014-06-04 12:00 EST` means UTC-5 even though DST was nominally in effect. Files under `.../share/timezone/` and `.../share/timezonesets/`.
- Setting zone: `TimeZone` GUC, `SET TIME ZONE`, `PGTZ` env var for libpq clients.
- Interval verbose input: `[@] quantity unit [quantity unit...] [direction]`; units microsecond, millisecond, second, minute, hour, day, week, month, year, decade, century, millennium (and abbreviations/plurals); direction `ago` negates all fields. `'1 12:59:10'` = 1 day 12 hours 59 min 10 sec; `'200-10'` = 200 years 10 months.
- ISO 8601 interval: `P quantity unit [...] [T [quantity unit ...]]` with Y, M (months), W, D, then after T: H, M (minutes), S. Alternative format `P [years-months-days] [T hours:minutes:seconds]`, e.g. `P0001-02-03T04:05:06`.
- `INTERVAL '1' YEAR` = 1 year but `INTERVAL '1'` = 1 second. Fields to the right of the least significant allowed field are silently discarded.
- Internal storage: three integral fields: months, days, microseconds (kept separate because month length varies and a day can be 23 or 25 hours with DST). `'2 years 15 months 100 weeks 99 hours 123456789 milliseconds'::interval` => `3 years 3 mons 700 days 133:17:36.789`.
- Fractional input: fractions of units greater than months are rounded to integer months (`'1.5 years'` => 1 year 6 mons); fractions of weeks and days become days and microseconds assuming 30 days/month and 24 hours/day (`'1.75 months'` => 1 mon 22 days 12:00:00).
- Sign handling: PostgreSQL treats each field as independently signed (`'-1 2:03:04'` has positive h/m/s) unless `IntervalStyle = sql_standard`.
- Output: months => years+months (months shown 0..11), days as-is, microseconds => h:m:s. `justify_days`, `justify_hours` push overflow up. `IntervalStyle`: `sql_standard`, `postgres` (default), `postgres_verbose`, `iso_8601`.

### boolean  [M2]  (source: datatype-boolean.txt)
- 1 byte. States true, false, and unknown (SQL null).
- Input strings for true: `true`, `yes`, `on`, `1`; for false: `false`, `no`, `off`, `0`. Unique prefixes accepted (`t`, `n`); whitespace ignored; case-insensitive. Output is always `t` or `f`.
- `TRUE`/`FALSE` key words are typed boolean automatically; `NULL` is not (may need `NULL::boolean`).

### Enumerated types  [M2]  (source: datatype-enum.txt)
- `CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');` Static, ordered set; ordering = order listed at creation. All comparison operators and related aggregates (MIN/MAX) work.
- Each enum is a separate type; comparing two different enums fails with `operator does not exist: mood = happiness`; cast both to text or write a custom operator.
- Labels are case sensitive; white space significant. Values can be added and renamed with `ALTER TYPE`; existing values cannot be removed nor reordered short of drop/re-create.
- An enum value occupies four bytes on disk. Label length limited by NAMEDATALEN: at most 63 bytes in standard builds. Label mapping is stored in catalog `pg_enum`.

### Geometric types  [M2]  (source: datatype-geometric.txt)
- All coordinates are double precision (float8).
- `point` 16 bytes `(x,y)`; `line` 24 bytes `{A,B,C}` (Ax + By + C = 0, A and B not both zero); `lseg` 32 bytes `[(x1,y1),(x2,y2)]`; `box` 32 bytes `(x1,y1),(x2,y2)` (stored reordered as upper right, lower left); `path` 16+16n bytes, closed `((x1,y1),...)` or open `[(x1,y1),...]`; `polygon` 40+16n bytes `((x1,y1),...)` (stored representation includes its smallest bounding box); `circle` 24 bytes `<(x,y),r>`.
- Polygon vs closed path: polygon is considered to include the area within it.

### Network address types  [M2]  (source: datatype-net-types.txt)
- `cidr` 7 or 19 bytes (IPv4 / IPv6 networks); `inet` 7 or 19 bytes (hosts and networks); `macaddr` 6 bytes; `macaddr8` 8 bytes (EUI-64).
- IPv4 always sorts before IPv6 (including IPv4 mapped into IPv6).
- inet: `address/y`; y omitted => 32 (IPv4) or 128 (IPv6); `/y` suppressed on display for a single host. cidr: rejects nonzero bits to the right of the netmask (`192.168.0.1/24` valid for inet, not cidr); omitted y is derived from classful assumptions (`10` => `10.0.0.0/8`, `128.1` => `128.1.0.0/16`, `192.168.1` => `192.168.1.0/24`).
- Helper functions `host`, `text`, `abbrev`.
- macaddr accepts 7 input formats; output always `08:00:2b:01:02:03`. macaddr8 accepts 6- or 8-byte input; 6-byte values stored with 4th and 5th bytes set to FF and FE. `macaddr8_set7bit('08:00:2b:01:02:03')` => `0a:00:2b:ff:fe:01:02:03` (modified EUI-64 for IPv6).

### Bit strings  [M2]  (source: datatype-bit.txt)
- `bit(n)`: must match length n exactly (error otherwise). `bit varying(n)` / `varbit(n)`: up to n. `bit` without length = `bit(1)`; `bit varying` without length = unlimited.
- Explicit cast to bit(n) truncates or zero-pads on the right; explicit cast to bit varying(n) truncates on the right.
- Storage: 1 byte per 8 bits plus 5 or 8 bytes overhead depending on length; long values may be compressed or moved out-of-line.
- Constants: `B'101'`.

### Text search types: tsvector, tsquery  [M6, M2]  (source: datatype-textsearch.txt)
- `tsvector`: sorted list of distinct lexemes; sorting and duplicate elimination happen automatically on input. `'a fat cat sat on a mat and ate a fat rat'::tsvector` => `'a' 'and' 'ate' 'cat' 'fat' 'mat' 'on' 'rat' 'sat'`.
- Lexemes with whitespace/punctuation are single-quoted inside the value; embedded quotes and backslashes are doubled.
- Optional integer positions: `'a:1 fat:2 cat:3'`. Position range 1 .. 16383; larger numbers are silently set to 16383; duplicate positions for the same lexeme are discarded.
- Weights A, B, C, D on positioned lexemes; D is default and not shown on output: `'a:1A fat:2B,4C cat:5D'::tsvector` => `'a':1A 'cat':5 'fat':2B,4C`.
- The tsvector type itself does NOT normalize: `'The Fat Rats'::tsvector` => `'Fat' 'Rats' 'The'`; `to_tsvector('english', 'The Fat Rats')` => `'fat':2 'rat':3`.
- `tsquery`: lexemes combined with `&` (AND), `|` (OR), `!` (NOT), `<->` (FOLLOWED BY), `<N>` (distance N; `<->` = `<1>`). Precedence without parentheses: `!` tightest, then `<->`, then `&`, then `|`.
- Weight labels restrict matches: `'fat:ab & cat'::tsquery` => `'fat':AB & 'cat'`. Prefix match: `'super:*'`.
- `to_tsquery` normalizes and stems prefixes too: `to_tsvector('postgraduate') @@ to_tsquery('postgres:*')` is true because `postgres` stems to `postgr` and `postgraduate` to `postgradu`.

### UUID  [M2]  (source: datatype-uuid.txt; function names cross-checked in functions-uuid.txt, section 9.14, outside this slice)
- `uuid` stores a 128-bit quantity per RFC 9562, ISO/IEC 9834-8:2005. RFC 9562 defines 8 UUID versions. "PostgreSQL provides native support for generating UUIDs using the UUIDv4 and UUIDv7 algorithms." The type can store any UUID regardless of origin or version.
- Rationale stated: for distributed systems UUIDs give a better uniqueness guarantee than sequence generators, which are only unique within a single database.
- Standard text form: lower-case hex, groups 8-4-4-4-12 (32 digits): `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`. Also accepted on input: upper-case digits, surrounding braces, omitting some or all hyphens, a hyphen after any group of four digits (`a0ee-bc99-9c0b-4ef8-bb6d-6bb9-bd38-0a11`, `{a0eebc99-9c0b4ef8-bb6d6bb9-bd380a11}`). Output always standard form.
- Generation functions (section 9.14): `gen_random_uuid() -> uuid` and `uuidv4() -> uuid` (version 4, random); `uuidv7([shift interval]) -> uuid` (version 7, time-ordered: UNIX timestamp with millisecond precision + sub-millisecond timestamp + random; optional `shift` moves the timestamp; infinite intervals rejected; 48-bit millisecond field covers 1970-01-01 00:00:00 UTC to approximately year 10889, error outside).
- Extraction: `uuid_extract_timestamp(uuid) -> timestamptz` (versions 1 and 7 only, else null); `uuid_extract_version(uuid) -> smallint` (null for non-RFC-9562 variants). `uuid-ossp` module supplies other algorithms.
- Note: the datatype page itself does not state a storage size in bytes; it states "128-bit quantity" (16 bytes).

### xml  [M2, M6]  (source: datatype-xml.txt)
- Checks well-formedness; requires build with `configure --with-libxml`. Stores "documents" and "content" fragments; test with `xmlvalue IS DOCUMENT`.
- `XMLPARSE ( { DOCUMENT | CONTENT } value)`; PostgreSQL shortcuts `xml '<foo>bar</foo>'`, `'<foo>bar</foo>'::xml`. `XMLSERIALIZE ( { DOCUMENT | CONTENT } value AS type [ [ NO ] INDENT ] )` (NO INDENT default).
- No DTD or XML Schema validation.
- `SET XML OPTION { DOCUMENT | CONTENT }` / `SET xmloption TO ...`; default CONTENT. Governs plain casts.
- Encoding: in text mode, encoding declarations in input are ignored and content is assumed to be in the current server encoding (client sends in client encoding); output has no encoding declaration. In binary mode the declaration is honored, default UTF-8; UTF-16 unsupported. XML is internally processed in UTF-8. Caution: `xmltable()` and `xpath()` may not work on non-ASCII data when server encoding is not UTF-8.
- No comparison operators => cannot retrieve rows by comparing an xml column, and cannot create an index directly on an xml column. Workarounds: cast to a character type and index that, or index an XPath expression.

### JSON types: json vs jsonb  [M2, M4]  (source: datatype-json.txt)
- JSON per RFC 7159. Both types validate input. Difference is efficiency and normalization:
  - `json`: stores an exact copy of the input text; functions must reparse on each execution; preserves insignificant white space, key order, and duplicate keys (processing functions treat the last value as operative).
  - `jsonb`: decomposed binary format; slightly slower to input (conversion overhead), significantly faster to process (no reparsing); supports indexing; does not preserve white space, does not preserve object key order, does not keep duplicate keys (last value wins).
  - "most applications should prefer to store JSON data as jsonb".
- Example: `'{"bar": "baz", "balance": 7.77, "active":false}'::jsonb` prints `{"bar": "baz", "active": false, "balance": 7.77}` (keys reordered; shorter keys are stored before longer keys). `'{"reading": 1.230e-5}'::jsonb` prints `{"reading": 0.00001230}` (numbers printed per numeric; E notation lost; trailing fractional zeroes preserved).
- Encoding: json input allows `\uXXXX` escapes regardless of database encoding (syntax check only). jsonb rejects escapes for characters not representable in the database encoding, rejects `\u0000`, requires correct surrogate pairs, and converts valid escapes to the actual character for storage.
- Primitive mapping (Table 8.23): string -> text (`\u0000` disallowed); number -> numeric (NaN and infinity disallowed; jsonb rejects numbers outside numeric range, json does not); boolean -> boolean (only lowercase `true`/`false`); null -> (none) (SQL NULL is a different concept).
- Design advice: any update acquires a row-level lock on the whole row; keep documents to a manageable size to decrease lock contention; each document should ideally be an atomic datum.
- Containment `@>` (jsonb only): contained object must match the containing object in structure and data after discarding non-matching array elements / object pairs. Array element order is not significant and duplicates are considered once. Examples:
  - `'[1, 2, 3]'::jsonb @> '[3, 1]'` true; `'[1, 2, 3]'::jsonb @> '[1, 2, 2]'` true.
  - `'[1, 2, [1, 3]]'::jsonb @> '[1, 3]'` false; `@> '[[1, 3]]'` true.
  - `'{"foo": {"bar": "baz"}}'::jsonb @> '{"bar": "baz"}'` false; `@> '{"foo": {}}'` true.
  - Special exception: an array may contain a primitive: `'["foo", "bar"]'::jsonb @> '"bar"'` true; not reciprocal (`'"bar"'::jsonb @> '["bar"]'` false).
- Existence `?`: tests whether a text string appears as an object key or array element at the TOP LEVEL only. `'{"foo": "bar"}'::jsonb ? 'bar'` false (values not considered); `'"foo"'::jsonb ? 'foo'` true.
- Objects are better than arrays for containment/existence with many keys/elements: objects are internally optimized for searching, arrays are searched linearly.
- GIN indexing:
  - Default opclass `jsonb_ops`: supports `?`, `?|`, `?&`, `@>`, `@?`, `@@`. `CREATE INDEX idxgin ON api USING GIN (jdoc);`
  - `jsonb_path_ops`: supports only `@>`, `@?`, `@@`. `CREATE INDEX idxginp ON api USING GIN (jdoc jsonb_path_ops);` Usually much smaller and more specific/faster.
  - Technical difference: `jsonb_ops` creates independent index items for each key and each value; `jsonb_path_ops` creates index items only for each value, each being a hash of the value and the key(s) leading to it. For `{"foo": {"bar": "baz"}}`: jsonb_ops makes 3 items (foo, bar, baz); jsonb_path_ops makes 1 item hashing foo, bar, baz together.
  - jsonb_path_ops disadvantage: no index entries for structures containing no values, e.g. `{"a": {}}`; searching for such a structure needs a full-index scan.
  - `jdoc -> 'tags' ? 'qui'` cannot use an index on `jdoc` (operator not applied directly to the indexed column); use an expression index `CREATE INDEX idxgintags ON api USING GIN ((jdoc -> 'tags'));` or rewrite as containment `jdoc @> '{"tags": ["qui"]}'`.
  - jsonpath operators: GIN extracts clauses of the form `accessors_chain == constant`; chain may include `.key`, `[*]`, `[index]`; jsonb_ops additionally supports `.*` and `.**`.
- B-tree and hash indexes on jsonb are useful only for whole-document equality. B-tree ordering: `Object > Array > Boolean > Number > String > null`; object with n pairs > object with n-1 pairs; array with n elements > array with n-1 elements; exception: an empty top-level array sorts less than null. Objects with equal pair counts compare key-1, value-1, key-2 ... in storage order (shorter keys first), so `{ "aa": 1, "c": 1} > {"b": 1, "d": 1}`. Strings compare with the default database collation.
- Subscripting: `('{"a": {"b": {"c": 1}}}'::jsonb)['a']['b']['c']`; arrays are zero-based, negative integers count from the end; slices not supported; result is always jsonb. `UPDATE t SET jsonb_field['key'] = '1';` (assigned value must be jsonb). Comparing: `WHERE jsonb_field['key'] = '"value"'`.
  - NULL source: `jsonb_field['a'] = '1'` yields `{"a": 1}`; `jsonb_field[0] = '1'` yields `[1]`.
  - Array index beyond length: null padding (`[]` with `[2] = '2'` => `[null, null, 2]`).
  - Missing intermediate paths are created (`{}` with `['a'][0]['b'] = '1'` => `{"a": [{"b": 1}]}`); traversal through a non-object (string, number, jsonb null) raises an error.
- Transforms: extensions `jsonb_plperl` (trusted), `jsonb_plperlu`, `jsonb_plpython3u`.
- `jsonpath` type: binary representation of a parsed SQL/JSON path expression. Dot = member access, `[]` = array access, arrays are 0-relative. Numeric literals follow JavaScript rules (`.1`, `1.`, `1_000_000`, `0x1EEE_FFFF`, `0o273`, `0b100101`). Embedded string literals use double quotes with JavaScript escapes.
  - Variables: `$` (context item), `$varname` (set by the `vars` parameter), `@` (current item in filter expressions).
  - Accessors: `.key`, `."$varname"`, `.*`, `.**` (PostgreSQL extension, all levels), `.**{level}`, `.**{start_level to end_level}` (level 0 = current object, `last` keyword), `[subscript, ...]` (index or `start_index to end_index`, `last`), `[*]`.

### Arrays  [M2, M3]  (source: arrays.txt)
- Arrays of any built-in or user-defined base type, enum, composite, range, or domain. Declared by appending `[]`: `integer[]`, `text[][]`; SQL-standard `integer ARRAY[4]` / `integer ARRAY`.
- Declared sizes and number of dimensions are NOT enforced ("simply documentation"); all arrays of an element type are the same type.
- Literal: `'{ val1 delim val2 delim ... }'`; delimiter from `pg_type.typdelim`: comma for all standard types except `box` (semicolon). `'{{1,2,3},{4,5,6},{7,8,9}}'`. `NULL` (any case) = null element; `"NULL"` quoted = the string.
- Multidimensional arrays must have matching extents: otherwise `ERROR: malformed array literal` / `Multidimensional arrays must have sub-arrays with matching dimensions.`
- `ARRAY[...]` constructor: elements are ordinary SQL expressions (single-quoted strings).
- Subscripts are one-based by default. Slices `lower:upper`; if any dimension is a slice, all are treated as slices, and a bare number n means `1:n`. Omitted bounds `[:2]`, `[2:]`, `[:]` are allowed.
- Out-of-bounds or wrong-number-of-subscripts element reference yields NULL (no error). A slice entirely outside bounds yields an empty (zero-dimensional) array, not null; partial overlap is silently reduced.
- Functions: `array_dims` (text like `[1:2][1:2]`), `array_upper`, `array_lower`, `array_length(arr, dim)`, `cardinality` (total elements across dimensions), `unnest`, `generate_subscripts`, `array_position`, `array_positions`, `array_prepend`, `array_append`, `array_cat`.
- Update: whole value, single element (`SET pay_by_quarter[4] = 15000`), or slice (`SET pay_by_quarter[1:2] = '{27000,27000}'`). Assigning beyond the end enlarges a one-dimensional array, filling gaps with nulls (not allowed for multidimensional). Subscripted assignment can create non-one-based arrays (e.g. `myarray[-2:7]`).
- Concatenation `||`: element||array, array||element, N-dim||N-dim, N-dim||N+1-dim. Result keeps the lower bound of the left operand's outer dimension. `array_prepend`/`array_append` are 1-D only; `array_cat` handles multidimensional.
- Type resolution pitfall: `ARRAY[1, 2] || '7'` fails with `malformed array literal: "7"` (untyped literal is assumed to be an array); `ARRAY[1,2] || NULL` gives `{1,2}`, while `array_append(ARRAY[1, 2], NULL)` gives `{1,2,NULL}`.
- Searching: `10000 = ANY (pay_by_quarter)`, `= ALL (...)`, overlap `&&` (indexable, see index types).
- Tip: "Arrays are not sets; searching for specific array elements can be a sign of database misdesign." Consider a separate table.
- Output: elements are double-quoted if they are empty strings, contain curly braces, delimiters, double quotes, backslashes, white space, or match NULL. Non-default lower bounds are printed as a prefix: `'[1:1][-2:-1][3:5]={{{1,2,3},{4,5,6}}}'::int[]`. GUC `array_nulls` can be turned off for pre-8.2 compatibility.

### Composite types  [M2, M3]  (source: rowtypes.txt)
- `CREATE TYPE inventory_item AS (name text, supplier_id integer, price numeric);` Only field names and types; no constraints. The `AS` keyword is essential.
- Every `CREATE TABLE` automatically creates a composite type with the same name representing the row type. Table constraints do not apply to the composite type used elsewhere (workaround: a domain over the composite type with CHECK constraints).
- Literal: `'("fuzzy dice",42,1.99)'`; an empty position = NULL (`'("fuzzy dice",42,)'`); `""` = empty string. `ROW('fuzzy dice', 42, 1.99)`; ROW keyword is optional with more than one field.
- Field access needs parentheses: `SELECT (item).name FROM on_hand WHERE (item).price > 9.99;` (`item.name` would be parsed as table.column). `(my_func(...)).field`.
- Update a subfield: `UPDATE mytab SET complex_col.r = (complex_col).r + 1` (no parentheses just after SET). `INSERT INTO mytab (complex_col.r, complex_col.i) VALUES(1.1, 2.2);`
- A table name/alias in a query is a reference to the row's composite value: `SELECT c FROM inventory_item c;`. Simple names match column names before table names.
- `.*` expansion happens only at the top level of a SELECT output list, a RETURNING list in INSERT/UPDATE/DELETE/MERGE, a VALUES clause, or a row constructor. `(myfunc(x)).*` is transformed into `(myfunc(x)).a, (myfunc(x)).b, ...` so the function is called once per column; fix with `SELECT m.* FROM some_table, LATERAL myfunc(x) AS m;`.
- Functional notation: `field(table)` and `table.field` are interchangeable (`name(c)`, `c.somefunc`), enabling "computed fields". Avoid naming a single-composite-argument function the same as a field.
- I/O: parentheses and commas; whitespace inside parentheses is part of the field value. Output double-quotes fields that are empty strings or contain parentheses, commas, double quotes, backslashes, or white space; embedded quotes and backslashes are doubled. Backslash doubling across the string-literal and composite parsers: `'("\"\\")'`.

### Range and multirange types  [M2, M4]  (source: rangetypes.txt)
- A range covers values of a subtype that has a total order. Each range type has a multirange type: "an ordered list of non-contiguous, non-empty, non-null ranges".
- Built-in: `int4range`/`int4multirange` (integer), `int8range`/`int8multirange` (bigint), `numrange`/`nummultirange` (numeric), `tsrange`/`tsmultirange` (timestamp without time zone), `tstzrange`/`tstzmultirange` (timestamp with time zone), `daterange`/`datemultirange` (date).
- Bounds: `[` / `]` inclusive, `(` / `)` exclusive. Input patterns: `(l,u)`, `(l,u]`, `[l,u)`, `[l,u]`, `empty`. Omitted bound = unbounded; an inclusive unbounded bound is converted to exclusive (`[,]` => `(,)`). Unbounded is "beyond" the element type's own infinity: `[today,infinity)` excludes the timestamp value infinity; `[today,infinity]`, `[today,)`, `[today,]` include it.
- Functions: `lower`, `upper`, `isempty`, `lower_inc`, `upper_inc`, `lower_inf`, `upper_inf`. Operators shown: `@>` containment, `&&` overlap, `*` intersection.
- Whitespace between brackets is part of the bound value. `'[4,4]'::int4range` single point; `'[4,4)'` normalizes to `empty`.
- Multirange input: `'{}'`, `'{[3,7)}'`, `'{[3,7), [8,9)}'::int4multirange`.
- Constructors: `numrange(1.0, 14.0)` (default `'[)'`), `numrange(1.0, 14.0, '(]')`; third argument one of `'()'`, `'(]'`, `'[)'`, `'[]'`; NULL bound = unbounded. `nummultirange(numrange(1.0, 14.0), numrange(20.0, 25.0))`.
- Discrete range types (int4range, int8range, daterange) canonicalize to `[)`: `int8range(1, 14, '(]')` is "converted to canonical form" on display (the docs do not print the result; for a discrete `[)` type it would be the equivalent `[)` range); `[4,8]` and `(3,9)` are the same integer range. numeric and timestamp ranges are continuous. Without a canonical function, differently formatted equal ranges are treated as unequal.
- `CREATE TYPE floatrange AS RANGE (subtype = float8, subtype_diff = float8mi);` Defining a range automatically creates a multirange type. Options include subtype B-tree operator class, collation, `canonical` function, `subtype_diff` function (returns X minus Y as float8; makes GiST/SP-GiST indexes efficient).
- Indexing: GiST and SP-GiST on range columns; GiST on multirange columns. Accelerated operators: `=`, `&&`, `<@`, `@>`, `<<`, `>>`, `-|-`, `&<`, `&>`. B-tree and hash indexes exist but only equality is useful (the ordering is "rather arbitrary").
- Exclusion constraints: `EXCLUDE USING GIST (during WITH &&)`; violation error: `conflicting key value violates exclusion constraint "reservation_during_excl"`. With `btree_gist`: `EXCLUDE USING GIST (room WITH =, during WITH &&)`.

### Domains  [M2, M6]  (source: domains.txt)
- `CREATE DOMAIN posint AS integer CHECK (VALUE > 0);` Underlying type can be any base, enum, array, composite, range, or another domain.
- Applying an operator/function of the underlying type down-casts automatically: `mytable.id - 1` is integer, not posint; `(mytable.id - 1)::posint` rechecks constraints. Assignment from the underlying type is allowed without explicit cast, with constraints checked.

### Object identifier types and system identifier types  [M2, M1, M5]  (source: datatype-oid.txt)
- `oid`: unsigned four-byte integer; "not large enough to provide database-wide uniqueness in large databases, or even in large individual tables". Few operations beyond comparison; can be cast to integer (beware signed vs unsigned).
- Alias types (Table 8.26), each with symbolic I/O: `regclass` (pg_class, relation name), `regcollation` (pg_collation), `regconfig` (pg_ts_config), `regdictionary` (pg_ts_dict), `regnamespace` (pg_namespace), `regoper` (pg_operator, operator name), `regoperator` (pg_operator with argument types, e.g. `*(integer,integer)` or `-(NONE,integer)`), `regproc` (pg_proc, function name), `regprocedure` (pg_proc with argument types, e.g. `sum(int4)`), `regrole` (pg_authid), `regtype` (pg_type).
- `SELECT * FROM pg_attribute WHERE attrelid = 'mytable'::regclass;` Lookup honors the schema search path; output is schema-qualified only when needed. `regproc` and `regoper` accept only non-overloaded names.
- Early vs late binding: `nextval('foo')` stores a regclass constant (an OID) that tracks renames; `nextval('foo'::text)` is resolved at run time. `to_regclass()` and siblings for run-time lookups.
- Constants of these types in stored expressions (column defaults, views) create dependencies (sequence cannot be dropped while the default references it). `regrole` is the exception: not allowed in stored expressions.
- Correct size lookup: `pg_relation_size((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass)`.
- `xid`: transaction identifier, 32-bit; type of system columns `xmin` and `xmax`. `xid8`: 64-bit variant; increases strictly monotonically and is never reused in the lifetime of a cluster.
- `cid`: command identifier, 32-bit; type of `cmin` and `cmax`.
- `tid`: tuple identifier; type of `ctid`; a pair (block number, tuple index within block) giving the physical location of the row within its table.

### pg_lsn  [M7, M2]  (source: datatype-pg-lsn.txt)
- Represents `XLogRecPtr`; internally a 64-bit integer byte position in the WAL stream. Printed as two hex numbers of up to 8 digits separated by a slash, e.g. `16/B374D848`.
- Comparison operators; `lsn - lsn` = number of bytes between; `+(pg_lsn,numeric)` and `-(pg_lsn,numeric)`. Range 0/0 .. FFFFFFFF/FFFFFFFF.

### Pseudo-types  [M6]  (source: datatype-pseudo.txt)
- Cannot be used as a column type; only as function argument/result types. Full list in inventories.
- Procedural languages mostly forbid pseudo-type arguments and allow only `void` and `record` results (plus `trigger` / `event_trigger`), and polymorphic types where supported.
- `internal`: functions with at least one `internal` argument cannot be called from SQL. Coding rule: never create a function returning `internal` unless it has at least one `internal` argument.

### Type conversion overview  [M4, M3]  (source: typeconv.txt, typeconv-overview.txt)
- The scanner/parser divides lexical elements into five categories: integers, non-integer numbers, strings, identifiers, key words. Constants of most non-numeric types are first classified as strings. A string literal with no type gets the placeholder type `unknown`, resolved later. Typed literal syntax: `text 'Origin'`, `point '(0,0)'`.
- Four constructs with distinct conversion rules: function calls, operators, value storage (INSERT/UPDATE), and UNION/CASE and related constructs (also ARRAY[], GREATEST, LEAST).
- Casts are stored in system catalogs (`pg_cast`); users add them with `CREATE CAST`. "The set of casts between built-in types has been carefully crafted and is best not altered."
- Type categories: boolean, numeric, string, bitstring, datetime, timespan, geometric, network, user-defined (custom categories possible). Each category can have one or more preferred types (e.g. `text` for string, `float8` for numeric).
- Principles: implicit conversions should never have surprising outcomes; no extra parser/executor overhead when types already match; a newly defined function with exact argument types supersedes implicit conversion to an old one.

### Operator type resolution  [M4]  (source: typeconv-oper.txt)
1. Select candidate operators from `pg_operator` by name and argument count, visible in the search path (or in the given schema if qualified). With identical argument types in several schemas, only the earliest in the path counts.
2. Check for an operator accepting exactly the input argument types; use it if it exists.
   a. If one argument of a binary operator is `unknown`, assume it has the same type as the other argument for this check. Two unknown inputs, or a prefix operator with an unknown input, never match here.
   b. If one argument is `unknown` and the other is a domain type, check for an operator accepting exactly the domain's base type on both sides.
3. Look for the best match:
   a. Discard candidates whose input types do not match and cannot be implicitly converted (`unknown` is convertible to anything). If one remains, use it.
   b. Treat any domain input as its base type from here on.
   c. Keep candidates with the most exact matches on input types (keep all if none). If one remains, use it.
   d. Keep candidates that accept preferred types at the most positions where conversion is required (keep all if none). If one remains, use it.
   e. For `unknown` arguments, pick the string category if any candidate accepts it; otherwise, if all remaining candidates accept the same category, select it; otherwise fail. Discard candidates not accepting the selected category; if any candidate accepts a preferred type in that category, discard those accepting non-preferred types.
   f. If there are both unknown and known-type arguments and all known-type arguments have the same type, assume the unknown ones are that type; if exactly one candidate fits, use it. Otherwise fail.
- Security note: lack of an exact match is a hazard when calling by qualified name an operator in a schema where untrusted users can create objects; cast arguments to force an exact match.
- Examples: `SELECT |/ 40` => `|/ CAST(40 AS double precision)` = 6.324555320336759. `'abc' || 'def'` resolves both unknowns to text (string category preferred over bit-string). `SELECT @ '-4.5'` uses float8 (preferred numeric type); `@ '-4.5e500'` errors `is out of range for type double precision`. `SELECT ~ '20'` fails: `operator is not unique: ~ "unknown"`; fix `~ CAST('20' AS int8)` = -21. `array[1,2] <@ '{1,2,3}'` resolves via step 3.f to array inclusion.
- Domain pitfall: a custom operator `mytext = text` is not chosen for `val = 'foo'`; the parser picks `text = text` via step 2.b. Must write `val = text 'foo'`.

### Function type resolution  [M4, M6]  (source: typeconv-func.txt)
1. Select candidates from `pg_proc` by name and argument count visible in the search path (or the given schema).
   - Identical argument types in multiple schemas: earliest in path wins.
   - A VARIADIC array parameter called without the `VARIADIC` keyword is expanded into repeated element-type arguments. If that collides with a non-variadic function, the earlier in the search path wins; in the same schema the non-variadic one is preferred.
   - Functions with default parameter values match calls omitting zero or more defaultable positions. Several matching functions in the same schema with identical non-defaulted parameter types => "ambiguous function call" error.
2. Check for an exact match on input argument types (cases involving unknown never match here).
3. If no exact match, check for a special type conversion request: single argument, function name equals the internal name of a data type, and the argument is an unknown-type literal, binary-coercible to the named type, or convertible via the type's I/O functions (to or from a standard string type). Then the call is treated as a CAST.
4. Best match: identical to operator steps 3.a - 3.f.
- Security: schema-qualified calls to variadic functions, defaulted functions, or non-exact matches in schemas writable by untrusted users are hijackable; use the VARIADIC keyword and exact argument types, and keep functions in schemas only trusted users can create in.
- Examples: `round(4, 4)` => `round(CAST (4 AS numeric), 4)` = 4.0000; `round(4.0, 4)` needs no conversion. `substr('1234', 3)` picks the text version. `substr(varchar '1234', 3)`: text and varchar are binary-compatible per `pg_cast`, no real conversion call inserted. `substr(1234, 3)` fails: `function substr(integer, integer) does not exist` (no implicit cast integer -> text).

### Value storage conversion  [M4, M2]  (source: typeconv-query.txt)
1. Check for an exact match with the target column type.
2. Otherwise convert using an assignment cast registered in `pg_cast`; an unknown-type literal is fed to the target type's input routine.
3. Apply a sizing cast if one exists: a cast from the type to itself whose function takes an extra integer parameter receiving the column's `atttypmod` (typically the declared length) and optionally a boolean "explicit" flag. It does length checking, truncation, padding.
- Example: `INSERT INTO vv SELECT 'abc' || 'def'` into `character(20)`: unknowns resolve to text, text -> bpchar is binary-coercible, then `bpchar(bpchar, integer, boolean)` pads; `octet_length(v)` = 20.

### UNION, CASE and related constructs  [M3, M4]  (source: typeconv-union-case.txt)
- Applies per output column to UNION, INTERSECT, EXCEPT, CASE, ARRAY, VALUES, GREATEST, LEAST.
1. If all inputs are the same non-unknown type, use it.
2. Treat domain inputs as their base type.
3. If all inputs are `unknown`, resolve as `text`. Otherwise ignore unknown inputs.
4. If the non-unknown inputs are not all in the same type category, fail.
5. Take the first non-unknown input type as the candidate; scan the others left to right; if the candidate can be implicitly converted to the other type but not vice versa, the other type becomes the candidate. Stop as soon as a preferred type is selected.
6. Convert all inputs to the candidate type; fail if any implicit conversion is missing.
- For historical reasons CASE treats its ELSE clause as the "first" input.
- `SELECT 1.2 UNION SELECT 1` => numeric. `SELECT 1 UNION SELECT CAST('2.2' AS REAL)` => real.
- Pitfall: `SELECT NULL UNION SELECT NULL UNION SELECT 1;` fails with `UNION types text and integer cannot be matched` because UNIONs are resolved pairwise, and the inner pair resolves to text. Fix: make the leftmost UNION contain an input of the desired type. INTERSECT/EXCEPT are also pairwise; the other constructs resolve all inputs in one step.

### SELECT output columns  [M3]  (source: typeconv-select.txt)
- An unspecified-type literal as a simple SELECT output column (`SELECT 'Hello World';`) resolves to `text`. Not applied in a UNION arm or `INSERT ... SELECT` (type taken from the other arm or destination column). RETURNING lists behave the same. Before PostgreSQL 10 such literals stayed `unknown`.

### Index basics  [M4]  (source: indexes.txt, indexes-intro.txt)
- `CREATE INDEX test1_id_index ON test1 (id);` `DROP INDEX`. Indexes can be added/removed at any time; the system maintains them automatically and uses them when it estimates that is cheaper than a sequential scan. Run `ANALYZE` regularly so the planner can decide well.
- Indexes also help UPDATE and DELETE with search conditions, and joins.
- General indexable clause form: `indexed-column indexable-operator comparison-value`, where the operator is a member of the index's operator class for that column and the comparison value is any expression that is not volatile and does not reference the index's table. `comparison-value operator indexed-column` can be flipped if the operator has a commutator in the opclass.
- Building: by default reads (SELECT) are allowed during index creation but writes (INSERT, UPDATE, DELETE) are blocked until the build finishes. `CREATE INDEX CONCURRENTLY` allows writes, with caveats.
- Cost: every index adds overhead to data modification, and "Indexes can also prevent the creation of heap-only tuples". Remove seldom-used indexes.

### Index types and when each is used  [M4]  (source: indexes-types.txt)
- Types: B-tree, Hash, GiST, SP-GiST, GIN, BRIN, and the extension `bloom`. Default is B-tree. Other types via `CREATE INDEX name ON table USING HASH (column);`
- B-tree: equality and range queries on sortable data. Operators `<  <=  =  >=  >`; also `BETWEEN`, `IN`, `IS NULL`, `IS NOT NULL`. Pattern matching `LIKE` and `~` only when the pattern is a constant anchored at the start (`col LIKE 'foo%'`, `col ~ '^foo'`, not `col LIKE '%bar'`); in a non-C locale this needs a `*_pattern_ops` operator class. `ILIKE` and `~*` only if the pattern starts with non-alphabetic characters. Can return data in sorted order.
- Hash: stores a 32-bit hash code derived from the indexed value; only `=`.
- GiST: an infrastructure for many strategies (operator classes). Built-in classes for 2-D geometric types support `<<  &<  &>  >>  <<|  &<|  |&>  |>>  @>  <@  ~=  &&`. Supports nearest-neighbor search: `SELECT * FROM places ORDER BY location <-> point '(101,456)' LIMIT 10;`
- SP-GiST: infrastructure for non-balanced disk-based structures: quadtrees, k-d trees, radix trees (tries). Built-in point classes support `<<  >>  ~=  <@  <<|  |>>`. Also supports nearest-neighbor for some classes.
- GIN: "inverted indexes" for values containing multiple component values (arrays etc.); one entry per component value. Built-in array class supports `<@  @>  =  &&`.
- BRIN (Block Range INdex): stores summaries of values in consecutive physical block ranges; most effective when column values are well-correlated with physical row order. For linearly sortable types it stores min and max per block range; supports `<  <=  =  >=  >`.

### Multicolumn indexes and skip scan  [M4]  (source: indexes-multicolumn.txt)
- Only B-tree, GiST, GIN, BRIN support multiple key columns. Max 32 columns including INCLUDE columns (compile-time, `pg_config_manual.h`).
- B-tree rule: "equality constraints on leading columns, plus any inequality constraints on the first column that does not have an equality constraint, will always be used to limit the portion of the index that is scanned." Constraints on later columns are checked in the index (saving heap visits) but do not necessarily reduce the scanned portion.
- Skip scan (PostgreSQL 18): a B-tree scan can generate a dynamic equality constraint internally that matches every possible value of a leading column that lacks an equality constraint, and perform repeated index searches. Example: index on (x, y), query `WHERE y = 7700` => repeated `WHERE x = N AND y = 7700` searches for every x value. Chosen only when there are few distinct x values so that most leaf pages can be skipped; with many distinct x values the planner prefers a sequential scan.
- Selective skip: index (a, b, c), `WHERE a = 5 AND b >= 42 AND c < 77`: scan from first entry `a = 5 AND b = 42` to the last `a = 5`; it may reposition from the first tuple `a = 5 AND b = N AND c >= 77` to the first tuple `a = 5 AND b = N + 1`.
- GiST multicolumn: any subset of columns usable, but the first column matters most; ineffective if the first column has few distinct values.
- GIN multicolumn: effectiveness is the same regardless of which column(s) are used.
- BRIN multicolumn: same as GIN in that respect; the only reason for multiple BRIN indexes is a different `pages_per_range` storage parameter.
- Advice: use multicolumn indexes sparingly; more than three columns is unlikely to help.

### Indexes and ORDER BY  [M4]  (source: indexes-ordering.txt)
- Only B-tree can produce sorted output. The planner chooses between index order and scan-plus-explicit-sort; for a large fraction of the table an explicit sort is likely faster (sequential I/O). `ORDER BY ... LIMIT n` with a matching index returns the first n rows without scanning the rest.
- Default B-tree order: ascending, nulls last; the table TID is a tiebreaker among equal entries. Forward scan satisfies `ORDER BY x` (= `ASC NULLS LAST`); backward scan satisfies `ORDER BY x DESC` (= `DESC NULLS FIRST`).
- Options: `CREATE INDEX test2_info_nulls_low ON test2 (info NULLS FIRST);` `CREATE INDEX test3_desc_index ON test3 (id DESC NULLS LAST);`
- Mixed orderings need a matching definition: `ORDER BY x ASC, y DESC` requires an index `(x ASC, y DESC)` or `(x DESC, y ASC)`.

### Combining multiple indexes (bitmap scans)  [M4]  (source: indexes-bitmap-scans.txt)
- A single index scan can only use clauses on the index's columns with opclass operators joined by AND. `WHERE a = 5 OR b = 6` cannot directly use an index on (a, b).
- Bitmap combination steps: (1) scan each needed index and build an in-memory bitmap of matching table row locations; (2) AND/OR the bitmaps; (3) visit the table rows in physical order. Index ordering is lost, so ORDER BY needs a separate sort.
- `WHERE x = 42 OR x = 47 OR x = 53 OR x = 99` can be four scans of one index ORed together.
- Design trade-off for queries on x, on y, or on both: two single-column indexes; or one (x, y) index (skip scan makes y-only searches reasonable "if x has no more than several hundred distinct values"); or (x, y) plus y; or all three if reads dominate.

### Unique indexes  [M4, M1]  (source: indexes-unique.txt)
- `CREATE UNIQUE INDEX name ON table (column [, ...]) [ NULLS [ NOT ] DISTINCT ];` Only B-tree indexes can be declared unique.
- By default nulls are not considered equal (multiple nulls allowed); `NULLS NOT DISTINCT` treats nulls as equal. A multicolumn unique index rejects only rows where all indexed columns are equal.
- PostgreSQL automatically creates a unique index for a unique constraint or primary key; do not create a duplicate manually.

### Expression indexes  [M4]  (source: indexes-expressional.txt)
- `CREATE INDEX test1_lower_col1_idx ON test1 (lower(col1));` supports `WHERE lower(col1) = 'value'`. `CREATE INDEX people_names ON people ((first_name || ' ' || last_name));` Parentheses around the expression are required unless it is just a function call.
- A UNIQUE expression index enforces constraints not expressible as plain unique constraints (e.g. case-insensitive uniqueness).
- Cost: the expression is computed for each row insertion and non-HOT update; it is NOT recomputed during an indexed search.

### Partial indexes  [M4]  (source: indexes-partial.txt)
- Index over the subset of rows satisfying a predicate. Uses:
  1. Exclude common values (a value accounting for more than a few percent of rows will not use the index anyway): `CREATE INDEX access_log_client_ip_ix ON access_log (client_ip) WHERE NOT (client_ip > inet '192.168.100.0' AND client_ip < inet '192.168.100.255');`
  2. Exclude uninteresting values: `CREATE INDEX orders_unbilled_index ON orders (order_nr) WHERE billed is not true;` usable by `WHERE billed is not true AND order_nr < 10000` and also by `WHERE billed is not true AND amount > 5000.00` (scans the entire index); NOT usable by `WHERE order_nr = 3501`.
  3. Partial unique index: `CREATE UNIQUE INDEX tests_success_constraint ON tests (subject, target) WHERE success;` Also a unique partial index with an `IS NULL` restriction allows only one null.
  4. Override plan choices (rarely justified).
- Usability rule: the query's WHERE condition must mathematically imply the index predicate. There is no sophisticated theorem prover: only simple inequality implications are recognized ("x < 1" implies "x < 2"); otherwise the predicate must exactly match part of the WHERE condition. Matching happens at planning time, so parameterized clauses (`x < ?`) do not work with a partial index.
- The indexed column and the predicate column need not match; only columns of the indexed table may appear in the predicate.
- Anti-pattern (Example 11.4): many non-overlapping partial indexes `WHERE category = N` as a substitute for partitioning. Use `CREATE INDEX mytable_cat_data ON mytable (category, data);` or real partitioning; the planner tests each partial index individually.

### Index-only scans and covering indexes  [M4, M2, M5]  (source: indexes-index-only-scans.txt)
- All PostgreSQL indexes are secondary indexes, stored separately from the table's heap. An ordinary index scan fetches from both index and heap; heap access is random I/O.
- Index-only scan requirements:
  1. The index type must support it: B-tree always; GiST and SP-GiST for some operator classes; others not (GIN cannot, since entries hold only part of the original value). The index must store or be able to reconstruct the original value.
  2. The query must reference only columns stored in the index.
- Visibility: index entries carry no MVCC visibility information. The scan checks the visibility map bit for the heap page; if set, the row is known visible and no heap access is needed; if not set, the heap tuple must be visited (no gain over a plain index scan). "the visibility map is four orders of magnitude smaller than the heap it describes". An index-only scan is a win only if a significant fraction of heap pages have their all-visible bits set.
- Covering index: `CREATE INDEX tab_x_y ON tab(x) INCLUDE (y);` y is payload, not part of the search key, and need not be of a type the index can handle. `CREATE UNIQUE INDEX tab_x_y ON tab(x) INCLUDE (y);` enforces uniqueness on x only. INCLUDE also works in UNIQUE and PRIMARY KEY constraints.
- Restrictions/caveats: if an index tuple exceeds the maximum size for the index type, insertion fails; payload bloats the index; expressions are not supported as included columns; only B-tree, GiST and SP-GiST support included columns.
- Older technique: `CREATE INDEX tab_x_y ON tab(x, y);` works if extra columns are trailing, but cannot enforce uniqueness on x alone.
- Suffix truncation: always removes non-key columns from upper B-tree levels; also removes trailing key columns when the remaining prefix suffices to describe tuples on the lowest level.
- Expression indexes: the planner only allows an index-only scan when all columns needed are available from the index, so `SELECT f(x) FROM tab WHERE f(x) < 1;` is not recognized; workaround `CREATE INDEX tab_f_x ON tab (f(x)) INCLUDE (x);`.
- Partial indexes: `SELECT target FROM tests WHERE subject = 'some-subject' AND success;` can be index-only on the partial index although `success` is not in the index (since 9.6), because the predicate need not be rechecked.

### Operator classes and families  [M4]  (source: indexes-opclass.txt)
- `CREATE INDEX name ON table (column opclass [ ( opclass_options ) ] [sort options] [, ...]);` The opclass identifies the operators used by the index for that column (e.g. `int4_ops` for B-tree on int4) and determines the basic sort ordering, modifiable by `COLLATE`, `ASC/DESC`, `NULLS FIRST/NULLS LAST`.
- `text_pattern_ops`, `varchar_pattern_ops`, `bpchar_pattern_ops`: compare strictly character by character instead of locale collation rules; needed for LIKE / POSIX regex index use when the database is not in the "C" locale. They do not support ordinary `<`, `<=`, `>`, `>=` (create a second default-opclass index for those); equality works.
- An operator family groups operator classes of similar types so that cross-data-type operators can be used with indexes; cross-type operators belong to the family, not to a class.
- Catalogs: `pg_am` (amname), `pg_opclass` (opcname, opcmethod, opcintype, opcdefault, opcfamily), `pg_opfamily` (opfname, opfmethod), `pg_amop` (amopfamily, amopopr). psql: `\dAc`, `\dAf`, `\dAo`.

### Indexes and collations  [M4]  (source: indexes-collations.txt)
- One collation per index column. An index on `content varchar COLLATE "x"` cannot serve `WHERE content > constant COLLATE "y"`; create `CREATE INDEX test1c_content_y_index ON test1c (content COLLATE "y");`

### Examining index usage  [M4]  (source: indexes-examine.txt)
- Use `EXPLAIN` per query; cumulative usage statistics per section 27.2.
- Tips: always run `ANALYZE` first; use real data; very small test sets are "especially fatal" (100 rows fit in one page, nothing beats fetching 1 page); beware of synthetic data that is too similar, random, or sorted.
- To test, turn off plan types: `enable_seqscan`, `enable_nestloop`. If the index is still not used, the condition probably does not match the index. If forcing uses the index, time it both ways with `EXPLAIN ANALYZE`.
- Wrong costs come from either per-node cost parameters (section 19.7.2) or selectivity estimates (insufficient statistics; tune via `ALTER TABLE` statistics targets).

### Full text search: concepts  [M6]  (source: textsearch.txt, textsearch-intro.txt)
- Why not `~`, `~*`, `LIKE`, `ILIKE`: no linguistic support (derived words like satisfies/satisfy), no ranking, slow without index support.
- Preprocessing pipeline: (1) a parser splits documents into tokens and classifies them; (2) dictionaries convert tokens into lexemes (normalized: case-folded, suffixes removed) and drop stop words; (3) the result is stored as a sorted array of lexemes, optionally with positions for proximity ranking.
- "tokens are raw fragments of the document text, while lexemes are words that are believed useful for indexing and searching."
- A document is the unit of searching: usually a text field or a concatenation of fields, possibly from several tables. Use `coalesce` so a single NULL attribute does not null out the whole document.
- Match operator `@@`: returns true if a tsvector matches a tsquery; either order. Variants: `tsvector @@ tsquery`, `tsquery @@ tsvector`, `text @@ tsquery` (= `to_tsvector(x) @@ y`), `text @@ text` (= `to_tsvector(x) @@ plainto_tsquery(y)`).
- `'fat cats ate fat rats'::tsvector @@ to_tsquery('fat & rat')` is false (cast does not normalize `rats`), while `to_tsvector('fat cats ate fat rats') @@ to_tsquery('fat & rat')` is true.
- Phrase search: `to_tsvector('fatal error') @@ to_tsquery('fatal <-> error')` true; `'error is not fatal'` false. `<N>`: N is the difference between positions; `<2>` allows exactly one lexeme in between; `<0>` requires two patterns to match the same word. `phraseto_tsquery('the cats ate the rats')` => `'cat' <-> 'ate' <2> 'rat'`.
- Inside FOLLOWED BY, AND/OR/NOT are position-sensitive: `!x <-> y` matches y not immediately after an x; `(x & y) <-> z` requires x and y at the same place.
- Configurations: GUC `default_text_search_config` (set at installation in postgresql.conf; can be set per database via `ALTER DATABASE ... SET` or per session). Functions accept an optional `regconfig` argument. psql `\dF` lists configurations.
- Four object types: text search parsers (tokenize and classify), dictionaries (normalize, reject stop words), templates (functions underlying dictionaries), configurations (select a parser and a set of dictionaries). Parsers and templates need C code and superuser to install; dictionaries and configurations need no special privilege.

### FTS on tables and indexes  [M6, M4]  (source: textsearch-tables.txt)
- Without index: `SELECT title FROM pgweb WHERE to_tsvector('english', body) @@ to_tsquery('english', 'friend');` (also finds friends, friendly).
- Expression GIN index: `CREATE INDEX pgweb_idx ON pgweb USING GIN (to_tsvector('english', body));` Only the 2-argument `to_tsvector` (explicit configuration) may be used in expression indexes because index contents must not depend on `default_text_search_config`. The query must use the same 2-argument form and configuration: `WHERE to_tsvector('english', body) @@ 'a & b'` can use it, `WHERE to_tsvector(body) @@ 'a & b'` cannot.
- Per-row configuration: `CREATE INDEX pgweb_idx ON pgweb USING GIN (to_tsvector(config_name, body));` Concatenated columns: `to_tsvector('english', title || ' ' || body)`.
- Stored generated column approach:
  `ALTER TABLE pgweb ADD COLUMN textsearchable_index_col tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED;` then `CREATE INDEX textsearch_idx ON pgweb USING GIN (textsearchable_index_col);`
- Trade-offs: separate column lets queries rely on `default_text_search_config` and is faster (no `to_tsvector` recomputation to verify index matches; matters more for GiST than GIN); the expression index is simpler and uses less disk.

### FTS: parsing documents and queries, ranking, highlighting  [M6]  (source: textsearch-controls.txt)
- `to_tsvector([ config regconfig, ] document text) returns tsvector`. `to_tsvector('english', 'a fat  cat sat on a mat - it ate a fat rats')` => `'ate':9 'cat':3 'fat':2,11 'mat':7 'rat':12 'sat':4` (stop words a, on, it dropped but still consume positions; `-` ignored because no dictionaries are assigned to the Space symbols token type).
- For each token the configuration's dictionary list for that token type is consulted in order; the first dictionary that recognizes the token emits lexemes; stop words are dropped; unrecognized tokens are ignored.
- `setweight` labels entries with A, B, C or D. Recommended structured-document recipe:
  `setweight(to_tsvector(coalesce(title,'')), 'A') || setweight(to_tsvector(coalesce(keyword,'')), 'B') || setweight(to_tsvector(coalesce(abstract,'')), 'C') || setweight(to_tsvector(coalesce(body,'')), 'D')`. `to_tsvector(NULL)` returns NULL.
- Query constructors (all take optional `config regconfig`):
  - `to_tsquery(querytext)`: input must already be valid tsquery syntax (tokens separated by `&`, `|`, `!`, `<->`, parentheses); normalizes tokens and discards stop words. `to_tsquery('english', 'The & Fat & Rats')` => `'fat' & 'rat'`. Weights and prefix: `to_tsquery('supern:*A & star:A*B')` => `'supern':*A & 'star':*AB`. Accepts single-quoted phrases for thesaurus use. Syntax error if tokens lack an operator between them.
  - `plainto_tsquery`: parses unformatted text, inserts `&` between surviving words; does not recognize operators, weights or prefix labels (`'The Fat & Rats:C'` => `'fat' & 'rat' & 'c'`).
  - `phraseto_tsquery`: like plainto but inserts `<->`, and stop words become `<N>` gaps.
  - `websearch_to_tsquery`: never raises syntax errors; unquoted text => `&`; `"quoted text"` => `<->`; the word `or` => `|`; `-` => `!`; other punctuation ignored. `websearch_to_tsquery('english', 'signal -"segmentation fault"')` => `'signal' & !( 'segment' <-> 'fault' )`.
- Ranking:
  - `ts_rank([ weights float4[], ] vector tsvector, query tsquery [, normalization integer ]) returns float4`: based on frequency of matching lexemes.
  - `ts_rank_cd(...)`: cover density ranking (Clarke, Cormack, Tudhope 1999); takes proximity into account; requires positions and ignores stripped lexemes (result zero if none).
  - weights array order `{D-weight, C-weight, B-weight, A-weight}`; default `{0.1, 0.2, 0.4, 1.0}`.
  - normalization bit mask: 0 (default) ignores length; 1 divides by 1 + log(document length); 2 divides by document length; 4 divides by mean harmonic distance between extents (ts_rank_cd only); 8 divides by number of unique words; 16 divides by 1 + log(number of unique words); 32 divides rank by itself + 1 (scales into 0..1, cosmetic). Multiple flags apply in the order listed.
  - Ranking is expensive: it must consult the tsvector of each matching document.
- `ts_headline([ config regconfig, ] document text, query tsquery [, options text ]) returns text`. Options (case-insensitive names): `MaxWords` (35), `MinWords` (15), `ShortWord` (3), `HighlightAll` (false), `MaxFragments` (0 = non-fragment-based), `StartSel` (`<b>`), `StopSel` (`</b>`), `FragmentDelimiter` (` ... `). It uses the original document, not the tsvector, so it can be slow. Warning: output is not XSS-safe.

### FTS: manipulating documents and queries  [M6]  (source: textsearch-features.txt)
- `tsvector || tsvector`: concatenation; positions in the right-hand vector are offset by the largest position in the left-hand vector; weights retained.
- `setweight(vector tsvector, weight "char")`: weights apply to positions, not lexemes; no effect on stripped vectors.
- `length(vector tsvector)`: number of lexemes. `strip(vector tsvector)`: removes positions and weights (smaller, but ranking is worse and `<->` never matches).
- tsquery operators: `tsquery && tsquery` (AND), `tsquery || tsquery` (OR), `!! tsquery` (NOT), `tsquery <-> tsquery`, `tsquery_phrase(query1, query2 [, distance integer ])` (`'fat' <10> 'cat'`).
- `numnode(query tsquery)`: number of nodes (lexemes plus operators); 0 means only stop words (with `NOTICE: query contains only stopword(s) or doesn't contain lexeme(s), ignored`).
- `querytree(query tsquery)`: the indexable portion of a query; returns `T` for unindexable queries such as `!defined`.
- Query rewriting: `ts_rewrite(query tsquery, target tsquery, substitute tsquery)` and `ts_rewrite(query tsquery, select text)` (the select must return two tsquery columns, target and substitute; use ORDER BY since rule order can matter). Rules can change without reindexing, unlike a thesaurus. Filter candidate rules with tsquery containment `@>`.
- Triggers (obsoleted by stored generated columns): `tsvector_update_trigger(tsvector_column_name, config_name, text_column_name [, ... ])` and `tsvector_update_trigger_column(tsvector_column_name, config_column_name, text_column_name [, ... ])`. Config name must be schema-qualified (`'pg_catalog.english'`). Used as `BEFORE INSERT OR UPDATE ... FOR EACH ROW EXECUTE FUNCTION`. Custom PL/pgSQL trigger needed for per-column weights. Always name the configuration explicitly inside triggers.
- `ts_stat(query text, [ weights text, ] OUT word text, OUT ndoc integer, OUT nentry integer) returns setof record`: per-lexeme statistics (documents containing the word, total occurrences); useful for finding stop-word candidates.

### FTS parser  [M6]  (source: textsearch-parsers.txt)
- A parser only identifies word boundaries and token types; it does not modify text. One built-in parser: `pg_catalog.default`, recognizing 23 token types (list in inventories).
- "Letter" is determined by the database locale (`lc_ctype`). `email` supports only period, dash, underscore as non-alphanumeric user-name characters.
- Overlapping tokens: `ts_debug('foo-bar-beta1')` yields `numhword` foo-bar-beta1 plus parts `hword_asciipart` foo, bar and `hword_numpart` beta1 (with `blank` hyphens). A URL yields `protocol`, `url`, `host`, `url_path`.

### FTS dictionaries  [M6]  (source: textsearch-dictionaries.txt)
- A dictionary takes a token and returns one of: an array of lexemes (token known; one token may yield several lexemes); a single lexeme with the `TSL_FILTER` flag set (a filtering dictionary: the replacement token is passed on to subsequent dictionaries); an empty array (known stop word); NULL (unrecognized).
- For each token type, the configuration lists dictionaries consulted in order until one recognizes the token. Stop word or no recognition => token discarded. Order rule: most narrow/specific first, most general (Snowball stemmer or `simple`) last. `ALTER TEXT SEARCH CONFIGURATION astro_en ADD MAPPING FOR asciiword WITH astrosyn, english_ispell, english_stem;`
- Filtering dictionaries may be anywhere except last (example: the `unaccent` module).
- Stop words still affect positions: `to_tsvector('english', 'in the list of stop words')` => `'list':3 'stop':5 'word':6`; `ts_rank_cd` is 0.05 with stop words versus 0.1 for `'list stop words'`. Ispell dictionaries normalize first then check stop words; Snowball stemmers check the stop list first.
- `simple` template: lower-cases and checks a stop word file. `CREATE TEXT SEARCH DICTIONARY public.simple_dict ( TEMPLATE = pg_catalog.simple, STOPWORDS = english );` File `$SHAREDIR/tsearch_data/english.stop` (one word per line). `ts_lexize('public.simple_dict', 'YeS')` => `{yes}`; `'The'` => `{}`. Parameter `Accept` (default true); `Accept = false` returns NULL for non-stop-words so they pass to the next dictionary.
- Cautions: dictionary files must be UTF-8. A session reads a dictionary file only once (on first use); to force reload issue `ALTER TEXT SEARCH DICTIONARY` (can be a dummy update).
- `synonym` template: parameter `SYNONYMS` (file `$SHAREDIR/tsearch_data/NAME.syn`, lines `word synonym`), optional `CaseSensitive` (default false). No phrase support. A trailing `*` on the synonym marks a prefix: ignored by `to_tsvector()`, but `to_tsquery()` produces a prefix-match item (`indices index*` => `to_tsquery('tst', 'indices')` = `'index':*`). Use case: put `Paris paris` before `english_stem` to stop stemming to `pari`.
- `thesaurus` template (TZ): synonym dictionary with phrase support. File `$SHAREDIR/tsearch_data/NAME.ths` with lines `sample word(s) : indexed word(s)`; `#` comments. Parameters `DictFile`, `Dictionary` (exactly one subdictionary used to normalize input; an error is reported if it does not recognize a sample word). `*` before an indexed word skips the subdictionary; `?` marks a stop-word position (`? one ? two : swsw`). Longest match wins; ties broken by the last definition. It must be assigned to all token types its phrases involve. Caution: thesauruses are used during indexing, so any parameter change requires reindexing. To also index the original phrase include it on the right-hand side (`supernovae stars : sn supernovae stars`).
- `ispell` template: morphological dictionaries; supports Ispell, MySpell (OO < 2.0.1), Hunspell (OO >= 2.0.2) formats. Parameters `DictFile`, `AffFile`, `StopWords`; files `.dict`, `.affix`, `.stop` in `$SHAREDIR/tsearch_data`. No Ispell files ship with PostgreSQL. Should be followed by a broader dictionary. Supports compound word splitting (`compoundwords controlled z`): `ts_lexize('norwegian_ispell', 'sjokoladefabrikk')` => `{sjokoladefabrikk,sjokolade,fabrikk}`. MySpell has no compound support; only basic Hunspell compound operations are implemented.
- `snowball` template: Porter-project stemmers. Parameters `Language` (required), `StopWords` (optional). Built-in equivalent: `CREATE TEXT SEARCH DICTIONARY english_stem ( TEMPLATE = snowball, Language = english, StopWords = english );` It recognizes everything, so it must be last.

### FTS configuration example and debugging  [M6]  (source: textsearch-configuration.txt, textsearch-debugging.txt)
- Steps: `CREATE TEXT SEARCH CONFIGURATION public.pg ( COPY = pg_catalog.english );` => create dictionaries (`pg_dict` synonym, `english_ispell`) => `ALTER TEXT SEARCH CONFIGURATION pg ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part WITH pg_dict, english_ispell, english_stem;` => `ALTER TEXT SEARCH CONFIGURATION pg DROP MAPPING FOR email, url, url_path, sfloat, float;` => `SET default_text_search_config = 'public.pg';`
- `ts_debug([ config regconfig, ] document text, OUT alias text, OUT description text, OUT token text, OUT dictionaries regdictionary[], OUT dictionary regdictionary, OUT lexemes text[]) returns setof record`: one row per token; `lexemes` NULL = unrecognized, `{}` = stop word.
- `ts_parse(parser_name text | parser_oid oid, txt text, OUT tokid integer, OUT token text)`: `ts_parse('default', '123 - a number')` => (22,'123'), (12,' '), (12,'-'), (1,'a'), (12,' '), (1,'number').
- `ts_token_type(parser_name | parser_oid, OUT tokid integer, OUT alias text, OUT description text)`.
- `ts_lexize(dict regdictionary, token text) returns text[]`: expects a single token; `ts_lexize('english_stem', 'stars')` => `{star}`; `'a'` => `{}`. Not usable for thesaurus phrases (use `plainto_tsquery` or `to_tsvector`).

### FTS index types  [M6, M4]  (source: textsearch-indexes.txt)
- `CREATE INDEX name ON table USING GIN (column);` (column must be tsvector). `CREATE INDEX name ON table USING GIST (column [ { DEFAULT | tsvector_ops } (siglen = number) ] );` (column tsvector or tsquery).
- GIN is the preferred text search index type: an entry per lexeme with a compressed list of matching locations. GIN stores only lexemes, not weight labels, so a table row recheck is needed for queries involving weights.
- GiST is lossy: each document is a fixed-length signature made by hashing each word to a single bit in an n-bit string and OR-ing them. Default signature length 124 bytes, maximum 2024 bytes (`siglen`). Hash collisions cause false matches; PostgreSQL rechecks the table row automatically. Longer signatures = more precise search, larger index.
- A GiST index can be covering (`INCLUDE`); included attributes are stored uncompressed.
- GIN build time improves with larger `maintenance_work_mem`; GiST build time is not sensitive to it.
- Ranking functions use only local information, so collections can be partitioned or distributed.

### FTS psql support and limits  [M6]  (source: textsearch-psql.txt, textsearch-limitations.txt)
- `\dF[+] [PATTERN]` configurations; `\dFd[+]` dictionaries; `\dFp[+]` parsers; `\dFt[+]` templates. `\dF+ russian` shows the parser and the token-type-to-dictionary mapping (e.g. asciiword => english_stem, word => russian_stem, numeric/url types => simple).
- Default parser functions: `prsd_start`, `prsd_nexttoken`, `prsd_end`, `prsd_headline`, `prsd_lextype`.
- Limits: each lexeme must be less than 2 kilobytes; no more than 256 positions per lexeme; position values > 0 and <= 16,383; tsvector data (lexemes + positions) less than 1 megabyte; tsquery data (lexemes only) less than 1 megabyte; `<N>` match distance cannot exceed 16,384.

### MVCC introduction  [M5]  (source: mvcc.txt, mvcc-intro.txt)
- PostgreSQL maintains consistency with a multiversion model (MVCC): "each SQL statement sees a snapshot of data (a database version) as it was some time ago, regardless of the current state of the underlying data."
- Main advantage: "locks acquired for querying (reading) data do not conflict with locks acquired for writing data, and so reading never blocks writing and writing never blocks reading." This holds even at the strictest level through Serializable Snapshot Isolation (SSI).
- Table- and row-level locks are available for explicit conflict management; advisory locks are application-defined and not tied to a single transaction. Proper use of MVCC generally performs better than locks.

### Transaction isolation: phenomena and levels  [M5]  (source: transaction-iso.txt)
- Phenomena:
  - dirty read: a transaction reads data written by a concurrent uncommitted transaction.
  - nonrepeatable read: a transaction re-reads data and finds it modified by another transaction that committed since the initial read.
  - phantom read: re-executing a query with a search condition returns a different set of rows due to another recently committed transaction.
  - serialization anomaly: the result of successfully committing a group of transactions is inconsistent with all possible orderings of running them one at a time.
- Table 13.1:

| Isolation Level | Dirty Read | Nonrepeatable Read | Phantom Read | Serialization Anomaly |
|---|---|---|---|---|
| Read uncommitted | Allowed, but not in PG | Possible | Possible | Possible |
| Read committed | Not possible | Possible | Possible | Possible |
| Repeatable read | Not possible | Not possible | Allowed, but not in PG | Possible |
| Serializable | Not possible | Not possible | Not possible | Not possible |

- All four levels can be requested, but only three are implemented: Read Uncommitted behaves like Read Committed. PostgreSQL Repeatable Read does not allow phantom reads (stronger than the standard requires).
- Set with `SET TRANSACTION`. GUC `default_transaction_isolation`.
- Important: sequence changes (and therefore serial column counters) are immediately visible to all other transactions and are not rolled back on abort.

### Read Committed  [M5]  (source: transaction-iso.txt)
- Default isolation level. A SELECT (without FOR UPDATE/SHARE) sees only data committed before the query began: a snapshot as of the instant the query begins to run. It does see earlier uncommitted changes of its own transaction. Two successive SELECTs in one transaction can see different data.
- UPDATE, DELETE, SELECT FOR UPDATE, SELECT FOR SHARE find target rows committed as of command start. If a target row was already updated/deleted/locked by a concurrent transaction:
  1. The would-be updater waits for the first updater to commit or roll back.
  2. If the first updater rolls back, the second proceeds with the originally found row.
  3. If the first updater commits: if it deleted the row, the second ignores the row; otherwise the WHERE clause is re-evaluated against the updated row version, and if it still matches, the second updater operates on the updated version (for SELECT FOR UPDATE/SHARE the updated version is locked and returned).
- `INSERT ... ON CONFLICT DO UPDATE`: each proposed row will either insert or update (guaranteed, barring unrelated errors); the UPDATE may affect a row of which no version is conventionally visible to the command. `ON CONFLICT DO NOTHING` may skip insertion because of a transaction whose effects are not visible to the INSERT snapshot. (Read Committed only.)
- MERGE: does not guarantee that either INSERT or UPDATE occurs. If the target row is concurrently updated and the join condition still passes, MERGE acts on the updated version but re-evaluates the conditions of each action starting from the first action. If the join condition now fails, it evaluates `NOT MATCHED BY SOURCE` and `NOT MATCHED [BY TARGET]` actions and executes the first of each kind that succeeds. If the row was concurrently deleted, it evaluates `NOT MATCHED [BY TARGET]` actions. A concurrent duplicate insert raises a uniqueness violation; MERGE does not restart.
- Consequence: an updating command can see an inconsistent snapshot (effects of concurrent updates on the rows it updates, but not on other rows). Fine for simple cases (bank transfer of $100 between accounts 12345 and 7534), bad for complex search conditions.
- Documented anomaly: table `website` with hits 9 and 10. Session 1: `BEGIN; UPDATE website SET hits = hits + 1;` Session 2: `DELETE FROM website WHERE hits = 10;` Session 1: `COMMIT;` The DELETE has no effect: the pre-update row with 9 is skipped, and the row with 10 becomes 11 after the lock is obtained and no longer matches.

### Repeatable Read  [M5]  (source: transaction-iso.txt)
- Sees only data committed before the transaction began, plus its own changes. The snapshot is taken "as of the start of the first non-transaction-control statement in the transaction", not per statement.
- Prevents all phenomena of Table 13.1 except serialization anomalies. Implemented as Snapshot Isolation.
- UPDATE, DELETE, MERGE, SELECT FOR UPDATE, SELECT FOR SHARE find rows committed as of transaction start. If a target row was changed by a concurrent transaction: wait; if that transaction rolls back, proceed; if it commits (and actually updated or deleted the row, not just locked it), the repeatable read transaction is rolled back with `ERROR:  could not serialize access due to concurrent update`.
- The application must abort and retry the whole transaction. Read-only transactions never have serialization conflicts.
- The view is stable but not necessarily consistent with some serial execution (example: a read-only transaction sees a batch control record updated but misses a detail record). Business rules need explicit locks at this level.
- Before 9.1, a request for Serializable gave exactly this behavior.

### Serializable (SSI)  [M5]  (source: transaction-iso.txt)
- Works exactly like Repeatable Read plus monitoring for conditions that could make a concurrent set of serializable transactions inconsistent with all possible serial executions. The monitoring adds no blocking beyond Repeatable Read, but has overhead; detection triggers a serialization failure.
- Example: `mytab(class, value)` rows (1,10), (1,20), (2,100), (2,200). Transaction A: `SELECT SUM(value) FROM mytab WHERE class = 1;` (30) and inserts (2, 30). Transaction B: `SELECT SUM(value) FROM mytab WHERE class = 2;` (300) and inserts (1, 300). Under Repeatable Read both commit; under Serializable one commits and the other fails with `ERROR:  could not serialize access due to read/write dependencies among transactions`.
- Data read from a permanent user table must not be considered valid until the reading transaction commits, even for read-only transactions, except deferrable read-only transactions (which wait for a safe snapshot before reading).
- Predicate locking: locks that record what a transaction read, to determine when a write would have affected a previous read of a concurrent transaction. They do not cause any blocking and cannot contribute to deadlocks. Visible in `pg_locks` with mode `SIReadLock`.
- Predicate locks are based on data actually accessed and depend on the query plan. Finer-grained locks (tuple) may be combined into coarser ones (page, then relation) to bound memory. A READ ONLY transaction may release SIRead locks early or avoid taking any. `SERIALIZABLE READ ONLY DEFERRABLE` blocks until it can establish that no conflicts can occur ("the only case where Serializable transactions block but Repeatable Read transactions don't"). SIRead locks often must be kept past commit until overlapping read write transactions complete.
- Serialization failures always carry SQLSTATE `'40001'`.
- Caveat: unique constraint violations can be raised even after explicitly checking that the key is absent, when other overlapping Serializable transactions insert keys directly without the same check-first protocol.
- Performance guidance:
  - Declare transactions `READ ONLY` when possible.
  - Control the number of active connections (connection pool).
  - Do not put more into a transaction than needed for integrity.
  - Do not leave connections "idle in transaction"; GUC `idle_in_transaction_session_timeout`.
  - Eliminate explicit locks, SELECT FOR UPDATE, SELECT FOR SHARE that are no longer needed.
  - When page-level predicate locks get combined into relation-level locks due to memory shortage, serialization failures increase; raise `max_pred_locks_per_transaction`, `max_pred_locks_per_relation`, `max_pred_locks_per_page`.
  - A sequential scan always needs a relation-level predicate lock; encourage index scans by reducing `random_page_cost` and/or increasing `cpu_tuple_cost`.
- Implemented as Serializable Snapshot Isolation (reference [ports12]).

### Table-level locks  [M5]  (source: explicit-locking.txt)
- All of these are table-level locks even when the name says "row"; names are historical. The only real difference between modes is the set of modes each conflicts with. Two transactions cannot hold conflicting modes on the same table; a transaction never conflicts with itself. Acquire explicitly with `LOCK`; inspect with the `pg_locks` view.
- Modes, conflicts, and automatic acquirers:
  1. `ACCESS SHARE` (AccessShareLock): conflicts with ACCESS EXCLUSIVE only. Acquired by `SELECT` and any query that only reads a table.
  2. `ROW SHARE` (RowShareLock): conflicts with EXCLUSIVE and ACCESS EXCLUSIVE. Acquired by `SELECT` with `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, or `FOR KEY SHARE` on the tables so specified.
  3. `ROW EXCLUSIVE` (RowExclusiveLock): conflicts with SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Acquired by `UPDATE`, `DELETE`, `INSERT`, `MERGE` on the target table.
  4. `SHARE UPDATE EXCLUSIVE` (ShareUpdateExclusiveLock): conflicts with SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Protects against concurrent schema changes and VACUUM runs. Acquired by `VACUUM` (without FULL), `ANALYZE`, `CREATE INDEX CONCURRENTLY`, `CREATE STATISTICS`, `COMMENT ON`, `REINDEX CONCURRENTLY`, and certain `ALTER INDEX` and `ALTER TABLE` variants.
  5. `SHARE` (ShareLock): conflicts with ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Protects against concurrent data changes. Acquired by `CREATE INDEX` (without CONCURRENTLY). Not self-conflicting.
  6. `SHARE ROW EXCLUSIVE` (ShareRowExclusiveLock): conflicts with ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Protects against concurrent data changes and is self-exclusive. Acquired by `CREATE TRIGGER` and some forms of `ALTER TABLE`.
  7. `EXCLUSIVE` (ExclusiveLock): conflicts with ROW SHARE, ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Allows only concurrent ACCESS SHARE (reads). Acquired by `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
  8. `ACCESS EXCLUSIVE` (AccessExclusiveLock): conflicts with all modes. Acquired by `DROP TABLE`, `TRUNCATE`, `REINDEX`, `CLUSTER`, `VACUUM FULL`, `REFRESH MATERIALIZED VIEW` (without CONCURRENTLY), many forms of `ALTER INDEX` and `ALTER TABLE`. Default mode for `LOCK TABLE` without an explicit mode.
- Tip: "Only an ACCESS EXCLUSIVE lock blocks a SELECT (without FOR UPDATE/SHARE) statement."
- Duration: held until end of transaction. A lock acquired after a savepoint is released immediately if the savepoint is rolled back to; same for locks acquired inside a PL/pgSQL exception block when an error escapes the block.
- Conflict matrix: see Table 13.2 in "Complete inventories".

### Row-level locks  [M5]  (source: explicit-locking.txt)
- A transaction can hold conflicting locks on the same row (even in different subtransactions); two different transactions never can. "Row-level locks do not affect data querying; they block only writers and lockers to the same row." Released at transaction end or on savepoint rollback.
- Modes (strongest to weakest):
  1. `FOR UPDATE`: rows are locked as though for update; blocks other transactions' UPDATE, DELETE, SELECT FOR UPDATE, SELECT FOR NO KEY UPDATE, SELECT FOR SHARE, SELECT FOR KEY SHARE on those rows. Also acquired by any `DELETE` on a row and by an `UPDATE` that modifies the values of certain columns: currently those having a unique index usable in a foreign key (partial and expression indexes not considered). In REPEATABLE READ or SERIALIZABLE, an error is thrown if a row to be locked has changed since the transaction started.
  2. `FOR NO KEY UPDATE`: like FOR UPDATE but weaker; does not block SELECT FOR KEY SHARE. Acquired by any `UPDATE` that does not acquire a FOR UPDATE lock.
  3. `FOR SHARE`: shared lock; blocks UPDATE, DELETE, SELECT FOR UPDATE, SELECT FOR NO KEY UPDATE; allows SELECT FOR SHARE and SELECT FOR KEY SHARE.
  4. `FOR KEY SHARE`: weakest; blocks SELECT FOR UPDATE, DELETE, and any UPDATE that changes key values; allows other UPDATEs, SELECT FOR NO KEY UPDATE, SELECT FOR SHARE, SELECT FOR KEY SHARE.
- "PostgreSQL doesn't remember any information about modified rows in memory, so there is no limit on the number of rows locked at one time. However, locking a row might cause a disk write, e.g., SELECT FOR UPDATE modifies selected rows to mark them locked".
- Conflict matrix: see Table 13.3 in "Complete inventories".

### Page-level locks  [M5, M2]  (source: explicit-locking.txt)
- Page-level share/exclusive locks control read/write access to table pages in the shared buffer pool; released immediately after a row is fetched or updated. Application developers normally need not be concerned.

### Deadlocks  [M5]  (source: explicit-locking.txt)
- PostgreSQL automatically detects deadlocks and resolves them by aborting one of the transactions involved; which one is hard to predict and should not be relied upon.
- Row-lock deadlock scenario (no explicit locking needed):
  1. T1: `UPDATE accounts SET balance = balance + 100.00 WHERE acctnum = 11111;` (locks row 11111)
  2. T2: `UPDATE accounts SET balance = balance + 100.00 WHERE acctnum = 22222;` (locks row 22222)
  3. T2: `UPDATE accounts SET balance = balance - 100.00 WHERE acctnum = 11111;` (waits for T1)
  4. T1: `UPDATE accounts SET balance = balance - 100.00 WHERE acctnum = 22222;` (waits for T2) => deadlock; one transaction is aborted.
- Defenses: acquire locks on multiple objects in a consistent order; make the first lock acquired on an object the most restrictive mode that will be needed; otherwise retry transactions that abort due to deadlock.
- Without a deadlock, a transaction waits indefinitely for conflicting locks; do not hold transactions open for long (e.g. waiting for user input).

### Advisory locks  [M5]  (source: explicit-locking.txt)
- Application-defined meaning; the system does not enforce their use. Faster than a flag column, avoid table bloat, cleaned up automatically at session end.
- Session level: held until explicitly released or the session ends; does NOT honor transaction semantics (a lock acquired in a transaction that rolls back is still held; an unlock is effective even if the transaction later fails). Reentrant: each lock request needs a matching unlock.
- Transaction level: released automatically at end of transaction; no explicit unlock operation.
- Session-level and transaction-level requests for the same identifier block each other as expected. A session already holding a lock always succeeds on additional requests for it, even if other sessions are waiting.
- Visible in `pg_locks`. Advisory and regular locks share a shared-memory pool sized by `max_locks_per_transaction` and `max_connections`; exhausting it prevents granting any locks; practical limit tens to hundreds of thousands of advisory locks.
- LIMIT pitfall:
  - `SELECT pg_advisory_lock(id) FROM foo WHERE id = 12345; -- ok`
  - `SELECT pg_advisory_lock(id) FROM foo WHERE id > 12345 LIMIT 100; -- danger!` (LIMIT is not guaranteed to be applied before the locking function runs; extra locks may dangle until session end)
  - `SELECT pg_advisory_lock(q.id) FROM ( SELECT id FROM foo WHERE id > 12345 LIMIT 100 ) q; -- ok`
- Functions are documented in section 9.28.10 (outside this slice).

### Application-level consistency checks  [M5]  (source: applevel-consistency.txt)
- Read Committed is hard to use for business rules: the view shifts with each statement, and a single statement may not even stay within its snapshot when a write conflict occurs.
- Read/write conflict: if one transaction writes data and a concurrent one reads it, the reader appears to have executed first regardless of start or commit order. If the reader also writes data read by a third concurrent transaction, a cycle can appear in the apparent execution order (especially when the transaction appearing last commits first). Serializable = Repeatable Read + nonblocking monitoring for such dangerous patterns; one transaction is rolled back to break the cycle.
- With Serializable for all writes and all reads needing consistency, nothing else is needed. Use a framework that retries on serialization failure; consider `default_transaction_isolation = serializable`; check the isolation level in triggers to prevent other levels.
- Warning: Serializable protection does not extend to hot standby or logical replicas; use Repeatable Read plus explicit locking on the primary in that case.
- Explicit blocking locks: `SELECT FOR UPDATE`, `SELECT FOR SHARE` lock returned rows; `LOCK TABLE` locks the table. `SELECT FOR UPDATE` does not ensure a concurrent transaction will not update/delete the row after the lock holder finishes; to do that "you must actually update the row, even if no values need to be changed".
- Global validity checks (sum of credits = sum of debits): two SELECT sum(...) in Read Committed are unreliable; in one Repeatable Read transaction they reflect only transactions committed before it started. A `SHARE` mode (or higher) lock guarantees there are no uncommitted changes in the locked table other than those of the current transaction.
- In Repeatable Read obtain locks before running queries: the snapshot is frozen at the start of the first query or data-modification command (SELECT, INSERT, UPDATE, DELETE, MERGE), so a lock taken afterwards may postdate changes the snapshot cannot see.

### Serialization failure handling  [M5]  (source: mvcc-serialization-failure-handling.txt)
- SQLSTATE `40001` (`serialization_failure`): from Repeatable Read and Serializable; retry unconditionally.
- SQLSTATE `40P01` (`deadlock_detected`): advisable to retry.
- SQLSTATE `23505` (`unique_violation`) and `23P01` (`exclusion_violation`): sometimes appropriate to retry (e.g. two instances choosing the same new key); they may also be persistent errors, so more care is needed.
- Retry the complete transaction including the logic deciding which SQL and values to use. PostgreSQL offers no automatic retry facility. A retry is not guaranteed to succeed; with a conflicting prepared transaction, progress may be impossible until it commits or rolls back.

### MVCC caveats  [M5]  (source: mvcc-caveats.txt)
- `TRUNCATE` and the table-rewriting forms of `ALTER TABLE` are not MVCC-safe: after they commit, the table appears empty to concurrent transactions using a snapshot taken before the DDL committed (only for transactions that had not accessed the table before the DDL started, since otherwise their ACCESS SHARE lock would block the DDL).
- Serializable is not supported on hot standby; the strictest level there is Repeatable Read, which can see transient states inconsistent with any serial execution on the primary.
- Internal system catalog access does not use the current transaction's isolation level: newly created objects (tables) are visible to concurrent Repeatable Read and Serializable transactions though their rows are not. Explicit catalog queries do follow the snapshot.

### Locking and indexes  [M5, M4]  (source: locking-indexes.txt)
- B-tree, GiST, SP-GiST: short-term share/exclusive page-level locks, released immediately after each index row is fetched or inserted; highest concurrency without deadlock conditions.
- Hash: share/exclusive hash-bucket-level locks, released after the whole bucket is processed; deadlock is possible since locks are held longer than one index operation.
- GIN: short-term share/exclusive page-level locks; inserting one GIN-indexed value usually produces several index key insertions per row.
- B-tree offers the best performance for concurrent applications and is the recommended type for scalar data.

### EXPLAIN basics: plan anatomy  [M4]  (source: using-explain.txt)
- A plan is a tree of plan nodes. Leaf nodes are scan nodes (sequential, index, bitmap index scans; also VALUES and set-returning functions in FROM). Join, aggregate, sort and other nodes sit above them. One output line per node; indented extra lines show node properties. The top line's total cost is what the planner minimizes.
- Output formats: text (default), XML, JSON, YAML.
- `Seq Scan on tenk1  (cost=0.00..445.00 rows=10000 width=244)`, left to right:
  1. Estimated start-up cost: time before the output phase can begin (e.g. sorting in a Sort node).
  2. Estimated total cost, assuming the node runs to completion (a parent such as LIMIT may stop early).
  3. Estimated rows output by the node (emitted, not scanned), assuming it runs to completion.
  4. Estimated average row width in bytes.
- Costs are arbitrary units set by the planner cost parameters; by convention `seq_page_cost` = 1.0 and the others are relative to it. A parent's cost includes all its children. Costs ignore converting output to text and sending it to the client.
- Seq scan cost formula: (disk pages read * `seq_page_cost`) + (rows scanned * `cpu_tuple_cost`). Defaults `seq_page_cost` 1.0, `cpu_tuple_cost` 0.01. tenk1: 345 pages, 10000 rows => 345 + 100 = 445. Adding `WHERE unique1 < 7000` adds 10000 * `cpu_operator_cost` (cost 470) because every row is still checked.
- Node walkthrough (regression database `tenk1`):
  - `Filter:` line: condition checked on each scanned row.
  - `Bitmap Heap Scan` + `Recheck Cond` over `Bitmap Index Scan` + `Index Cond` (unique1 < 100): two-level plan; the upper node sorts row locations into physical order before fetching. A condition the index cannot apply (`stringu1 = 'xxx'`) shows as `Filter:` on the heap scan, lowering rows but not cost.
  - `Index Scan using tenk1_unique1` (unique1 = 42): rows fetched in index order; typical for single-row lookups and for ORDER BY matching the index.
  - `Sort` with `Sort Key:` over a Seq Scan for `ORDER BY unique1`.
  - `Incremental Sort` with `Sort Key: hundred, ten` and `Presorted Key: hundred`: used when a prefix of the sort keys is already ordered; can return tuples before the whole set is sorted (good with LIMIT), may use less memory and spill less, but has batching overhead.
  - `BitmapAnd` (or `BitmapOr`) combining two Bitmap Index Scans.
  - `Limit` over `Index Scan`: the child's cost and rows are shown as if run to completion; the Limit node's cost is a fraction of it. The planner preferred this over the bitmap plan because Limit cannot avoid the bitmap scan's start-up cost.
  - `Nested Loop`: first child is outer, second is inner; the inner runs once per outer row with outer values plugged in (`Index Cond: (unique2 = t1.unique2)`). Loop cost = outer cost + one inner repetition per outer row (10 * 7.90) + a little CPU.
  - `Join Filter:` on a join node for conditions mentioning both tables (`t1.hundred < t2.hundred`). With outer joins, `Join Filter` comes from the ON clause (failing rows can still emerge null-extended) while plain `Filter` removes rows unconditionally; no difference for inner joins.
  - `Materialize`: saves the inner relation in memory so it is scanned once although read many times.
  - `Hash Join` with `Hash Cond:` over a `Hash` node: one input is loaded into an in-memory hash table, the other is scanned and probed.
  - `Merge Join` with `Merge Cond:`: inputs sorted on join keys, by index scan or by seq scan and sort ("Sequential-scan-and-sort frequently beats an index scan for sorting many rows").
- `enable_*` flags (e.g. `SET enable_mergejoin = off;`) mostly only discourage a node type, so a plan can always be formed. A disabled node used anyway shows `Disabled: true` (e.g. Seq Scan on a table with no indexes under `enable_seqscan = off`).
- Subplans: `SubPlan 1` run per outer row; `(SubPlan 1).col1` names its Nth output column; values from the outer level can be passed down (`t.four`). `hashed SubPlan 1`: the sub-SELECT runs once into an in-memory hash table probed by ANY/NOT IN; requires no outer references and a hashable comparison operator. `InitPlan 1`: a sub-SELECT with no outer references that returns at most one row runs once per execution of the outer plan (`(InitPlan 1).col1`), e.g. `random()` evaluated only once.
- `EXPLAIN VERBOSE` adds `Output:` lines and schema-qualified names.

### EXPLAIN ANALYZE and BUFFERS  [M4, M2]  (source: using-explain.txt)
- `EXPLAIN ANALYZE` executes the query and shows `(actual time=START..TOTAL rows=N.NN loops=L)` next to the estimates. Actual times are milliseconds of real time; costs are arbitrary units, so they will not match. Most important check: are estimated row counts close to actual ones?
- PostgreSQL 18 prints actual rows with two decimals (`rows=10.00`).
- `loops`: total executions of the node; actual time and rows are per-execution averages. Multiply by loops for totals (10 loops * 0.003 ms = 0.030 ms on the inner index scan).
- Extra lines shown:
  - `Sort Method: quicksort  Memory: 74kB` (in-memory vs on-disk sort and memory or disk used).
  - `Buckets: 1024  Batches: 1  Memory Usage: 35kB` on Hash nodes (peak hash table memory; more than one batch means disk use, which is not shown).
  - `Heap Blocks: exact=10` on Bitmap Heap Scan.
  - `Index Searches: N` on Index Scan, Bitmap Index Scan and Index-Only Scan: total index descents across all loops. `thousand IN (1, 500, 700, 999)` => 4 searches; `IN (1, 2, 3, 4)` => 1 search (values on the same leaf page). Skip scan: `four BETWEEN 1 AND 3 AND unique1 = 42` on index (four, unique1) => `Index Searches: 3`.
  - `Heap Fetches: 0` on Index Only Scan.
  - `Rows Removed by Filter: 3000` (only printed when at least one row or join pair is rejected).
  - `Rows Removed by Index Recheck: 1` for lossy index scans (GiST polygon containment returns overlapping candidates that must be rechecked).
  - `Planning:` / `Buffers:` block, `Planning Time:`, `Execution Time:`.
- `BUFFERS`: counts of non-distinct buffers `shared hit`, `read`, `dirtied`, `written` for the node and all its children. In PostgreSQL 18, `ANALYZE` implicitly enables BUFFERS; disable with `EXPLAIN (ANALYZE, BUFFERS OFF) ...`.
- EXPLAIN ANALYZE has side effects; wrap data-modifying statements in `BEGIN; ... ROLLBACK;`. INSERT/UPDATE/DELETE/MERGE work is done by a top-level `Insert`/`Update`/`Delete`/`Merge` node, which the planner does not cost (same for every plan). On partitioned/inheritance targets the node lists `Update on <child> <alias>` lines matching an `Append` of per-child subplans.
- `Planning Time` = generating and optimizing the plan from the parsed query (excludes parsing and rewriting). `Execution Time` includes executor start-up and shut-down and fired triggers, excludes parsing, rewriting, planning. BEFORE trigger time is included in the modifying node; AFTER trigger time is not (fired after the whole plan); per-trigger totals are shown separately; deferred constraint triggers are not counted.
- Top-level node time excludes converting output to displayable form; the `SERIALIZE` option measures that, shown separately and included in Execution Time.
- Caveats:
  - No network transmission cost; no I/O conversion cost unless SERIALIZE. Timing overhead can be large with slow `gettimeofday()`; measure with `pg_test_timing`.
  - Do not extrapolate from toy tables; costs are non-linear; a one-page table nearly always gets a seq scan.
  - LIMIT-stopped nodes show estimates as if run to completion but actual rows are smaller: not an estimation error.
  - Merge join may stop reading one input early; duplicate outer keys cause the inner to be backed up and rescanned, and those re-emitted rows are counted, so the inner's actual rows can exceed the relation's size.
  - `BitmapAnd` and `BitmapOr` always report actual rows as zero.
  - Run-time partition pruning: Append/MergeAppend children that cannot produce rows are omitted and `Subplans Removed: N` is shown.

### Planner statistics  [M4]  (source: planner-stats.txt)
- `pg_class.reltuples` and `pg_class.relpages` per table and index (`relkind` r = table, i = index). Not updated on the fly; updated by VACUUM, ANALYZE and some DDL such as CREATE INDEX. A partial-table VACUUM/ANALYZE updates reltuples incrementally (approximate). The planner scales them to the current physical table size.
- Selectivity statistics live in `pg_statistic` (updated by ANALYZE and VACUUM ANALYZE; always approximate). Readable only by superusers. The view `pg_stats` is readable by all and shows only tables the user can read. Example columns: `attname`, `inherited`, `n_distinct`, `most_common_vals`, `histogram_bounds`. Two rows per column for inheritance parents: `inherited = t` (whole hierarchy) and `inherited = f` (parent only). Negative `n_distinct` (e.g. -0.5681108) is a fraction of rows.
- Statistics target: max entries in `most_common_vals` and `histogram_bounds` per column; per column via `ALTER TABLE ... ALTER COLUMN ... SET STATISTICS`, globally via `default_statistics_target`; default 100. Higher = more accurate for irregular distributions, more space and planning time.
- Extended statistics: the planner assumes conditions are independent; correlated columns break that. `CREATE STATISTICS` only creates a catalog entry (`pg_statistic_ext`); ANALYZE (manual or auto-analyze) collects the data into `pg_statistic_ext_data`, using the same row sample as regular statistics (a larger target gives a larger sample).
  1. `dependencies` (functional dependencies): `CREATE STATISTICS stts (dependencies) ON city, zip FROM zipcodes;` `stxddependencies` = `{"1 => 5": 1.000000, "5 => 1": 0.423130}` (zip fully determines city; city determines zip 42% of the time). Used only for equality conditions against constants and IN lists of constants; not for column-to-column or column-to-expression equality, ranges, LIKE, etc. Assumes conditions are compatible: `city = 'San Francisco' AND zip = '90210'` is still estimated as non-empty although it returns zero rows.
  2. `ndistinct` (multivariate n-distinct): improves GROUP BY a, b estimates. `CREATE STATISTICS stts2 (ndistinct) ON city, state, zip FROM zipcodes;` collects every combination of two or more listed columns: `stxdndistinct` = `{"1, 2": 33178, "1, 5": 33178, "2, 5": 27435, "1, 2, 5": 33178}`.
  3. `mcv` (multivariate MCV lists): stores common value combinations. `CREATE STATISTICS stts3 (mcv) ON city, state FROM zipcodes;` inspect with `pg_mcv_list_items(stxdmcv)` columns `index`, `values`, `nulls`, `frequency`, `base_frequency`. {Washington, DC}: frequency 0.003467 vs base_frequency 2.7e-05 (two orders of magnitude underestimate without it). 99 rows listed.
- Advice: create each kind only for column groups that are strongly correlated / actually grouped / actually used together, where misestimation causes bad plans.

### Controlling join order  [M4]  (source: explicit-joins.txt)
- All executor joins are between two inputs. For inner joins the planner explores all join orders; the count grows exponentially; beyond about ten tables exhaustive search is impractical (even 6-7 can be slow). Above `geqo_threshold` FROM items the planner switches to genetic query optimization (GEQO), which is faster but not guaranteed optimal.
- Outer joins constrain order: `a LEFT JOIN (b JOIN c ON ...) ON ...` must join B to C first. `a LEFT JOIN b ... LEFT JOIN c ...` may join A to either first. Only `FULL JOIN` completely constrains join order.
- Explicit inner join syntax (`INNER JOIN`, `CROSS JOIN`, plain `JOIN`) is semantically the same as a FROM list and does not constrain order, unless `join_collapse_limit = 1`, which forces the explicit JOIN order. `SELECT * FROM a CROSS JOIN b, c, d, e WHERE ...;` with limit 1 forces A-B first and reduces join orders by a factor of 5.
- Subquery collapsing (e.g. views containing joins): the planner pulls subqueries into the parent unless that would produce more than `from_collapse_limit` FROM items. Typical settings: `join_collapse_limit = from_collapse_limit`, or `join_collapse_limit = 1` to control order by hand.
- Defaults for geqo_threshold, join_collapse_limit, from_collapse_limit are not stated in this slice (they are in section 19.7).

### Populating a database (bulk load)  [M7, M4]  (source: populate.txt)
1. Disable autocommit: one BEGIN ... COMMIT around many INSERTs (also all-or-nothing).
2. Use `COPY` (faster than INSERT even when PREPAREd and batched). If COPY is impossible, `PREPARE` an INSERT and `EXECUTE` repeatedly. COPY is fastest in the same transaction as an earlier `CREATE TABLE` or `TRUNCATE`: no WAL needs to be written, but only when `wal_level` is `minimal`.
3. Remove indexes: create table, COPY, then create indexes (faster than incremental maintenance). Think twice before dropping a unique index.
4. Remove foreign key constraints and re-create them after loading; with FKs in place each row adds an entry to the pending trigger event queue, which can overflow memory with many millions of rows. Alternatively split the load into smaller transactions.
5. Increase `maintenance_work_mem` temporarily: speeds CREATE INDEX and ALTER TABLE ADD FOREIGN KEY, not COPY itself.
6. Increase `max_wal_size` temporarily: fewer checkpoints than normal (`checkpoint_timeout` governs normal frequency); each checkpoint flushes all dirty pages.
7. Disable WAL archival and streaming replication: `wal_level = minimal`, `archive_mode = off`, `max_wal_senders = 0` (restart required; makes earlier base backups unusable for archive recovery and standbys). With minimal WAL, commands on tables created or truncated in the current (sub)transaction skip WAL and fsync at the end.
8. Run `ANALYZE` (or VACUUM ANALYZE) afterwards; autovacuum may do it.
- pg_dump restores: pg_dump already uses COPY and loads data before indexes and FKs. Still do: raise maintenance_work_mem and max_wal_size; disable archiving/replication then take a fresh base backup; use parallel `-j`; consider `-1` / `--single-transaction` for psql or pg_restore (any error rolls back everything); `pg_restore --jobs`; ANALYZE afterwards. Data-only dumps do not drop/recreate indexes or touch FKs; `--disable-triggers` eliminates (not postpones) FK validation.

### Non-durable settings  [M7]  (source: non-durability.txt)
- Except as noted, durability still holds against a database software crash; only an abrupt OS crash risks loss or corruption.
- Options: data directory on a RAM disk; `fsync` off; `synchronous_commit` off (risks transaction loss but not corruption, even on a database crash); `full_page_writes` off; increase `max_wal_size` and `checkpoint_timeout` (fewer checkpoints, more space in `pg_wal`); unlogged tables (no WAL, not crash-safe).

### Parallel query: how it works  [M4, M1]  (source: parallel-query.txt, how-parallel-query-works.txt)
- Speedups of more than 2x, sometimes 4x or more; queries that touch much data but return few rows benefit most.
- A parallel plan contains a `Gather` or `Gather Merge` node with exactly one child: the part run in parallel. At the top of the tree the whole query runs in parallel. Example: `Gather` / `Workers Planned: 2` / `Parallel Seq Scan on pgbench_accounts` / `Filter: (filler ~~ '%x%'::text)`.
- Execution steps:
  1. When execution reaches Gather, the session's process (the leader) requests as many background workers as planned.
  2. Planned workers are capped by `max_parallel_workers_per_gather`; the total that can exist is capped by `max_worker_processes` and `max_parallel_workers`. Fewer workers than planned, or none, may be obtained.
  3. Each started worker executes the parallel portion; the leader executes it too but must also read all worker tuples and run the nodes above Gather. With few tuples the leader acts like an extra worker; with many tuples it does little of the parallel work.
  4. `Gather` returns tuples in any convenient order (destroying sort order); `Gather Merge` means each process produces sorted tuples and the leader does an order-preserving merge.
- If workers are often unavailable, raise `max_worker_processes` and `max_parallel_workers` or lower `max_parallel_workers_per_gather`.

### When parallel query can be used  [M4]  (source: when-can-parallel-query-be-used.txt)
- Global requirements: `max_parallel_workers_per_gather` > 0, and not single-user mode.
- No parallel plan for a query if:
  1. It writes data or locks rows (data-modifying statement at top level or in a CTE). Exceptions where the underlying SELECT may be parallel: `CREATE TABLE ... AS`, `SELECT INTO`, `CREATE MATERIALIZED VIEW`, `REFRESH MATERIALIZED VIEW`.
  2. It might be suspended during execution: `DECLARE CURSOR` cursors, PL/pgSQL `FOR x IN query LOOP .. END LOOP`.
  3. It uses any `PARALLEL UNSAFE` function (user-defined functions are unsafe by default; most system functions are safe).
  4. It runs inside another query that is already parallel (e.g. SQL issued by a function called from a parallel query).
- A parallel plan runs serially (leader only, as if Gather were absent) at execution time if no workers can be obtained due to `max_worker_processes` or `max_parallel_workers`, or if the client sends an Execute message with a non-zero fetch count (extended protocol; libpq cannot send this). If the latter is frequent, set `max_parallel_workers_per_gather = 0` in those sessions.

### Parallel plans  [M4]  (source: parallel-plans.txt)
- The parallel portion must be a partial plan: each process generates a subset of output rows and each row is produced by exactly one process. Usually the driving table scan must be parallel-aware.
- Parallel scans:
  - Parallel sequential scan: table blocks divided into ranges shared among processes; each finishes its range before requesting another.
  - Parallel bitmap heap scan: one leader process scans the index(es) and builds the bitmap; heap blocks are then divided as in a parallel seq scan (the index scan itself is not parallel).
  - Parallel index scan / parallel index-only scan: btree only; processes take turns claiming a single index block and return all tuples it references; results are sorted within each worker.
- Parallel joins: inner side can be any non-parallel plan safe to run in a worker.
  - Nested loop: inner side always non-parallel, executed in full in each process; efficient when the inner is an index scan because outer tuples are divided.
  - Merge join: inner side always non-parallel and fully executed by every process; inefficient if a sort is needed (duplicated).
  - Hash join (non-parallel): every process builds an identical copy of the hash table. Parallel Hash Join: the inner is a Parallel Hash that builds one shared hash table cooperatively.
- Parallel aggregation in two stages: `Partial Aggregate` in each process, results passed through Gather/Gather Merge, `Finalize Aggregate` in the leader. Unattractive when groups approach the number of input rows. Requirements: every aggregate parallel safe with a combine function; `internal` transition states need serialization and deserialization functions. Not supported with DISTINCT or ORDER BY inside an aggregate call, ordered-set aggregates, or GROUPING SETS; all joins must be in the parallel portion.
- Parallel Append: plain Append in a parallel plan has all processes work through children in order; `Parallel Append` spreads processes across children simultaneously (less contention, avoids start-up costs) and may mix partial and non-partial children (non-partial ones scanned by a single process), e.g. Parallel Append of regular Index Scans on partitions. Disable with `enable_parallel_append`.
- Tips: if no parallel plan appears, reduce `parallel_setup_cost` or `parallel_tuple_cost` (even to zero) to test; if still none, see the restrictions. `EXPLAIN (ANALYZE, VERBOSE)` shows per-worker statistics per node.

### Parallel safety  [M4, M6]  (source: parallel-safety.txt)
- Three labels:
  - parallel safe: does not conflict with parallel query.
  - parallel restricted: cannot run in a worker but can run in the leader; never below Gather/Gather Merge.
  - parallel unsafe: cannot run while parallel query is in use, not even in the leader; disables parallel query for the whole query.
- Always parallel restricted: scans of CTEs; scans of temporary tables; scans of foreign tables (unless the FDW's `IsForeignScanParallelSafe` says otherwise); plan nodes referencing a correlated SubPlan.
- User-defined functions and aggregates are assumed PARALLEL UNSAFE unless marked (determining it automatically is equivalent to the Halting Problem). Mark with `PARALLEL SAFE | RESTRICTED | UNSAFE` in CREATE/ALTER FUNCTION, or `PARALLEL = SAFE | RESTRICTED | UNSAFE` in CREATE AGGREGATE.
- Must be UNSAFE if it writes to the database, changes transaction state (other than a subtransaction for error recovery), accesses sequences, or makes persistent setting changes. Must be RESTRICTED if it accesses temporary tables, client connection state, cursors, prepared statements, or backend-local state the system cannot synchronize; `setseed` and `random` are restricted for this reason.
- Mislabeling can cause errors or wrong answers (C functions: undefined behavior). If in doubt label UNSAFE.
- Locks acquired in a worker but not held by the leader are released at worker exit, not end of transaction; mark such functions RESTRICTED if that matters.
- The planner does not defer a parallel-restricted WHERE clause above Gather; a table with a restricted qual is not scanned in the parallel portion.

## Complete inventories

### Built-in general-purpose data types (Table 8.1) with sizes and ranges
| Name | Aliases | Storage | Range / notes |
|---|---|---|---|
| bigint | int8 | 8 bytes | -9223372036854775808 to +9223372036854775807 |
| bigserial | serial8 | 8 bytes | 1 to 9223372036854775807 |
| bit [ (n) ] | | 1 byte per 8 bits + 5 or 8 bytes overhead | fixed length n (bare `bit` = bit(1)) |
| bit varying [ (n) ] | varbit [ (n) ] | 1 byte per 8 bits + 5 or 8 bytes overhead | up to n (bare = unlimited) |
| boolean | bool | 1 byte | true / false / null |
| box | | 32 bytes | rectangular box |
| bytea | | 1 or 4 bytes + binary string | variable binary |
| character [ (n) ] | char [ (n) ], bpchar(n) | 1 byte header (<=126 bytes) or 4, plus padded string | n <= 10,485,760 characters |
| character varying [ (n) ] | varchar [ (n) ] | 1 or 4 byte header + string | n <= 10,485,760; about 1 GB max string |
| cidr | | 7 or 19 bytes | IPv4/IPv6 network |
| circle | | 24 bytes | center + radius |
| date | | 4 bytes | 4713 BC to 5874897 AD, 1 day resolution |
| double precision | float, float8 | 8 bytes | about 1E-307 to 1E+308, at least 15 digits |
| inet | | 7 or 19 bytes | IPv4/IPv6 host and optional netmask |
| integer | int, int4 | 4 bytes | -2147483648 to +2147483647 |
| interval [ fields ] [ (p) ] | | 16 bytes | -178000000 to 178000000 years, 1 microsecond |
| json | | text copy of input | textual JSON |
| jsonb | | decomposed binary | binary JSON |
| line | | 24 bytes | infinite line {A,B,C} |
| lseg | | 32 bytes | line segment |
| macaddr | | 6 bytes | MAC address |
| macaddr8 | | 8 bytes | EUI-64 MAC |
| money | | 8 bytes | -92233720368547758.08 to +92233720368547758.07 |
| numeric [ (p, s) ] | decimal [ (p, s) ] | variable: 2 bytes per 4 decimal digits + 3 to 8 bytes overhead | up to 131072 digits before point, 16383 after; declared precision max 1000; scale -1000..1000 |
| path | | 16+16n bytes | open or closed path |
| pg_lsn | | 64-bit integer | 0/0 to FFFFFFFF/FFFFFFFF |
| pg_snapshot | | (not stated) | user-level transaction ID snapshot |
| point | | 16 bytes | (x,y) |
| polygon | | 40+16n bytes | closed polygon with stored bounding box |
| real | float4 | 4 bytes | about 1E-37 to 1E+37, at least 6 digits |
| smallint | int2 | 2 bytes | -32768 to +32767 |
| smallserial | serial2 | 2 bytes | 1 to 32767 |
| serial | serial4 | 4 bytes | 1 to 2147483647 |
| text | | 1 or 4 byte header + string | unlimited (about 1 GB) |
| time [ (p) ] [ without time zone ] | | 8 bytes | 00:00:00 to 24:00:00, 1 microsecond |
| time [ (p) ] with time zone | timetz | 12 bytes | 00:00:00+1559 to 24:00:00-1559 |
| timestamp [ (p) ] [ without time zone ] | | 8 bytes | 4713 BC to 294276 AD, 1 microsecond |
| timestamp [ (p) ] with time zone | timestamptz | 8 bytes | 4713 BC to 294276 AD, stored as UTC |
| tsquery | | (not stated) | text search query |
| tsvector | | (not stated) | text search document; must be < 1 MB |
| txid_snapshot | | (not stated) | deprecated; see pg_snapshot |
| uuid | | 128 bits | RFC 9562 identifier |
| xml | | (not stated) | XML data; requires --with-libxml |

### Other types defined in ch.8
- Internal character types: `"char"` (1 byte), `name` (64 bytes, 63 usable).
- Enum values: 4 bytes on disk; labels up to 63 bytes.
- System identifier types: `oid` (unsigned 4 bytes), `xid` (32-bit), `xid8` (64-bit), `cid` (32-bit), `tid` (block number, tuple index).
- OID alias types (Table 8.26): `regclass` (pg_class), `regcollation` (pg_collation), `regconfig` (pg_ts_config), `regdictionary` (pg_ts_dict), `regnamespace` (pg_namespace), `regoper` (pg_operator), `regoperator` (pg_operator), `regproc` (pg_proc), `regprocedure` (pg_proc), `regrole` (pg_authid), `regtype` (pg_type).
- Range types / multirange types: `int4range`/`int4multirange`, `int8range`/`int8multirange`, `numrange`/`nummultirange`, `tsrange`/`tsmultirange`, `tstzrange`/`tstzmultirange`, `daterange`/`datemultirange`.
- jsonpath type; composite types; domains; arrays of any base, enum, composite, range or domain type.
- Pseudo-types (Table 8.27): `any`, `anyelement`, `anyarray`, `anynonarray`, `anyenum`, `anyrange`, `anymultirange`, `anycompatible`, `anycompatiblearray`, `anycompatiblenonarray`, `anycompatiblerange`, `anycompatiblemultirange`, `cstring`, `internal`, `language_handler`, `fdw_handler`, `table_am_handler`, `index_am_handler`, `tsm_handler`, `record`, `trigger`, `event_trigger`, `pg_ddl_command`, `void`, `unknown`.
- UUID functions (section 9.14, cross-checked): `gen_random_uuid()`, `uuidv4()`, `uuidv7([shift interval])`, `uuid_extract_timestamp(uuid)`, `uuid_extract_version(uuid)`.

### Index access methods: capabilities stated in ch.11 / ch.13 / ch.15
| AM | Built-in operators (examples from ch.11) | Multicolumn | Unique | INCLUDE | Index-only scan | Sorted output | Parallel scan | Locking (13.7) |
|---|---|---|---|---|---|---|---|---|
| B-tree | `< <= = >= >`, BETWEEN, IN, IS [NOT] NULL, anchored LIKE/`~` | yes (leading-column rule, skip scan) | yes (only AM) | yes | always | yes (only AM) | yes (index and index-only) | short-term page locks, no deadlocks |
| Hash | `=` (32-bit hash code) | no | no | no | no | no | no | bucket-level locks, deadlock possible |
| GiST | geometric `<< &< &> >> <<| &<| |&> |>> @> <@ ~= &&`; nearest-neighbor `<->` | yes (first column most important) | no | yes | some opclasses | no | no | short-term page locks |
| SP-GiST | points `<< >> ~= <@ <<| |>>`; nearest-neighbor | no | no | yes | some opclasses | no | no | short-term page locks |
| GIN | arrays `<@ @> = &&`; jsonb `? ?| ?& @> @? @@` | yes (any column equally) | no | no | no | no | no | short-term page locks; several keys per row |
| BRIN | min/max `< <= = >= >` per block range | yes (any column equally) | no | no | no | no | no | not covered |
| bloom (extension) | listed as an index type only | | | | | | | |
- Index limits: 32 columns including INCLUDE columns. Only one collation per index column.
- Operator classes named in the slice: `int4_ops`, `text_pattern_ops`, `varchar_pattern_ops`, `bpchar_pattern_ops`, `jsonb_ops` (default GIN), `jsonb_path_ops`, `tsvector_ops` (GiST with `siglen`, default 124, max 2024 bytes).
- Index-related catalogs: `pg_am`, `pg_opclass`, `pg_opfamily`, `pg_amop`; psql `\dAc`, `\dAf`, `\dAo`.

### Table 13.2: table-level lock conflicts (X = conflict)
| Requested \ Existing | ACCESS SHARE | ROW SHARE | ROW EXCL. | SHARE UPDATE EXCL. | SHARE | SHARE ROW EXCL. | EXCL. | ACCESS EXCL. |
|---|---|---|---|---|---|---|---|---|
| ACCESS SHARE | | | | | | | | X |
| ROW SHARE | | | | | | | X | X |
| ROW EXCL. | | | | | X | X | X | X |
| SHARE UPDATE EXCL. | | | | X | X | X | X | X |
| SHARE | | | X | X | | X | X | X |
| SHARE ROW EXCL. | | | X | X | X | X | X | X |
| EXCL. | | X | X | X | X | X | X | X |
| ACCESS EXCL. | X | X | X | X | X | X | X | X |
- Self-conflicting modes: SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Not self-conflicting: ACCESS SHARE, ROW SHARE, ROW EXCLUSIVE, SHARE.
- Internal names: AccessShareLock, RowShareLock, RowExclusiveLock, ShareUpdateExclusiveLock, ShareLock, ShareRowExclusiveLock, ExclusiveLock, AccessExclusiveLock.
- Acquirers: ACCESS SHARE (SELECT); ROW SHARE (SELECT FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE); ROW EXCLUSIVE (INSERT, UPDATE, DELETE, MERGE); SHARE UPDATE EXCLUSIVE (VACUUM non-FULL, ANALYZE, CREATE INDEX CONCURRENTLY, CREATE STATISTICS, COMMENT ON, REINDEX CONCURRENTLY, some ALTER INDEX/TABLE); SHARE (CREATE INDEX); SHARE ROW EXCLUSIVE (CREATE TRIGGER, some ALTER TABLE); EXCLUSIVE (REFRESH MATERIALIZED VIEW CONCURRENTLY); ACCESS EXCLUSIVE (DROP TABLE, TRUNCATE, REINDEX, CLUSTER, VACUUM FULL, REFRESH MATERIALIZED VIEW, many ALTER INDEX/TABLE, default LOCK TABLE).

### Table 13.3: row-level lock conflicts (X = conflict)
| Requested \ Current | FOR KEY SHARE | FOR SHARE | FOR NO KEY UPDATE | FOR UPDATE |
|---|---|---|---|---|
| FOR KEY SHARE | | | | X |
| FOR SHARE | | | X | X |
| FOR NO KEY UPDATE | | X | X | X |
| FOR UPDATE | X | X | X | X |
- Implicit acquirers: FOR UPDATE by DELETE and by UPDATE that changes columns with a unique index usable by a foreign key; FOR NO KEY UPDATE by every other UPDATE.
- Other lock kinds in ch.13: page-level share/exclusive buffer locks; predicate locks (`SIReadLock` in `pg_locks`); advisory locks (session-level and transaction-level).

### Isolation levels and SQLSTATEs
- Levels: READ UNCOMMITTED (= READ COMMITTED in PG), READ COMMITTED (default), REPEATABLE READ (snapshot isolation), SERIALIZABLE (SSI).
- Error messages: `could not serialize access due to concurrent update` (RR/SER update conflict); `could not serialize access due to read/write dependencies among transactions` (SSI).
- SQLSTATEs: `40001` serialization_failure, `40P01` deadlock_detected, `23505` unique_violation, `23P01` exclusion_violation.

### GUCs named in this slice (default given only where the slice states one)
- Data types / output: `extra_float_digits` (values described; >0 = shortest-precise), `bytea_output` (default `hex`), `DateStyle` (default output style ISO), `IntervalStyle` (default `postgres`), `TimeZone`, `log_timezone`, `timezone_abbreviations`, `lc_monetary`, `lc_ctype`, `xmloption` (default CONTENT), `array_nulls`.
- Text search: `default_text_search_config` (set at initdb/installation).
- Concurrency: `default_transaction_isolation`, `idle_in_transaction_session_timeout`, `max_pred_locks_per_transaction`, `max_pred_locks_per_relation`, `max_pred_locks_per_page`, `max_locks_per_transaction`, `max_connections`.
- Planner costs: `seq_page_cost` (1.0), `cpu_tuple_cost` (0.01), `cpu_operator_cost`, `random_page_cost`, `parallel_setup_cost`, `parallel_tuple_cost`.
- Planner method switches: `enable_seqscan`, `enable_nestloop`, `enable_mergejoin`, `enable_parallel_append` (others exist in section 19.7.1).
- Planner structure: `geqo_threshold`, `join_collapse_limit`, `from_collapse_limit`, `default_statistics_target` (100).
- Bulk load / durability: `maintenance_work_mem`, `max_wal_size`, `checkpoint_timeout`, `wal_level`, `archive_mode`, `max_wal_senders`, `fsync`, `synchronous_commit`, `full_page_writes`.
- Parallel: `max_parallel_workers_per_gather`, `max_worker_processes`, `max_parallel_workers`.
- Index storage parameter: BRIN `pages_per_range`.

### EXPLAIN vocabulary seen in ch.14 / ch.15
- Options: `ANALYZE`, `VERBOSE`, `BUFFERS` (on by default with ANALYZE in 18; `BUFFERS OFF`), `SERIALIZE`, output formats TEXT, XML, JSON, YAML.
- Node types: Seq Scan, Index Scan, Index Only Scan, Bitmap Index Scan, Bitmap Heap Scan, BitmapAnd, BitmapOr, Sort, Incremental Sort, Limit, Nested Loop, Hash Join, Hash, Merge Join, Materialize, Result, SubPlan, hashed SubPlan, InitPlan, Append, MergeAppend, Insert, Update, Delete, Merge, Gather, Gather Merge, Parallel Seq Scan, Parallel Hash, Parallel Hash Join, Parallel Append, Partial Aggregate, Finalize Aggregate.
- Property lines: Filter, Index Cond, Recheck Cond, Join Filter, Hash Cond, Merge Cond, Sort Key, Presorted Key, Sort Method / Memory, Buckets / Batches / Memory Usage, Heap Blocks: exact=, Heap Fetches, Index Searches, Rows Removed by Filter, Rows Removed by Index Recheck, Buffers: shared hit/read/dirtied/written, Disabled: true, Output (VERBOSE), Workers Planned, Subplans Removed, Planning, Planning Time, Execution Time.

### Extended statistics kinds and catalogs
- Kinds: `dependencies`, `ndistinct`, `mcv` (via `CREATE STATISTICS name (kinds) ON cols FROM table`).
- Catalogs and functions: `pg_statistic_ext` (stxname, stxkeys), `pg_statistic_ext_data` (stxoid, stxddependencies, stxdndistinct, stxdmcv), `pg_mcv_list_items()`; single-column: `pg_statistic`, `pg_stats`, `pg_class.reltuples`, `pg_class.relpages`.

### Parallel safety
- Labels: PARALLEL SAFE, PARALLEL RESTRICTED, PARALLEL UNSAFE (default for user functions).
- Always restricted: CTE scans, temp table scans, foreign table scans (unless `IsForeignScanParallelSafe`), nodes referencing correlated SubPlans.
- Statements that disable parallelism: any data-modifying statement (top level or CTE) except CREATE TABLE AS, SELECT INTO, CREATE MATERIALIZED VIEW, REFRESH MATERIALIZED VIEW; DECLARE CURSOR; PL/pgSQL FOR-IN-query loops; queries nested in a parallel query.

### Full text search inventories
- Default parser `pg_catalog.default` token types (tokid, alias, description): 1 asciiword (Word, all ASCII); 2 word (Word, all letters); 3 numword (Word, letters and digits); 4 email (Email address); 5 url (URL); 6 host (Host); 7 sfloat (Scientific notation); 8 version (Version number); 9 hword_numpart (Hyphenated word part, letters and digits); 10 hword_part (Hyphenated word part, all letters); 11 hword_asciipart (Hyphenated word part, all ASCII); 12 blank (Space symbols); 13 tag (XML tag); 14 protocol (Protocol head); 15 numhword (Hyphenated word, letters and digits); 16 asciihword (Hyphenated word, all ASCII); 17 hword (Hyphenated word, all letters); 18 url_path (URL path); 19 file (File or path name); 20 float (Decimal notation); 21 int (Signed integer); 22 uint (Unsigned integer); 23 entity (XML entity).
- Parser functions: prsd_start, prsd_nexttoken, prsd_end, prsd_headline, prsd_lextype.
- Templates: ispell, simple, snowball, synonym, thesaurus.
- Built-in dictionaries (`\dFd`): arabic_stem, armenian_stem, basque_stem, catalan_stem, danish_stem, dutch_stem, english_stem, estonian_stem, finnish_stem, french_stem, german_stem, greek_stem, hindi_stem, hungarian_stem, indonesian_stem, irish_stem, italian_stem, lithuanian_stem, nepali_stem, norwegian_stem, portuguese_stem, romanian_stem, russian_stem, serbian_stem, simple, spanish_stem, swedish_stem, tamil_stem, turkish_stem, yiddish_stem.
- Functions: to_tsvector, setweight, length, strip, to_tsquery, plainto_tsquery, phraseto_tsquery, websearch_to_tsquery, ts_rank, ts_rank_cd, ts_headline, tsquery_phrase, numnode, querytree, ts_rewrite (two forms), tsvector_update_trigger, tsvector_update_trigger_column, ts_stat, ts_debug, ts_parse, ts_token_type, ts_lexize.
- Operators: `@@` (four signature variants), tsvector `||`, tsquery `&&`, `||`, `!!`, `<->`; in tsquery text `&`, `|`, `!`, `<->`, `<N>`, `:*`, weight letters.
- SQL commands: CREATE/ALTER TEXT SEARCH CONFIGURATION (ADD/ALTER/DROP MAPPING FOR), CREATE/ALTER TEXT SEARCH DICTIONARY. psql: `\dF`, `\dFd`, `\dFp`, `\dFt` (each with `+`).
- Limits: lexeme < 2 KB; <= 256 positions per lexeme; positions 1..16,383; tsvector < 1 MB; tsquery < 1 MB; `<N>` distance <= 16,384; GiST signature default 124 bytes, max 2024.
- ts_rank normalization flags: 0, 1, 2, 4, 8, 16, 32; default weights {0.1, 0.2, 0.4, 1.0} for {D, C, B, A}.
- ts_headline options and defaults: MaxWords 35, MinWords 15, ShortWord 3, HighlightAll false, MaxFragments 0, StartSel `<b>`, StopSel `</b>`, FragmentDelimiter ` ... `.

## Lesson ideas

### Visualizers
- **Storage-size explorer** [M2]: pick a type and value; show bytes using Table 8.1 sizes (numeric: 2 bytes per 4 digits + 3-8 overhead; varlena 1-byte header up to 126 bytes, 4-byte above). Verify with `pg_column_size`.
- **json vs jsonb normalizer** [M2]: animate the same input through both; jsonb drops whitespace, keeps the last duplicate key, reorders keys shorter-first, and prints `1.230e-5` as `0.00001230`.
- **GIN jsonb_ops vs jsonb_path_ops** [M4]: for `{"foo": {"bar": "baz"}}` show 3 independent keys vs 1 hashed path item, then show which operators each can answer and why `{"a": {}}` needs a full scan.
- **Interval internals** [M2]: three cells (months, days, microseconds) filling as `'2 years 15 months 100 weeks 99 hours 123456789 milliseconds'` normalizes to `3 years 3 mons 700 days 133:17:36.789`.
- **Range bounds and canonicalization** [M2]: number line with `[`/`(` brackets; discrete types snap to `[)`; exclusion constraint rejects an overlapping booking.
- **Type resolution stepper** [M4]: walk operator resolution steps 1 to 3.f for `~ '20'` (fails "not unique") vs `@ '-4.5'` (resolves to float8), and the pairwise-UNION failure `NULL UNION NULL UNION 1`.
- **B-tree skip scan** [M4]: index on (four, unique1), query `unique1 = 42`; show 3 descents (`Index Searches: 3`) instead of a full leaf scan; compare with many distinct leading values.
- **Bitmap scan pipeline** [M4]: two index scans produce bitmaps, AND/OR them, then heap visits in physical order; note lost ordering.
- **Index-only scan vs visibility map** [M4, M5]: heap pages coloured all-visible or not; scan skips heap only for all-visible pages; run VACUUM and watch `Heap Fetches` drop.
- **Partial-index predicate matcher** [M4]: query WHERE vs index predicate; light up "implies" for `x < 1` => `x < 2`; fail for `x < $1`.
- **Isolation level timeline** [M5]: two sessions on a timeline; replay the docs' `website` hits 9/10 DELETE anomaly under Read Committed, the "concurrent update" error under Repeatable Read, and the mytab class 1/2 SUM example under Serializable.
- **Lock conflict matrix** [M5]: clickable 8x8 Table 13.2 and 4x4 Table 13.3; picking a command (e.g. CREATE INDEX vs CREATE INDEX CONCURRENTLY) highlights what it blocks.
- **Deadlock cycle** [M5]: the 11111/22222 account example as a wait-for graph forming a cycle, then one victim aborted.
- **SSI dependency graph** [M5]: rw-antidependency edges between transactions; when a dangerous structure forms, one transaction is rolled back; show SIRead lock escalation tuple to page to relation.
- **EXPLAIN annotator** [M4]: hover each number in `(cost=0.00..445.00 rows=10000 width=244)` and `(actual time=... rows=... loops=...)`; show cost = 345*1.0 + 10000*0.01.
- **Join-order search space** [M4]: count join orders as tables grow; show `join_collapse_limit = 1` pinning order and the geqo_threshold switch.
- **Extended statistics before/after** [M4]: estimated vs actual rows for correlated city/zip with and without `CREATE STATISTICS (dependencies)`.
- **Parallel query** [M4]: leader plus workers claiming block ranges in a Parallel Seq Scan; Partial Aggregate then Gather then Finalize Aggregate; Gather vs Gather Merge ordering.
- **FTS pipeline** [M6]: text to parser tokens (ts_debug) to dictionary chain to lexemes with positions to tsvector; then tsquery match with `<->` position checks.

### Playground SQL (PGlite, PostgreSQL 18, single session)
```sql
-- sizes
SELECT pg_column_size(1::int2), pg_column_size(1::int8), pg_column_size(1::numeric),
       pg_column_size(12345678::numeric), pg_column_size(now()), pg_column_size('abc'::text),
       pg_column_size(gen_random_uuid());
-- numeric rounding vs float rounding
SELECT x, round(x::numeric), round(x::float8) FROM generate_series(-3.5, 3.5, 1) x;
-- UUID v4 vs v7
SELECT uuidv4(), uuidv7(), uuid_extract_version(uuidv7()), uuid_extract_timestamp(uuidv7());
-- json vs jsonb
SELECT '{"b":1, "a":2, "a":3, "reading":1.230e-5}'::json, '{"b":1, "a":2, "a":3, "reading":1.230e-5}'::jsonb;
SELECT '[1, 2, [1, 3]]'::jsonb @> '[1, 3]', '[1, 2, [1, 3]]'::jsonb @> '[[1, 3]]', '{"foo": "bar"}'::jsonb ? 'bar';
-- interval normalization
SELECT '2 years 15 months 100 weeks 99 hours 123456789 milliseconds'::interval;
-- range + exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE room_reservation (room text, during tsrange, EXCLUDE USING GIST (room WITH =, during WITH &&));
INSERT INTO room_reservation VALUES ('123A', '[2010-01-01 14:00, 2010-01-01 15:00)');
INSERT INTO room_reservation VALUES ('123A', '[2010-01-01 14:30, 2010-01-01 15:30)'); -- fails
-- type resolution pitfalls
SELECT ARRAY[1,2] || NULL, array_append(ARRAY[1,2], NULL);
SELECT NULL UNION SELECT NULL UNION SELECT 1; -- error
-- index-only scan and visibility map
CREATE TABLE tab (x int, y int, z text);
INSERT INTO tab SELECT g, g % 100, md5(g::text) FROM generate_series(1, 100000) g;
CREATE INDEX tab_x_y ON tab (x) INCLUDE (y);
ANALYZE tab;
EXPLAIN (ANALYZE) SELECT y FROM tab WHERE x < 1000;   -- note Heap Fetches
VACUUM tab;
EXPLAIN (ANALYZE) SELECT y FROM tab WHERE x < 1000;   -- Heap Fetches: 0
-- skip scan (PG18)
CREATE INDEX tab_y_x ON tab (y, x);
EXPLAIN (ANALYZE) SELECT * FROM tab WHERE x = 4242;   -- look for Index Searches
-- partial index predicate implication
CREATE INDEX tab_small ON tab (x) WHERE x < 2000;
EXPLAIN SELECT * FROM tab WHERE x < 1000;  -- can use tab_small
PREPARE p(int) AS SELECT * FROM tab WHERE x < $1;
-- extended statistics
CREATE TABLE zc AS SELECT g AS zip, g / 10 AS city FROM generate_series(1, 100000) g;
ANALYZE zc;
EXPLAIN ANALYZE SELECT * FROM zc WHERE zip = 4242 AND city = 424;
CREATE STATISTICS zc_dep (dependencies) ON zip, city FROM zc; ANALYZE zc;
EXPLAIN ANALYZE SELECT * FROM zc WHERE zip = 4242 AND city = 424;
SELECT stxname, stxkeys, stxddependencies FROM pg_statistic_ext JOIN pg_statistic_ext_data ON oid = stxoid;
-- locks visible in a single session
BEGIN; LOCK TABLE tab IN SHARE MODE; SELECT locktype, mode, granted FROM pg_locks WHERE relation = 'tab'::regclass; COMMIT;
BEGIN; SELECT * FROM tab WHERE x = 1 FOR KEY SHARE; SELECT mode FROM pg_locks WHERE relation = 'tab'::regclass; COMMIT;
BEGIN ISOLATION LEVEL SERIALIZABLE; SELECT count(*) FROM tab; SELECT mode, locktype FROM pg_locks WHERE mode = 'SIReadLock'; COMMIT;
SELECT pg_advisory_lock(42); SELECT locktype, objid, mode FROM pg_locks WHERE locktype = 'advisory'; SELECT pg_advisory_unlock(42);
-- FTS
SELECT to_tsvector('english', 'a fat  cat sat on a mat - it ate a fat rats');
SELECT * FROM ts_debug('english', 'The Brightest supernovaes');
SELECT websearch_to_tsquery('english', 'signal -"segmentation fault"');
SELECT phraseto_tsquery('english', 'the cats ate the rats');
SELECT to_tsvector('postgraduate') @@ to_tsquery('postgres:*');
-- EXPLAIN cost formula
SELECT relpages, reltuples FROM pg_class WHERE relname = 'tab';
EXPLAIN SELECT * FROM tab;  -- total = relpages*1.0 + reltuples*0.01
SET join_collapse_limit = 1;
```
- Note: PGlite is single-session, so two-session demos (blocking, deadlock, serialization failures, Read Committed re-check) must be simulated in the visualizer or scripted as a replay; single-session SQL can still show which locks a statement takes via `pg_locks`. Parallel query will likely produce no workers in PGlite; teach it with captured EXPLAIN output.

### Pitfalls the docs warn about (with the documented fix)
- `TIMESTAMP '2004-10-19 10:23:54+02'` silently ignores the zone: use `TIMESTAMP WITH TIME ZONE '...'`.
- `'now'`, `'today'`, `'tomorrow'` in views, prepared statements or function bodies freeze to a stale value: use `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_TIMESTAMP`, `LOCALTIME`, `LOCALTIMESTAMP` (e.g. `CURRENT_DATE + 1`).
- `character(n)` is usually the slowest string type: use text or varchar.
- money output depends on `lc_monetary`: match it before restoring a dump; avoid float for money.
- Floats are inexact: use numeric for exact values; NaN sorts as greater than everything and equal to itself.
- serial does not add UNIQUE/PRIMARY KEY and leaves gaps: add the constraint; or use identity columns.
- json `jdoc -> 'tags' ? 'qui'` cannot use a GIN index on jdoc: create an expression index on `(jdoc -> 'tags')` or rewrite with `@>`.
- Large JSON documents increase row-lock contention: keep documents to a manageable, atomic size.
- `(myfunc(x)).*` calls the function once per output column: use `LATERAL myfunc(x) AS m`.
- `ARRAY[1,2] || NULL` drops the NULL: use `array_append`.
- Arrays used as sets are a design smell: use a separate table.
- Composite type constraints from a table do not apply elsewhere: wrap in a domain with CHECKs.
- Nested UNION of NULLs resolves to text: put a correctly typed input in the leftmost UNION.
- A custom operator on a domain is not chosen: cast the other operand explicitly.
- Many partial indexes as a substitute for partitioning: use one composite index or partitioning.
- Partial indexes do not work with parameterized predicates (`x < $1`): predicate matching happens at plan time.
- Expression index blocks index-only scans for `f(x)`: add `INCLUDE (x)`.
- `*_pattern_ops` indexes do not support `<`, `>`: add a default-opclass index too.
- Index tests on tiny tables mislead: use real data and ANALYZE first.
- FTS expression index used with 1-argument `to_tsvector` in the query: always use the same 2-argument form, or a stored generated tsvector column.
- `to_tsvector(NULL)` nulls the whole document: wrap fields in `coalesce`.
- `ts_headline` output is not XSS-safe: sanitize.
- Dictionary file edits are not seen by existing sessions: issue a dummy `ALTER TEXT SEARCH DICTIONARY`. Thesaurus changes require reindexing.
- Read Committed with complex WHERE clauses can skip rows (website hits example): use Repeatable Read/Serializable or explicit locks.
- Repeatable Read/Serializable can fail with 40001: retry the whole transaction including the decision logic.
- `SELECT FOR UPDATE` does not prevent later updates after the holder ends: actually UPDATE the row.
- In Repeatable Read, take explicit locks before the first query (the snapshot freezes at the first query).
- Serializable unique violations despite check-first: all inserting transactions must follow the same check protocol.
- Sequential scans force relation-level SIRead locks: encourage index scans (`random_page_cost`, `cpu_tuple_cost`) and raise `max_pred_locks_*` if escalation occurs.
- Serializable guarantees do not apply on hot standby or logical replicas: use Repeatable Read plus explicit locks on the primary.
- TRUNCATE and table-rewriting ALTER TABLE are not MVCC-safe: old snapshots see an empty table.
- Deadlocks: lock objects in a consistent order and take the strongest needed mode first; retry 40P01.
- Long-open transactions wait indefinitely on locks: do not hold transactions while waiting for user input; use `idle_in_transaction_session_timeout`.
- `pg_advisory_lock(id) ... LIMIT` may lock extra rows: apply LIMIT in a subquery first.
- Advisory and regular locks share `max_locks_per_transaction * max_connections` slots: do not exhaust them.
- EXPLAIN ANALYZE executes the statement: wrap DML in BEGIN/ROLLBACK.
- `loops` multiply per-loop times; BitmapAnd/BitmapOr show 0 rows; merge-join inner row counts can exceed the table size; LIMIT makes actual less than estimate: none of these are estimation errors.
- Functional dependency statistics assume compatible conditions: impossible combinations are still estimated as non-empty.
- Bulk loading with FKs can overflow the trigger event queue: drop and recreate FKs, or load in smaller transactions.
- `wal_level = minimal` / `archive_mode = off` invalidates earlier base backups: take a fresh base backup afterwards.
- `--disable-triggers` in restores skips FK validation entirely.
- `synchronous_commit = off` risks losing transactions (not corruption); `fsync = off` and `full_page_writes = off` risk corruption on an OS crash.
- User-defined functions default to PARALLEL UNSAFE and silently disable parallel query: label them correctly; mislabeling can give wrong answers.
- Cursors and PL/pgSQL `FOR ... IN query` loops never run in parallel.
