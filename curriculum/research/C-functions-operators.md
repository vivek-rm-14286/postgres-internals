# C — Part II ch.9 Functions and Operators (all sections)

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 88 | functions.txt | Chapter 9 TOC (31 sections), notation `f(args) → type`, `\df`/`\do`, portability note |
| 89 | functions-logical.txt | AND/OR/NOT, three-valued truth tables, no guaranteed left-to-right evaluation |
| 90 | functions-comparison.txt | Comparison operators, BETWEEN [SYMMETRIC], IS [NOT] DISTINCT FROM, row IS NULL quirk, num_nulls/num_nonnulls |
| 91 | functions-math.txt | Math operators (left-assoc `^`, integer division), math/random/trig/hyperbolic functions, width_bucket |
| 92 | functions-string.txt | SQL and other string functions, casefold, regexp_* list, format() specifiers %s/%I/%L |
| 93 | functions-binarystring.txt | bytea functions, bit numbering quirks, crc32/crc32c/sha2, encode/decode formats, int↔bytea casts |
| 94 | functions-bitstring.txt | bit/varbit operators and functions, leftmost bit 0, int↔bit casts |
| 95 | functions-matching.txt | LIKE (nondeterministic collations), SIMILAR TO, POSIX ARE regex engine, flags, greediness rules, XQuery gaps |
| 96 | functions-formatting.txt | to_char/to_date/to_number/to_timestamp, all date/time and numeric template patterns, modifiers, input rules |
| 97 | functions-datetime.txt | Date/time operators, functions, EXTRACT fields, date_trunc, date_bin, AT TIME ZONE/AT LOCAL, current time semantics, pg_sleep |
| 98 | functions-enum.txt | enum_first, enum_last, enum_range |
| 99 | functions-geometry.txt | Geometric operators (~= vs area-based =), functions, type conversions, point subscripting |
| 100 | functions-net.txt | inet/cidr containment operators and functions, macaddr functions |
| 101 | functions-textsearch.txt | tsvector/tsquery operators, FTS functions, debugging functions (ts_debug, ts_lexize, ts_stat) |
| 102 | functions-uuid.txt | gen_random_uuid/uuidv4, uuidv7([shift]), uuid_extract_timestamp/version |
| 103 | functions-xml.txt | XML producing functions, predicates, xpath, XMLTABLE, table/query/schema/database_to_xml |
| 104 | functions-json.txt | json/jsonb operators, creation/testing/processing functions, SQL/JSON path language, JSON_EXISTS/QUERY/VALUE, JSON_TABLE |
| 105 | functions-sequence.txt | nextval/setval/currval/lastval, privileges, why sequences have gaps, crash caveat |
| 106 | functions-conditional.txt | CASE (both forms), COALESCE, NULLIF type subtlety, GREATEST/LEAST ignore NULLs |
| 107 | functions-array.txt | Array comparison ordering, @> <@ && ||, all array functions incl. array_sort/array_reverse |
| 108 | functions-range.txt | Range and multirange operators/functions, empty-range rules, disjoint-union failure |
| 109 | functions-aggregate.txt | General/statistical/ordered-set/hypothetical-set aggregates with Partial Mode, GROUPING() |
| 110 | functions-window.txt | All 11 window functions, peers, default frame, missing IGNORE NULLS/FROM LAST |
| 111 | functions-merge-support.txt | merge_action() in MERGE RETURNING |
| 112 | functions-subquery.txt | EXISTS, IN, NOT IN, ANY/SOME, ALL, single-row comparison and their NULL semantics |
| 113 | functions-comparisons.txt | IN/NOT IN lists, ANY/ALL over arrays, row constructor comparison, composite comparison, *= binary operators |
| 114 | functions-srf.txt | generate_series (numeric/timestamp/tz-aware), generate_subscripts, WITH ORDINALITY |
| 115 | functions-info.txt | Session info, privilege inquiry, visibility, catalog info, object addressing, comments, input validity, xid/snapshot, commit ts, control data, version, WAL summarization |
| 116 | functions-admin.txt | Settings, signaling, backup/WAL LSN, recovery, snapshot export, replication slots/origins, sizes/locations, stats restore, partitions, index maintenance, file access, advisory locks |
| 117 | functions-trigger.txt | suppress_redundant_updates_trigger, tsvector_update_trigger[_column] |
| 118 | functions-event-triggers.txt | pg_event_trigger_ddl_commands, pg_event_trigger_dropped_objects, table rewrite oid/reason bitmap |
| 119 | functions-statistics.txt | pg_mcv_list_items over pg_statistic_ext_data.stxdmcv |

## Notes by topic

### Chapter overview & notation  [M3]  (source: functions.txt)
- Chapter 9 has 31 sections (9.1 Logical ... 9.31 Statistics Information Functions). Notation: `repeat ( text, integer ) → text`; the arrow also marks example results (`repeat('Pg', 4) → PgPgPgPg`).
- psql `\df` lists functions, `\do` lists operators. User-defined functions/operators are covered in Part V.
- Portability: except the most trivial arithmetic/comparison operators and some explicitly marked functions, most of ch.9 is NOT in the SQL standard.

### Logical operators and three-valued logic  [M3]  (source: functions-logical.txt)
- `AND`, `OR`, `NOT` over boolean; SQL three-valued logic: true, false, null ("unknown").
- Truth table: TRUE AND NULL = NULL; FALSE AND NULL = FALSE; NULL AND NULL = NULL; TRUE OR NULL = TRUE; FALSE OR NULL = NULL; NULL OR NULL = NULL; NOT NULL = NULL.
- AND/OR are commutative, but there is NO guarantee the left operand is evaluated before the right (see 4.2.14 on evaluation order) — no short-circuit ordering guarantee.

### Comparison operators and predicates  [M3]  (source: functions-comparison.txt)
- Operators (Table 9.1): `<`, `>`, `<=`, `>=`, `=`, `<>`, `!=`. `!=` is converted to `<>` at a very early stage of parsing, so you cannot define `!=` and `<>` operators that behave differently.
- Available for all built-in types with a natural ordering; arrays, composite types, and ranges are comparable if component types are.
- Cross-type comparisons (e.g. `integer > bigint`) use either dedicated cross-type operators or coercion of the less-general type to the more-general type.
- All comparison operators are binary and return boolean, so `1 < 2 < 3` is invalid (no `boolean < integer` operator).
- Predicates (Table 9.2): `BETWEEN` (inclusive; `a BETWEEN x AND y` == `a >= x AND a <= y`; `2 BETWEEN 3 AND 1 → f`), `NOT BETWEEN`, `BETWEEN SYMMETRIC` (endpoints sorted first; `2 BETWEEN SYMMETRIC 3 AND 1 → t`), `NOT BETWEEN SYMMETRIC`, `IS DISTINCT FROM`, `IS NOT DISTINCT FROM`, `IS NULL`, `IS NOT NULL`, `ISNULL`/`NOTNULL` (nonstandard), `IS TRUE`, `IS NOT TRUE`, `IS FALSE`, `IS NOT FALSE`, `IS UNKNOWN`, `IS NOT UNKNOWN`.
- BETWEEN's `AND` is ambiguous with logical AND; only a limited set of expression types is allowed as the second argument — parenthesize complex sub-expressions.
- Ordinary comparisons yield null if either input is null (`7 = NULL` → null, `7 <> NULL` → null). `IS DISTINCT FROM`: null vs null → false, one null → true. `IS NOT DISTINCT FROM`: both null → true, one null → false. They treat null as a normal data value.
- Never write `expr = NULL`. GUC `transform_null_equals` (if enabled) converts `x = NULL` to `x IS NULL` — for non-compliant apps only.
- Row-valued IS NULL: true when the row itself is null OR all fields are null. Row-valued IS NOT NULL: true when row is non-null AND all fields non-null. So for a row with mixed null/non-null fields BOTH tests return false (they are not inverses). `row IS [NOT] DISTINCT FROM NULL` checks only the overall row value.
- Boolean tests `IS TRUE/FALSE/UNKNOWN` (and NOT forms) always return true/false, never null; `IS UNKNOWN` is like `IS NULL` but requires boolean input. `NULL::boolean IS NOT TRUE → t`.
- Functions (Table 9.3): `num_nonnulls(VARIADIC "any") → integer`, `num_nulls(VARIADIC "any") → integer` (`num_nulls(1, NULL, 2) → 1`).

### Mathematical operators and functions  [M3, M2]  (source: functions-math.txt)
- numeric_type = smallint, integer, bigint, numeric, real, double precision; integral_type = smallint, integer, bigint. Mixed-type calls resolve to the type appearing LATER in those lists.
- Bit shifts have platform-dependent behaviour on signed overflow, shifting by more bits than the type has, or by a negative amount.
- Operators (Table 9.4): `+`, unary `+`, `-`, unary `-`, `*`, `/` (integral division truncates toward zero: `5/2 → 2`, `(-5)/2 → -2`, `5.0/2 → 2.5000000000000000`), `%` (smallint/int/bigint/numeric only), `^` (numeric or double precision; LEFT-associative: `2 ^ 3 ^ 3 → 512`, `2 ^ (3 ^ 3) → 134217728`), `|/` square root, `||/` cube root, `@` absolute value, `&`, `|`, `#` (XOR: `17 # 5 → 20`), `~` (`~1 → -2`), `<<`, `>>`.
- double precision functions are mostly implemented on the host C library: boundary-case accuracy varies by platform.
- Functions (Table 9.5): `abs`, `cbrt`, `ceil`/`ceiling`, `degrees`, `div(y,x)` (integer quotient, truncates toward zero), `erf`, `erfc`, `exp`, `factorial(bigint) → numeric`, `floor`, `gamma(double precision)` (`gamma(0.5) → 1.772453850905516`, `gamma(6) → 120`), `gcd` (returns 0 if both inputs zero; integer/bigint/numeric), `lcm` (0 if either input zero), `lgamma` (ln of |gamma|), `ln`, `log` (base 10), `log10`, `log(b, x)`, `min_scale(numeric)` (`min_scale(8.4100) → 2`), `mod(y,x)`, `pi()`, `power(a,b)`, `radians`, `round(x)`, `round(v numeric, s integer)` (`round(1234.56, -1) → 1230`), `scale(numeric)` (`scale(8.4100) → 4`), `sign`, `sqrt`, `trim_scale(numeric)` (`8.4100 → 8.41`), `trunc(x)`, `trunc(v, s)`, `width_bucket(operand, low, high, count)`, `width_bucket(operand anycompatible, thresholds anycompatiblearray)`.
- Rounding rule: `round(numeric)` breaks ties away from zero; `round(double precision)` is platform dependent, most commonly round-to-nearest-even.
- `width_bucket(operand, low, high, count)`: equal-width histogram buckets, inclusive lower/exclusive upper bound; returns 0 below low, count+1 for >= high; if low > high the behaviour is mirror-reversed. `width_bucket(5.35, 0.024, 10.06, 5) → 3`; `width_bucket(9, 10, 0, 10) → 2`. Array form: thresholds are inclusive lower bounds, must be sorted smallest first; returns 0 below the first bound.
- Random (Table 9.6): `random() → double precision` in 0.0 <= x < 1.0; `random(min, max)` for integer/bigint/numeric returns min <= x <= max (numeric result has the larger of the two scales); `random_normal([mean [, stddev]])` defaults 0.0 and 1.0; `setseed(double precision)` in [-1.0, 1.0]. Deterministic PRNG, not cryptographic (use pgcrypto). Without setseed, first call seeds from a platform-dependent random-bit source; setseed makes the session's sequence repeatable.
- Trig (Table 9.7), each in radian and degree variants: `acos/acosd`, `asin/asind`, `atan/atand`, `atan2/atan2d`, `cos/cosd`, `cot/cotd`, `sin/sind`, `tan/tand`. Degree variants are preferred over `radians()`/`degrees()` conversion because they avoid round-off for special cases (`sind(30) → 0.5`).
- Hyperbolic (Table 9.8): `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`.

### String functions and operators  [M3, M2]  (source: functions-string.txt)
- "String" = `character`, `character varying`, `text`. Functions are declared on `text`; `varchar` accepted interchangeably; `character` values are converted to text first, which STRIPS trailing spaces (exception: `octet_length(character)` — `octet_length('abc '::character(4)) → 4`).
- `||` accepts non-string input if at least one side is a string type (`'Value: ' || 42`); the non-string side cannot be an array (ambiguity with array `||`) — cast the array to text explicitly.
- SQL-syntax functions (Table 9.9): `||`, `btrim(string [, characters])`, `text IS [NOT] [form] NORMALIZED` (NFC default, NFD, NFKC, NFKD; UTF8 server encoding only; faster than normalizing), `bit_length`, `char_length`/`character_length`, `lower`, `lpad(string, length [, fill])` (truncates on the right if longer), `ltrim`, `normalize(text [, form])` (UTF8 only), `octet_length` (`octet_length('josé') → 5` in UTF8 vs `char_length → 4`), `overlay(string PLACING new FROM start [FOR count])`, `position(substring IN string)` (0 if absent), `rpad`, `rtrim`, `substring(string [FROM start] [FOR count])`, `substring(string FROM pattern)` (POSIX regex), `substring(string SIMILAR pattern ESCAPE escape)` (SQL:2003; the `FROM pattern FOR escape` form is SQL:1999-only, obsolete), `trim([LEADING|TRAILING|BOTH] [characters] FROM string)` (BOTH default; non-standard comma form also accepted), `unicode_assigned(text)` (UTF8 only), `upper`.
- Other functions (Table 9.10): `^@` (starts-with operator, same as `starts_with()`), `ascii` (first char; Unicode code point in UTF8), `chr(integer)` (`chr(0)` disallowed — text cannot store that character), `concat` (NULL args ignored), `concat_ws(sep, ...)` (NULLs other than sep ignored), `format`, `initcap`, `casefold(text)` (collation-driven case folding for caseless matching; UTF8 only; may change length — in `PG_UNICODE_FAST` collation ß (U+00DF) folds to `ss`; libc provider does not support folding so it equals `lower`), `left(string, n)` (negative n: all but last |n|), `length`, `md5(text) → text` (hex), `parse_ident(str [, strict DEFAULT true]) → text[]` (does not truncate over-length identifiers; cast to `name[]` for truncation), `pg_client_encoding()`, `quote_ident` (quotes only if needed), `quote_literal` (returns NULL on NULL), `quote_nullable` (returns the string `NULL` on NULL), `regexp_count`, `regexp_instr`, `regexp_like`, `regexp_match`, `regexp_matches`, `regexp_replace` (two signatures), `regexp_split_to_array`, `regexp_split_to_table`, `regexp_substr`, `repeat`, `replace`, `reverse`, `right`, `split_part(string, delimiter, n)` (negative n counts from the end: `split_part('abc,def,ghi,jkl', ',', -2) → ghi`), `starts_with`, `string_to_array(string, delimiter [, null_string])` (NULL delimiter → one element per character; empty delimiter → single field), `string_to_table`, `strpos(string, substring)` (reversed arg order vs `position`), `substr`, `to_ascii` (only from LATIN1, LATIN2, LATIN9, WIN1250), `to_bin`, `to_hex`, `to_oct` (two's complement; `to_hex(-1234) → fffffb2e`), `translate(string, from, to)` (extra chars in `from` are deleted: `translate('12345','143','ax') → a2x5`), `unistr(text)` (escapes `\XXXX`, `\+XXXXXX`, `\uXXXX`, `\UXXXXXXXX`).
- `concat`, `concat_ws`, `format` are variadic (accept `VARIADIC array`). With a NULL variadic array: `concat`/`concat_ws` return NULL, `format` treats it as zero-element array.
- `format(formatstr, ...)`: specifier `%[position][flags][width]type`. position = `n$` (1 = first arg after formatstr). flags: only `-` (left-justify; needs width). width: positive integer, `*` (next arg), or `*n$`; too-small width never truncates; a negative width argument left-aligns; a width argument is consumed BEFORE the value argument. types: `s` (null → empty string), `I` (SQL identifier, quoted if needed; null is an ERROR; = quote_ident), `L` (SQL literal; null → unquoted `NULL`; = quote_nullable). `%%` = literal %.
- format examples: `format('INSERT INTO %I VALUES(%L)', 'Foo bar', E'O\'Reilly')` → `INSERT INTO "Foo bar" VALUES('O''Reilly')`; `format('INSERT INTO %I VALUES(%L)', 'locations', 'C:\Program Files')` → `INSERT INTO locations VALUES(E'C:\\Program Files')`; `format('|%-10s|','foo')` → `|foo       |`; `format('Testing %3$s, %2$s, %s', 'one','two','three')` → `Testing three, two, three` (positional and sequential specifiers can be mixed, unlike sprintf; unused arguments allowed).
- `%I`/`%L` are the documented safe way to build dynamic SQL (Example 41.1).

### Binary string (bytea) functions  [M2]  (source: functions-binarystring.txt)
- SQL-syntax (Table 9.11): `bytea || bytea`, `bit_length`, `btrim(bytes, bytesremoved)`, `ltrim`, `octet_length`, `overlay(... PLACING ... FROM ... [FOR ...])`, `position(substring IN bytes)`, `rtrim`, `substring(bytes [FROM start] [FOR count])`, `trim([LEADING|TRAILING|BOTH] bytesremoved FROM bytes)`.
- Other (Table 9.12): `bit_count(bytea) → bigint` (popcount; `bit_count('\x1234567890') → 15`), `crc32(bytea) → bigint` (`crc32('abc') → 891568578`), `crc32c(bytea) → bigint` (`910901175`), `get_bit(bytes, n bigint)`, `get_byte(bytes, n)`, `length(bytea)`, `length(bytes, encoding name)` (character count in that encoding), `md5(bytea) → text`, `reverse(bytea)`, `set_bit`, `set_byte`, `sha224`, `sha256`, `sha384`, `sha512` (all → bytea), `substr`.
- Numbering: `get_byte`/`set_byte` number the first byte 0. `get_bit`/`set_bit` number bits from the RIGHT within each byte: bit 0 = least significant bit of the first byte, bit 15 = most significant bit of the second byte.
- Historical quirk: `md5` returns hex `text`; SHA-2 functions return `bytea`. Convert with `encode(sha256('abc'), 'hex')` or `decode(md5('abc'), 'hex')`.
- Conversion (Table 9.13): `convert(bytes, src_encoding, dest_encoding) → bytea`, `convert_from(bytes, src_encoding) → text`, `convert_to(string, dest_encoding) → bytea`, `encode(bytes, format) → text`, `decode(string, format) → bytea`. Formats: `base64` (RFC 2045 §6.8; encoded lines broken at 76 characters with newline only, not CRLF; decode ignores CR, LF, space, tab; errors on invalid data incl. wrong trailing padding), `escape` (zero bytes and high-bit bytes → `\nnn` octal; backslashes doubled), `hex` (2 lower-case hex digits per byte, high nibble first; decode accepts either case; error on odd number of chars).
- Integer <-> bytea casts: integer→bytea yields 2, 4, or 8 bytes (by integer width), two's complement, most significant byte first: `1234::smallint::bytea → \x04d2`, `cast(1234 as bytea) → \x000004d2`, `cast(-1234 as bytea) → \xfffffb2e`, `'\x8000'::bytea::smallint → -32768`, `'\x8000'::bytea::integer → 32768`. bytea→integer errors if the bytea is longer than the integer width.

### Bit string functions  [M2]  (source: functions-bitstring.txt)
- Types `bit` and `bit varying` are interchangeable in these functions; standard comparison operators apply.
- Operators (Table 9.14): `||`, `&`, `|`, `#` (inputs must be of equal length for the three bitwise ones), `~`, `<<`, `>>` (string length preserved: `B'10001' << 3 → 01000`).
- Functions (Table 9.15): `bit_count(bit) → bigint`, `bit_length`, `length`, `octet_length` (`octet_length(B'1011111011') → 2`), `overlay`, `position`, `substring`, `get_bit(bits, n)`, `set_bit(bits, n, newvalue)` — for bit strings the first (LEFTMOST) bit is bit 0 (opposite convention to bytea).
- Casts: integer→`bit(n)` copies the rightmost n bits (`44::bit(10) → 0000101100`, `44::bit(3) → 100`); a width wider than the integer sign-extends on the left (`cast(-44 as bit(12)) → 111111010100`); `'1110'::bit(4)::integer → 14`. Casting to plain `bit` = `bit(1)` → only the least significant bit.

### Pattern matching: LIKE, SIMILAR TO, POSIX regex  [M3, M4]  (source: functions-matching.txt)
- Three approaches: `LIKE` (traditional SQL), `SIMILAR TO` (SQL:1999), POSIX regular expressions.
- SECURITY CAUTION: regexes can be contrived to take arbitrary time and memory; do not accept patterns from hostile sources without a statement timeout. `SIMILAR TO` has the same hazard. `LIKE` is safer with hostile patterns.
- `SIMILAR TO` and POSIX regexes do NOT support nondeterministic collations; `LIKE` does (use LIKE or apply a different collation).
- **LIKE**: `string LIKE pattern [ESCAPE escape-character]`, `NOT LIKE`. `_` = any single character, `%` = any sequence of zero or more characters. Always matches the ENTIRE string (wrap with `%...%` to match anywhere). With no wildcard it acts like `=`.
  - Default escape character is backslash; `ESCAPE ''` disables escaping. The SQL standard says no ESCAPE = no escape character and forbids zero-length ESCAPE, so PostgreSQL is slightly nonstandard.
  - Nondeterministic collations with LIKE: the pattern is partitioned into wildcard and non-wildcard runs; the string matches if it can be partitioned so wildcards match one/any chars and non-wildcard partitions are EQUAL under the collation. `'.foo.' LIKE 'f_o' COLLATE ign_punct → true`, `'.foo.' LIKE '_oo' COLLATE ign_punct → false` (`_` always matches exactly one character regardless of collation).
  - `ILIKE` = case-insensitive per active locale (PostgreSQL extension; does NOT support nondeterministic collations).
  - Operator names: `~~` = LIKE, `~~*` = ILIKE, `!~~` = NOT LIKE, `!~~*` = NOT ILIKE. These names appear in EXPLAIN output because the parser translates LIKE to them. Usable in `expr operator ANY (subquery)` but without an ESCAPE clause.
  - With `standard_conforming_strings` off, backslashes in literals must be doubled.
- **SIMILAR TO**: `string SIMILAR TO pattern [ESCAPE c]`; must match the entire string; `_` and `%` as in LIKE, plus `|`, `*`, `+`, `?`, `{m}`, `{m,}`, `{m,n}`, `()`, `[...]`. The period `.` is NOT a metacharacter. Nonstandard extension: escape char followed by letter/digit gives POSIX escapes (`'-abc-' SIMILAR TO '%\mabc\M%' → true`).
  - `substring(string similar pattern escape c)` (also obsolete `from ... for ...` and plain 3-arg form): the pattern must match the whole string else NULL; the part between two `escape"` markers is returned. The markers split the pattern into three independent regexes; first and third are forced non-greedy. PostgreSQL also allows one or zero separators. `substring('foobar' similar '%#"o_b#"%' escape '#') → oob`; `substring('foobar' similar '#"o_b#"%' escape '#') → NULL`.
- **POSIX operators** (Table 9.16): `~` (match, case sensitive), `~*` (case-insensitive), `!~`, `!~*`. Unlike LIKE, a regex matches ANYWHERE in the string unless anchored.
- `substring(string from pattern)`: NULL if no match; returns the whole match, OR — if the pattern has parentheses — the text matching the FIRST parenthesized subexpression (`substring('foobar' from 'o(.)b') → o`). Wrap the whole pattern in parens or use `(?:...)` to avoid this.
- Regex functions: `regexp_count(string, pattern [, start [, flags]])`; `regexp_instr(string, pattern [, start [, N [, endoption [, flags [, subexpr]]]]])` (endoption 0 = start of match, 1 = position after match; 0 if no match); `regexp_like(string, pattern [, flags])`; `regexp_match` (text[] of first match; NULL if none; one element if no capture groups); `regexp_matches` (setof text[]; 0 rows if no match; needs `g` flag for all matches); `regexp_replace(string, pattern, replacement [, flags])` or `(string, pattern, replacement, start [, N [, flags]])` (`\1`..`\9` and `\&` in replacement; `\\` literal backslash; N=0 or `g` replaces all; `g` is ignored when N is given); `regexp_split_to_table`, `regexp_split_to_array` (split functions IGNORE zero-length matches at start/end of string or immediately after a previous match — so `'\s*'` splits `'the quick brown fox'` into 16 single characters); `regexp_substr(string, pattern [, start [, N [, flags [, subexpr]]]])` (PG15+). `regexp_match` exists from PG10+.
  - Pitfall: `regexp_matches` without a sub-select drops rows with no match; use `regexp_match` or `(SELECT regexp_matches(...))`.
  - Named-arg call needs `"N"` quoted: `regexp_replace(string=>'hello world', pattern=>'l', replacement=>'XX', start=>1, "N"=>2) → helXXo world`.
- **Regex engine**: Henry Spencer's package. Three flavours: BRE (ed-like), ERE (egrep-like), ARE (advanced, Perl/Tcl-style extensions). PostgreSQL always presumes ARE unless an embedded option/flag selects ERE or BRE.
  - Grammar: RE = branches separated by `|`; branch = concatenated quantified atoms or constraints; atom (Table 9.17): `(re)`, `(?:re)` non-capturing (ARE), `.`, `[chars]`, `\k` (non-alphanumeric literal), `\c` escape (ARE), `{` (literal unless followed by digit), `x`. An RE cannot end with `\`.
  - Quantifiers (Table 9.18): `*`, `+`, `?`, `{m}`, `{m,}`, `{m,n}` and non-greedy `*?`, `+?`, `??`, `{m}?`, `{m,}?`, `{m,n}?` (ARE only). Bounds m, n are 0..255 inclusive. `**` invalid; a quantifier cannot begin an (sub)expression or follow `^` or `|`.
  - Constraints (Table 9.19): `^`, `$`, `(?=re)` positive lookahead, `(?!re)` negative lookahead, `(?<=re)` positive lookbehind, `(?<!re)` negative lookbehind (ARE only). Lookaround cannot contain back references; parentheses within are non-capturing.
  - Bracket expressions: `[^...]` negation; ranges `a-z` are collating-sequence dependent; `[.x.]` collating element (multi-character collating elements NOT supported); `[=x=]` equivalence class; `[:class:]` with POSIX classes alnum, alpha, blank, cntrl, digit, graph, lower, print, punct, space, upper, xdigit plus PostgreSQL-specific `word` (alnum + underscore) and `ascii` (7-bit ASCII). Non-ASCII classification depends on the collation / LC_CTYPE; C locale never classifies non-ASCII characters. `[[:<:]]` / `[[:>:]]` = start/end of word.
  - Character-entry escapes (Table 9.20): `\a`, `\b` (backspace), `\B` (synonym for backslash), `\cX`, `\e`, `\f`, `\n`, `\r`, `\t`, `\uwxyz`, `\Ustuvwxyz`, `\v`, `\xhhh`, `\0`, `\xy`, `\xyz` (octal).
  - Class shorthands (Table 9.21): `\d`, `\s`, `\w`, `\D`, `\S`, `\W` (also usable inside brackets: `[a-c\d]`).
  - Constraint escapes (Table 9.22): `\A` (start of string), `\m` (start of word), `\M` (end of word), `\y` (start or end of word), `\Y` (not at word boundary), `\Z` (end of string). Illegal inside brackets.
  - Back references (Table 9.23): `\m`, `\mnn`. `([bc])\1` matches bb or cc. Ambiguity with octal: leading zero = octal; single non-zero digit = back reference; multi-digit = back reference if in legal range, else octal.
  - Metasyntax: director prefixes `***:` (rest is ARE) and `***=` (rest is a literal string). Embedded options `(?xyz)` at start of an ARE — also the letters for function `flags` (Table 9.24): `b` BRE, `c` case-sensitive, `e` ERE, `i` case-insensitive, `m` synonym for `n`, `n` newline-sensitive, `p` partial newline-sensitive, `q` literal string, `s` non-newline-sensitive (default), `t` tight syntax (default), `w` inverse partial newline-sensitive ("weird"), `x` expanded syntax (whitespace and `#` comments ignored). `(?#ttt)` comments deprecated. Plus `g` (global) for regexp_matches/regexp_replace only.
  - Matching rules: earliest-starting match wins; then longest or shortest depending on whether the RE AS A WHOLE is greedy. Greediness rules: (1) most atoms/constraints have no greediness; (2) parentheses don't change it; (3) `{m}`/`{m}?` inherit the atom's; (4) other normal quantifiers are greedy; (5) non-greedy quantifiers are non-greedy; (6) a branch takes the greediness of its FIRST quantified atom that has one; (7) an RE with top-level `|` is always greedy.
  - Examples: `substring('XY1234Z', 'Y*([0-9]{1,3})') → 123`; `substring('XY1234Z', 'Y*?([0-9]{1,3})') → 1`; `regexp_match('abc01234xyz', '(.*)(\d+)(.*)') → {abc0123,4,xyz}`; `'(.*?)(\d+)(.*)'` → `{abc,0,""}`; forced greedy `'(?:(.*?)(\d+)(.*)){1,1}'` → `{abc,01234,xyz}`. `{1,1}` / `{1,1}?` force greedy / non-greedy.
  - Match length measured in characters. An empty string is considered longer than no match.
  - Newline-sensitive mode (`n`): `.` and `[^...]` never match newline; `^`/`$` also match after/before newlines; `\A`/`\Z` still only string ends. `\D` and `\W` match newline regardless (changed in PG14). Partial (`p`): affects `.`/brackets only. Inverse partial (`w`): affects `^`/`$` only.
  - Limits: no RE length limit (portable programs: <= 256 bytes). Only real ARE-vs-ERE incompatibility: `\` stays special inside bracket expressions in AREs.
  - BRE differences: `|`, `+`, `?` are ordinary; bounds are `\{ \}`; groups are `\( \)`; `\<`, `\>` word boundaries; single-digit back references only.
- SQL-standard XQuery regex operators NOT implemented: `LIKE_REGEX`, `OCCURRENCES_REGEX`, `POSITION_REGEX`, `SUBSTRING_REGEX`, `TRANSLATE_REGEX` → use `regexp_like`/`~`, `regexp_count`, `regexp_instr`, `regexp_substr`, `regexp_replace` (Table 9.25). Differences from XQuery: no character-class subtraction, no `\c \C \i \I`, no `\p{..}`, only ASCII NL is a newline, XQuery's `s`/`m` flags differ (dot-matches-newline is the POSIX default but not XQuery's), XQuery `x` differs.

### Data type formatting: to_char / to_date / to_number / to_timestamp  [M3]  (source: functions-formatting.txt)
- Functions (Table 9.26): `to_char(timestamp|timestamptz, text)`, `to_char(interval, text)`, `to_char(numeric_type, text)` (integer, bigint, numeric, real, double precision), `to_date(text, text) → date`, `to_number(text, text) → numeric`, `to_timestamp(text, text) → timestamptz`.
- Tip: these exist for formats simple casting cannot handle; for standard formats just cast.
- In output templates non-pattern text is copied verbatim; in input templates non-pattern characters cause the corresponding input characters to be skipped (whether or not equal).
- Date/time patterns (Table 9.27): `HH`/`HH12` (01–12), `HH24` (00–23), `MI`, `SS`, `MS` (000–999), `US` (000000–999999), `FF1`..`FF6` (fractional seconds 1–6 digits), `SSSS`/`SSSSS` (seconds past midnight 0–86399), `AM/am/PM/pm`, `A.M./a.m./P.M./p.m.`, `Y,YYY`, `YYYY`, `YYY`, `YY`, `Y`, `IYYY`, `IYY`, `IY`, `I` (ISO 8601 week-numbering year), `BC/bc/AD/ad`, `B.C./b.c./A.D./a.d.`, `MONTH/Month/month` (blank-padded to 9 chars), `MON/Mon/mon`, `MM`, `DAY/Day/day` (padded to 9), `DY/Dy/dy`, `DDD` (001–366), `IDDD` (001–371), `DD`, `D` (Sunday=1..Saturday=7), `ID` (Monday=1..Sunday=7), `W` (week of month 1–5), `WW` (1–53, first week starts on Jan 1), `IW` (01–53; first Thursday is in week 1), `CC` (century; 21st century starts 2001-01-01), `J` (Julian Date: integer days since November 24, 4714 BC local midnight), `Q`, `RM`/`rm` (Roman month), `TZ`/`tz`, `TZH`, `TZM`, `OF` (offset from UTC).
- Modifiers (Table 9.28): `FM` prefix (fill mode: suppress leading zeroes/padding; in PostgreSQL affects only the NEXT specification, unlike Oracle), `TH`/`th` suffix (ordinal), `FX` prefix (fixed format global option; must be first item), `TM` prefix (translation mode, localized names by `lc_time`; suppresses trailing blanks), `SP` suffix (spell mode — not implemented).
- Input rules for `to_timestamp`/`to_date`: case-insensitive; skip multiple blanks unless `FX`; a template separator matches any single input separator or is skipped (but `to_timestamp('2000//JUN', 'YYYY/MON')` errors: more separators in input than template); with FX each template separator matches exactly one input char (any char). TZH minus-sign ambiguity: if fewer separators precede TZH in the template than precede the minus in input, the minus belongs to TZH (`to_timestamp('2000 -10', 'YYYY TZH')` → -10).
- Double-quoted text in templates is literal (`'"Hello Year "YYYY'`); in input functions quoted text skips that many characters. Since PG12, arbitrary text can only be skipped with letter characters / quoted strings (`to_timestamp('2000y6m1d', 'yyyy"y"MM"m"DD"d"')`).
- Year rules: year spec < 4 digits with a < 4-digit year is adjusted to be nearest to year 2020 (`95 → 1995`). Negative years = BC; year zero is treated as 1 BC. `YYYY` with years > 4 digits requires a non-digit separator after it (`to_date('20000-1130', 'YYYY-MMDD')`). `CC` is ignored if YYY/YYYY/Y,YYY present. Weekday (`DAY`, `D`) and quarter (`Q`) fields are accepted but ignored on input.
- ISO week dates: `to_date('2006-42-4', 'IYYY-IW-ID') → 2006-10-19`; `to_date('2006-291', 'IYYY-IDDD') → 2006-10-19`. Mixing ISO-week and Gregorian fields in to_date is an error; to_char allows it but `IYYY-MM-DD` gives surprising results near year start.
- `to_timestamp('12.3', 'SS.MS')` = 300 ms, not 3 (MS is digits after the decimal point); `to_timestamp('15:12:02.020.001230', 'HH24:MI:SS.MS.US')` = 2.021230 s.
- `to_char(..., 'ID')` matches `extract(isodow)`, but `to_char(..., 'D')` (1–7, Sunday=1) does NOT match `extract(dow)` (0–6).
- `to_char(interval)`: `HH`/`HH12` on a 12-hour clock (0 h and 36 h both show 12); `HH24` can exceed 23.
- Numeric patterns (Table 9.29): `9` (digit, dropped if insignificant), `0` (digit, never dropped), `.`, `,`, `PR` (negative in angle brackets), `S` (sign anchored, locale), `L` (currency, locale), `D` (decimal point, locale), `G` (group separator, locale), `MI`, `PL`, `SG`, `RN`/`rn` (Roman, 1–3999), `TH`/`th`, `V` (shift digits: multiply by 10^n), `EEEE` (scientific; must be last, only with digit/decimal-point patterns). Modifiers (Table 9.30): `FM`, `TH`, `th`. `PL`, `SG`, `TH` are PostgreSQL extensions. Locale patterns use `lc_monetary` / `lc_numeric`.
- to_char rounds to the fractional digits in the format; one column is reserved for the sign if no sign pattern. `to_char(-12, 'MI9999') → '-  12'` vs `to_char(-12, 'S9999') → '  -12'`. `to_number` with `RN` converts Roman numerals, case-insensitively.
- Selected Table 9.31 examples: `to_char(current_timestamp, 'FMDay, FMDD  HH12:MI:SS') → 'Tuesday, 6  05:39:18'`; `to_char(-0.1, '99.99') → '  -.10'`; `to_char(-0.1, 'FM90.99') → '-0.1'`; `to_char(12, '9990999.9') → '    0012.0'`; `to_char(1485, '9,999') → ' 1,485'`; `to_char(-485, '999PR') → '<485>'`; `to_char(485, 'FMRN') → 'CDLXXXV'`; `to_char(482, '999th') → ' 482nd'`; `to_char(12.45, '99V9') → ' 125'`; `to_char(0.0004859, '9.99EEEE') → ' 4.86e-04'`; `to_char(current_timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')` for ISO 8601.

### Date/time operators and functions  [M3, M2]  (source: functions-datetime.txt)
- Comparability: dates and timestamps (with/without tz) are all mutually comparable; times and intervals only with the same type. Comparing `timestamp` to `timestamptz`: the former is assumed to be in the `TimeZone` GUC zone and rotated to UTC (timestamptz is stored in UTC internally). A `date` is midnight in the `TimeZone` zone when compared to a timestamp.
- Operators (Table 9.32): `date + integer → date` (days); `date + interval → timestamp`; `date + time → timestamp`; `interval + interval`; `timestamp + interval`; `time + interval → time`; `- interval`; `date - date → integer` (days); `date - integer → date`; `date - interval → timestamp`; `time - time → interval`; `time - interval → time`; `timestamp - interval`; `interval - interval` (`interval '1 day' - interval '1 hour' → 1 day -01:00:00`); `timestamp - timestamp → interval` (24-hour periods converted to days as by justify_hours: `→ 63 days 15:00:00`); `interval * double precision`; `interval / double precision`.
- Functions (Table 9.33): `age(timestamp, timestamp)` (symbolic years/months), `age(timestamp)` (from `current_date` at midnight), `clock_timestamp()`, `current_date`, `current_time[(p)]`, `current_timestamp[(p)]`, `date_add(timestamptz, interval [, text zone])`, `date_bin(interval, timestamp, timestamp)`, `date_part(text, timestamp|interval) → double precision`, `date_subtract(timestamptz, interval [, text])`, `date_trunc(text, timestamp)`, `date_trunc(text, timestamptz, text zone)`, `date_trunc(text, interval)`, `extract(field from timestamp|interval) → numeric`, `isfinite(date|timestamp|interval)`, `justify_days` (30-day periods → months), `justify_hours` (24-hour periods → days), `justify_interval` (both plus sign adjustment: `'1 mon -1 hour' → 29 days 23:00:00`), `localtime[(p)]`, `localtimestamp[(p)]`, `make_date(year, month, day)` (negative year = BC), `make_interval([years [, months [, weeks [, days [, hours [, mins [, secs double precision]]]]]]])` (`make_interval(days => 10)`), `make_time(hour, min, sec)`, `make_timestamp(year, month, mday, hour, min, sec)`, `make_timestamptz(... [, timezone text])`, `now()`, `statement_timestamp()`, `timeofday() → text`, `transaction_timestamp()`, `to_timestamp(double precision)` (Unix epoch seconds → timestamptz).
- `date_add('2021-10-31 00:00:00+02'::timestamptz, '1 day'::interval, 'Europe/Warsaw') → 2021-10-31 23:00:00+00` (DST-aware in the named zone; two-arg form = `timestamptz + interval`).
- `OVERLAPS`: `(start1, end1) OVERLAPS (start2, end2)` or `(start1, length1) OVERLAPS (start2, length2)`. Each period is half-open `start <= time < end` (unless start = end → a single instant). Either order of the pair is accepted. Periods sharing only an endpoint do not overlap: `(DATE '2001-10-29', DATE '2001-10-30') OVERLAPS (DATE '2001-10-30', DATE '2001-10-31') → false`.
- Interval arithmetic on timestamps handles the interval's three fields in turn: (1) months — advance by months keeping day-of-month unless past month end, then use last day (March 31 + 1 month = April 30; + 2 months = May 31); (2) days — keep local time of day; (3) microseconds — added literally. Therefore under DST `+ interval '1 day'` ≠ `+ interval '24 hours'`: in America/Denver `'2005-04-02 12:00:00-07' + '1 day' → 2005-04-03 12:00:00-06` but `+ '24 hours' → 2005-04-03 13:00:00-06`.
- `age` month ambiguity: uses the month of the EARLIER date for partial months (`age('2004-06-01', '2004-04-30')` → `1 mon 1 day`).
- Three subtraction styles (US/Eastern, across DST): epoch difference `10537200` s (= 121.958 days); `timestamptz - timestamptz → 121 days 23:00:00`; `age(...) → 4 mons`.
- **EXTRACT(field FROM source)** → numeric. Fields: `century` (2000 → 20, 2001 → 21; 1 BC → -1), `day`, `decade` (year/10), `dow` (Sunday 0..Saturday 6), `doy` (1–365/366), `epoch` (timestamptz: seconds since 1970-01-01 00:00:00 UTC; date/timestamp: nominal seconds ignoring tz; interval: total seconds), `hour`, `isodow` (Monday 1..Sunday 7), `isoyear`, `julian`, `microseconds` (seconds field incl. full seconds × 1 000 000: `28500000`), `millennium` (3rd started 2001-01-01), `milliseconds`, `minute`, `month` (interval: months mod 12), `quarter`, `second` (with fraction), `timezone` (offset seconds, east positive), `timezone_hour`, `timezone_minute`, `week` (ISO 8601 week: weeks start Monday; week 1 contains January 4 / the first Thursday), `year` (no year 0 AD).
  - ISO week gotchas: 2005-01-01 is in week 53 of 2004; 2006-01-01 in week 52 of 2005; 2012-12-31 in week 1 of 2013. Use `isoyear` with `week`. `EXTRACT(ISOYEAR FROM DATE '2006-01-01') → 2005`.
  - Interval extraction uses the normalized output representation: `EXTRACT(MINUTES FROM INTERVAL '80 minutes') → 20`.
  - Infinite input: returns ±Infinity for monotonic fields (timestamp: epoch, julian, year, isoyear, decade, century, millennium; interval: epoch, hour, day, year, decade, century, millennium), NULL otherwise.
  - `to_timestamp(epoch)` of an epoch from a tz-less value assumes UTC — may mislead.
  - `date_part('field', source)` is the Ingres-style equivalent returning double precision (possible precision loss) — prefer `extract`.
- **date_trunc(field, source [, time_zone])**: fields `microseconds, milliseconds, second, minute, hour, day, week, month, quarter, year, decade, century, millennium`. For timestamptz, truncation is relative to a zone (default `TimeZone`; optional 3rd arg): `date_trunc('day', TIMESTAMPTZ '2001-02-16 20:38:40+00', 'Australia/Sydney') → 2001-02-16 08:00:00-05` (shown in America/New_York). No zone allowed for timestamp/interval.
- **date_bin(stride, source, origin)**: bins into arbitrary strides aligned to origin; `date_bin('15 minutes', TIMESTAMP '2020-02-11 15:44:17', TIMESTAMP '2001-01-01 00:02:30') → 2020-02-11 15:32:30`. Stride must be > 0 and cannot contain units of month or larger.
- **AT TIME ZONE / AT LOCAL** (Table 9.34): `timestamp AT TIME ZONE zone → timestamptz` (interpret as being in that zone); `timestamptz AT TIME ZONE zone → timestamp` (wall-clock time in that zone); `timetz AT TIME ZONE zone → timetz` (uses the currently active UTC offset since no date — result can vary with the time of year). `AT LOCAL` = `AT TIME ZONE <session TimeZone>`. zone may be text or an interval (fixed offsets). POSIX-style zone signs are opposite to ISO 8601: `timestamptz '2001-02-16 20:38:40-05' AT TIME ZONE '+05' → 2001-02-16 20:38:40`. Function forms: `timezone(zone, timestamp)`, `timezone(zone, time)`, `timezone(timestamp)`, `timezone(time)`.
- **Current time** — transaction-start based (SQL standard): `CURRENT_DATE`, `CURRENT_TIME[(p)]`, `CURRENT_TIMESTAMP[(p)]`, `LOCALTIME[(p)]`, `LOCALTIMESTAMP[(p)]`, plus `now()` and `transaction_timestamp()`. They do NOT change during a transaction (a feature: consistent "current" time). `statement_timestamp()` = time of receipt of the latest command message from the client. `clock_timestamp()` = actual wall clock, changes within a statement. `timeofday()` = like clock_timestamp but text.
  - Pitfall: `TIMESTAMP 'now'` in a column DEFAULT is converted when the constant is parsed (= table creation time). Use `now()` / `CURRENT_TIMESTAMP`.
- **Delaying execution**: `pg_sleep(double precision seconds)`, `pg_sleep_for(interval)`, `pg_sleep_until(timestamptz)`. Effective resolution is platform-specific (0.01 s is common); never wakes early. WARNING: do not hold more locks than necessary while sleeping.

### Enum support functions  [M2]  (source: functions-enum.txt)
- Example type: `CREATE TYPE rainbow AS ENUM ('red','orange','yellow','green','blue','purple')`.
- `enum_first(anyenum)`, `enum_last(anyenum)`, `enum_range(anyenum) → anyarray` (all values, ordered), `enum_range(anyenum, anyenum)` (inclusive sub-range; NULL first arg = from first value, NULL second = to last value).
- Except for two-argument `enum_range`, the functions ignore the VALUE passed and use only the declared type: `enum_first(null::rainbow) → red`.

### Geometric functions and operators  [M2, M4]  (source: functions-geometry.txt)
- Types: `point, box, lseg, line, path, polygon, circle`.
- Operators (Table 9.36):
  - `+ point`, `- point` (translation; point, box, path, circle); `path + path` (concatenate two OPEN paths; NULL if either is closed).
  - `* point`, `/ point` — complex multiplication/division = scale + rotate about the origin (counterclockwise for `*`, clockwise for `/`). "Rotating" a box only moves its corner points; the box stays axis-aligned so its size is not preserved.
  - `@-@` total length (lseg, path); `@@` center (box, lseg, polygon, circle); unary `#` number of points (path, polygon); binary `#` intersection point (lseg, line) or box intersection (`box # box → box`); `##` closest point to the first object on the second (pairs: (point,box), (point,lseg), (point,line), (lseg,box), (lseg,lseg), (line,lseg)).
  - `<->` distance (all seven types with themselves, point with any, plus (box,lseg), (lseg,line), (polygon,circle) and commutators).
  - `@>` contains (pairs: (box,point), (box,box), (path,point), (polygon,point), (polygon,polygon), (circle,point), (circle,circle)); `<@` contained in or on (pairs: (point,box), (point,lseg), (point,line), (point,path), (point,polygon), (point,circle), (box,box), (lseg,box), (lseg,line), (polygon,polygon), (circle,circle)).
  - `&&` overlap — one common point suffices (box, polygon, circle).
  - Positional: `<<` strictly left, `>>` strictly right, `&<` does not extend to the right of, `&>` does not extend to the left of, `<<|` strictly below, `|>>` strictly above, `&<|` does not extend above, `|&>` does not extend below (point/box/polygon/circle for strict ones; box/polygon/circle for the `&` ones); `box <^ box` below (edges may touch), `box >^ box` above (edges may touch).
  - `?#` intersects (pairs: (box,box), (lseg,box), (lseg,lseg), (lseg,line), (line,box), (line,line), (path,path)); `?-` is horizontal / points horizontally aligned; `?|` is vertical / vertically aligned; `?-|` perpendicular; `?||` parallel; `~=` same as (point, box, polygon, circle).
- CAUTION: `~=` is the true equality for point/box/polygon/circle. Where a geometric `=` exists it compares AREAS only, and `<=` etc. likewise compare areas.
- Before PG14, `point <<| point` and `point |>> point` were named `<^` and `>^` (deprecated names still available).
- Functions (Table 9.37): `area` (box, path, circle; open path → NULL), `center` (box, circle), `diagonal(box) → lseg`, `diameter(circle)`, `height(box)`, `isclosed(path)`, `isopen(path)`, `length` (lseg, path), `npoints` (path, polygon), `pclose(path)`, `popen(path)`, `radius(circle)`, `slope(point, point)`, `width(box)`.
- Conversions (Table 9.38): `box(circle)` (inscribed box), `box(point)` (empty box), `box(point, point)`, `box(polygon)` (bounding box), `bound_box(box, box)`, `circle(box)` (smallest enclosing circle), `circle(point, double precision)`, `circle(polygon)` (center = mean of points, radius = average distance), `line(point, point)` (`→ {0,-1,0}`), `lseg(box)`, `lseg(point, point)`, `path(polygon)`, `point(double precision, double precision)`, `point(box)`, `point(circle)`, `point(lseg)`, `point(polygon)`, `polygon(box)` (4 points), `polygon(circle)` (12-point polygon), `polygon(integer, circle)` (n-point), `polygon(path)`.
- A `point` can be subscripted like an array: `p[0]` = X, `p[1]` = Y (also assignable in UPDATE); `box` and `lseg` act as arrays of two points.

### Network address functions  [M2]  (source: functions-net.txt)
- `cidr` casts to `inet` implicitly; casting `inet` → `cidr` silently zeroes bits right of the netmask.
- Operators (Table 9.39): `<<` strictly contained by, `<<=` contained by or equal, `>>` strictly contains, `>>=` contains or equals, `&&` either contains or equals the other (these five consider only the network parts); `~` NOT, `&` AND, `|` OR; `inet + bigint`, `bigint + inet`, `inet - bigint`, `inet - inet → bigint` (`inet '::1' - inet '::ffff:1' → -4294901760`).
- Functions (Table 9.40): `abbrev(inet)`, `abbrev(cidr)` (`abbrev(cidr '10.1.0.0/16') → 10.1/16`), `broadcast(inet)`, `family(inet)` (4 or 6), `host(inet) → text`, `hostmask(inet)`, `inet_merge(inet, inet) → cidr` (smallest network including both), `inet_same_family`, `masklen`, `netmask`, `network(inet) → cidr`, `set_masklen(inet, integer)` (address unchanged) / `set_masklen(cidr, integer)` (bits right of the new mask zeroed), `text(inet)` (`text(inet '192.168.1.5') → 192.168.1.5/32`).
- MAC (Table 9.41): `trunc(macaddr)` (zero last 3 bytes), `trunc(macaddr8)` (zero last 5 bytes), `macaddr8_set7bit(macaddr8)` (modified EUI-64 for IPv6: `00:34:56:ab:cd:ef → 02:34:56:ff:fe:ab:cd:ef`). macaddr types also support `~`, `&`, `|`.

### Text search functions and operators  [M6, M4]  (source: functions-textsearch.txt)
- Operators (Table 9.42): `tsvector @@ tsquery` (either order); `text @@ tsquery` (implicit `to_tsvector()`); `tsvector || tsvector` (second input's positions are shifted: `'a:1 b:2'::tsvector || 'c:1 d:2 b:3'::tsvector → 'a':1 'b':2,5 'c':3 'd':4`); `tsquery && tsquery`; `tsquery || tsquery`; `!! tsquery`; `tsquery <-> tsquery` (phrase/FOLLOWED BY); `tsquery @> tsquery` / `<@` (containment considering only lexemes, ignoring combining operators: `'cat'::tsquery <@ '!cat & rat'::tsquery → t`).
- Ordinary comparison operators exist for tsvector/tsquery only so that e.g. unique indexes can be built.
- Functions (Table 9.43): `array_to_tsvector(text[])` (elements used as-is; no empty strings or NULLs), `get_current_ts_config() → regconfig` (per `default_text_search_config`), `length(tsvector)` (number of lexemes), `numnode(tsquery)` (lexemes + operators: `numnode('(fat & rat) | cat') → 5`), `plainto_tsquery([config,] text)` (all non-stopwords ANDed; punctuation ignored), `phraseto_tsquery` (`'The Cat and Rats' → 'cat' <2> 'rat'` — stopword gaps preserved as distance), `websearch_to_tsquery` (quoted sequences → phrase, `or` → OR, dash → NOT: `'"fat rat" or cat dog' → 'fat' <-> 'rat' | 'cat' & 'dog'`), `querytree(tsquery)` (indexable portion; empty or `T` = non-indexable), `setweight(vector, weight "char")`, `setweight(vector, weight, lexemes text[])`, `strip(tsvector)` (remove positions and weights), `to_tsquery([config,] text)` (words must be combined by valid tsquery operators), `to_tsvector([config,] text)` (`to_tsvector('english', 'The Fat Rats') → 'fat':2 'rat':3`), `to_tsvector([config,] json|jsonb)` (string values only; positions as though one stopword lies between each pair of values; jsonb field order is implementation-dependent: json gives `'dog':5 'fat':2 'rat':3`, jsonb gives `'dog':1 'fat':4 'rat':5`), `json_to_tsvector` / `jsonb_to_tsvector([config,] document, filter jsonb)` (filter = array of `"string"`, `"numeric"`, `"boolean"`, `"key"`, `"all"`), `ts_delete(vector, lexeme|lexemes[])`, `ts_filter(vector, weights "char"[])`, `ts_headline([config,] document text|json|jsonb, query [, options])` (document must be raw text, not a tsvector), `ts_rank([weights real[],] vector, query [, normalization integer]) → real`, `ts_rank_cd(...)` (cover density), `ts_rewrite(query, target, substitute)`, `ts_rewrite(query, select text)`, `tsquery_phrase(q1, q2 [, distance])` (`→ 'fat' <10> 'cat'`), `tsvector_to_array(tsvector)`, `unnest(tsvector) → setof record(lexeme text, positions smallint[], weights text)` (default weight D).
- All optional-`regconfig` functions fall back to `default_text_search_config`.
- Debugging (Table 9.44): `ts_debug([config,] document) → setof record(alias, description, token, dictionaries regdictionary[], dictionary regdictionary, lexemes text[])`; `ts_lexize(dict regdictionary, token) → text[]` (array of lexemes if known; EMPTY array if a stop word; NULL if unknown: `ts_lexize('english_stem', 'stars') → {star}`); `ts_parse(parser_name|parser_oid, txt) → setof record(tokid, token)`; `ts_token_type(parser_name|parser_oid) → setof record(tokid, alias, description)` (default parser OID 3722 in the example); `ts_stat(query text [, weights text]) → setof record(word, ndoc, nentry)` (query must return one tsvector column).

### UUID functions (v4, v7)  [M2]  (source: functions-uuid.txt)
- Generation (Table 9.45): `gen_random_uuid() → uuid` and `uuidv4() → uuid` — version 4 (random). `uuidv7([shift interval]) → uuid` — version 7 (time-ordered).
- `uuidv7` timestamp = UNIX timestamp with millisecond precision + sub-millisecond timestamp + random. Optional `shift` offsets the computed timestamp; infinite intervals are rejected; the shifted timestamp must fit UUIDv7's 48-bit millisecond field: 1970-01-01 00:00:00 UTC to approximately year 10889, else an error.
- Extraction (Table 9.46): `uuid_extract_timestamp(uuid) → timestamptz` (versions 1 and 7 only; NULL for others; not necessarily exactly the generation time), `uuid_extract_version(uuid) → smallint` (RFC 9562 variants only; NULL otherwise; 4 for gen_random_uuid, 7 for uuidv7).
- Example: `uuid_extract_timestamp('019535d9-3df7-79fb-b466-fa907fa17f9e'::uuid) → 2025-02-23 21:46:24.503-05`.
- Standard comparison operators work on uuid. The `uuid-ossp` module provides other UUID algorithms.

### XML functions  [M6, M2]  (source: functions-xml.txt)
- Most need a build with `configure --with-libxml`. `xmlparse` / `xmlserialize` are documented in 8.13.
- Producing content: `xmltext(text) → xml` (single text node; escapes `& < > "`: `xmltext('< foo & bar >') → &lt; foo &amp; bar &gt;`); `xmlcomment(text)` (text cannot contain `--` or end with `-`; null → null); `xmlconcat(xml [, ...])` (nulls omitted; null only if all null; version declaration kept only if all identical; standalone "yes" only if all yes, "no" if all have one and at least one is no; encoding declarations always removed); `xmlelement(NAME name [, XMLATTRIBUTES(attvalue [AS attname] [, ...])] [, content [, ...]])`; `xmlforest(content [AS name] [, ...])`; `xmlpi(NAME name [, content])` (content must not contain `?>`); `xmlroot(xml, VERSION {text|NO VALUE} [, STANDALONE {YES|NO|NO VALUE}])`; `xmlagg(xml)` aggregate (supports `xmlagg(x ORDER BY y DESC)`).
- Invalid XML names are escaped as `_xHHHH_` (Unicode codepoint hex): `xmlelement(name "foo$bar", xmlattributes('xyz' as "a&b")) → <foo_x0024_bar a_x0026_b="xyz"/>`.
- Attribute/element name may be omitted only when the value is a column reference (column name is used).
- Non-xml content is escaped into character data (`<`, `>`, `&` → entities); `bytea` content is base64 or hex per GUC `xmlbinary`.
- An xmlforest of more than one element is not a valid XML document — wrap in xmlelement.
- Predicates: `xml IS DOCUMENT`, `xml IS NOT DOCUMENT` (document vs content fragment; null → null); `XMLEXISTS(text PASSING [BY {REF|VALUE}] xml [BY {REF|VALUE}])` (XPath 1.0 only — the standard says XQuery; BY REF/BY VALUE accepted but ignored; context item must be a document); `xml_is_well_formed(text)` (follows GUC `xmloption` = DOCUMENT or CONTENT, so it predicts whether a cast to xml succeeds), `xml_is_well_formed_document(text)`, `xml_is_well_formed_content(text)` (namespace matching is checked).
- Processing: `xpath(xpath text, xml xml [, nsarray text[]]) → xml[]` (XPath 1.0; second arg must be a well-formed document with a single root; nsarray is a 2-D text array of `[alias, URI]` pairs; scalar result → single-element array; default namespaces need an explicit alias), `xpath_exists(xpath, xml [, nsarray]) → boolean`.
- `XMLTABLE([XMLNAMESPACES(namespace_uri AS namespace_name [, ...]),] row_expression PASSING [BY {REF|VALUE}] document_expression [BY {REF|VALUE}] COLUMNS name { type [PATH column_expression] [DEFAULT default_expression] [NOT NULL | NULL] | FOR ORDINALITY } [, ...]) → setof record` — only valid in FROM.
  - Default namespace specification not supported. No rows if document is null or row_expression yields an empty node-set / non-node-set. At most one FOR ORDINALITY column (integer, from 1). Column name is the implicit path if PATH is omitted.
  - Value rules: non-XML XPath result (string, boolean, double) is assigned via its string form (boolean → `1`/`0` if the column type category is numeric, else `true`/`false`); XML result into a non-xml column must be exactly one node (else error), assigned by its string value (concatenation of all descendant text nodes in document order; empty string, not NULL, if none; `xsi:nil` ignored). Empty node-set → NULL unless DEFAULT. DEFAULT is evaluated each time needed (volatile functions like `nextval` usable). NOT NULL column with no match and no non-null default → error.
  - XPath 1.0 does not define node-set order → result order is implementation-dependent.
- Mapping tables to XML: `table_to_xml(tbl regclass, nulls boolean, tableforest boolean, targetns text)`, `query_to_xml(query text, nulls, tableforest, targetns)`, `cursor_to_xml(cursor refcursor, count integer, nulls, tableforest, targetns)` (recommended for large tables since results are built in memory); schema variants `table_to_xmlschema`, `query_to_xmlschema`, `cursor_to_xmlschema`; combined `table_to_xml_and_xmlschema`, `query_to_xml_and_xmlschema`; whole-schema/database: `schema_to_xml`, `schema_to_xmlschema`, `schema_to_xml_and_xmlschema`, `database_to_xml`, `database_to_xmlschema`, `database_to_xml_and_xmlschema` (tables not readable by the current user are ignored; database functions also skip schemas without USAGE).
  - `tableforest=false` → one `<tablename>` document containing `<row>` elements; `tableforest=true` → content fragment with one `<tablename>` element per row. For queries/cursors the names `table` (first format) and `row` (second) are used. `nulls=true` → `<columnname xsi:nil="true"/>`; false → column omitted. `targetns` '' for no namespace.
  - Example 9.1 gives an XSLT stylesheet turning `table_to_xml_and_xmlschema` output into HTML.

### JSON / JSONB operators  [M2, M3, M4]  (source: functions-json.txt)
- PostgreSQL implements the SQL/JSON data model: sequences of items; each item is an SQL scalar, SQL/JSON null, or a composite (array/object). Formalizes RFC 7159.
- Comparison operators (Table 9.1) exist for `jsonb` but NOT for `json`; they follow the B-tree ordering rules of 8.14.4.
- Operators for both json and jsonb (Table 9.47):
  - `-> integer` → json/jsonb: n'th array element, zero-indexed; negative counts from the end (`'[...]'::json -> -3`).
  - `-> text` → object field by key.
  - `->> integer`, `->> text` → same as text.
  - `#> text[]` → sub-object at path (keys or array indexes): `'{"a": {"b": ["foo","bar"]}}'::json #> '{a,b,1}' → "bar"`.
  - `#>> text[]` → same as text (`→ bar`).
  - These extraction operators return NULL (never fail) if the structure doesn't match.
- jsonb-only operators (Table 9.48):
  - `@>` contains; `<@` contained in (`'{"a":1, "b":2}'::jsonb @> '{"b":2}'::jsonb → t`).
  - `? text` — string exists as a TOP-LEVEL key or array element; `?| text[]` any; `?& text[]` all.
  - `||` concatenate: two arrays → all elements; two objects → union of keys, second wins on duplicates; otherwise non-array inputs are wrapped in single-element arrays. NOT recursive (top level only). `'{"a": "b"}'::jsonb || '42'::jsonb → [{"a": "b"}, 42]`. To append an array as one entry: `'[1, 2]'::jsonb || jsonb_build_array('[3, 4]'::jsonb) → [1, 2, [3, 4]]`.
  - `- text` delete key or matching string array elements (`'["a","b","c","b"]'::jsonb - 'b' → ["a","c"]`); `- text[]` delete all matching; `- integer` delete array element by index (negative from end; ERROR if not an array); `#- text[]` delete at path (`'["a", {"b":1}]'::jsonb #- '{1,b}' → ["a", {}]`).
  - `@? jsonpath` — does the path return any item? (use with SQL-standard paths, not predicate checks). `@@ jsonpath` — result of a predicate check (returns NULL if the path result is not a single boolean).
  - `@?` and `@@` SUPPRESS these errors: missing object field or array element, unexpected JSON item type, datetime and numeric errors.

### JSON creation functions  [M3, M2]  (source: functions-json.txt)
- RETURNING clause (where offered) must name `json`, `jsonb`, `bytea`, a character string type (`text`, `char`, `varchar`), or a type castable to json; default is `json`.
- Table 9.49:
  - `to_json(anyelement) → json`, `to_jsonb(anyelement) → jsonb`: arrays/composites converted recursively (multidimensional arrays → arrays of arrays); if a cast to json exists for the type it is used (e.g. hstore → object); other scalars except number/boolean/null use text representation as a JSON string. `to_jsonb(row(42, 'Fred said "Hi."'::text)) → {"f1": 42, "f2": "Fred said \"Hi.\""}`.
  - `array_to_json(anyarray [, boolean])` (true = line feeds between top-level elements).
  - `json_array([value_expression [FORMAT JSON] [, ...]] [{NULL|ABSENT} ON NULL] [RETURNING data_type [FORMAT JSON [ENCODING UTF8]]])` and `json_array([query_expression] [RETURNING ...])` (query must return a single column; ABSENT ON NULL always applies for the query form). `json_array(1,true,json '{"a":null}') → [1, true, {"a":null}]`.
  - `row_to_json(record [, boolean])` (`row_to_json(row(1,'foo')) → {"f1":1,"f2":"foo"}`).
  - `json_build_array(VARIADIC "any")`, `jsonb_build_array(VARIADIC "any")`.
  - `json_build_object(VARIADIC "any")`, `jsonb_build_object(VARIADIC "any")` (alternating keys/values; keys coerced to text).
  - `json_object([{key_expression {VALUE | ':'} value_expression [FORMAT JSON [ENCODING UTF8]]} [, ...]] [{NULL|ABSENT} ON NULL] [{WITH|WITHOUT} UNIQUE [KEYS]] [RETURNING ...])` — key cannot be NULL or of a type castable to json; default NULL ON NULL. `json_object('code' VALUE 'P123', 'title': 'Jaws')`.
  - `json_object(text[])` / `jsonb_object(text[])` (1-D even-length array of alternating key/value, or 2-D array of pairs; all values become JSON strings); `json_object(keys text[], values text[])` / `jsonb_object(keys, values)`.
  - `json(expression [FORMAT JSON [ENCODING UTF8]] [{WITH|WITHOUT} UNIQUE [KEYS]]) → json` (text or UTF8 bytea → JSON; duplicate keys preserved unless WITH UNIQUE).
  - `json_scalar(expression)` (number/boolean → JSON number/boolean; everything else → JSON string; `json_scalar(CURRENT_TIMESTAMP) → "2022-05-10T10:51:04.62128-04:00"`).
  - `json_serialize(expression [FORMAT JSON [ENCODING UTF8]] [RETURNING data_type ...])` → character string or bytea; default text.
- Testing (Table 9.50): `expression IS [NOT] JSON [{VALUE | SCALAR | ARRAY | OBJECT}] [{WITH | WITHOUT} UNIQUE [KEYS]]`. `'abc' IS JSON → f`; `'123' IS JSON SCALAR → t`; `'[{"a":"1"},{"b":"2","b":"3"}]' IS JSON ARRAY WITH UNIQUE KEYS → f`.

### JSON processing functions  [M3, M2]  (source: functions-json.txt)
- Table 9.51 (json_ and jsonb_ variants unless stated):
  - `json[b]_array_elements(json) → setof json[b]`; `json[b]_array_elements_text → setof text`; `json[b]_array_length → integer`.
  - `json[b]_each → setof record(key text, value json[b])`; `json[b]_each_text → setof record(key text, value text)`.
  - `json[b]_extract_path(from_json, VARIADIC path_elems text[])` (= `#>`); `json[b]_extract_path_text` (= `#>>`).
  - `json[b]_object_keys → setof text` (top-level keys).
  - `json[b]_populate_record(base anyelement, from_json)`: fills a row of base's composite type from matching field names; unmatched JSON fields ignored; unmatched columns take values from `base` (usually `NULL::type` → nulls). Conversion rules in order: (1) JSON null → SQL null; (2) column of type json/jsonb → value reproduced exactly; (3) composite column + JSON object → recursive; (4) array column + JSON array → recursive; (5) JSON string → string contents fed to the type's input function; (6) otherwise the text representation is fed to the input function. Best written in FROM (LATERAL).
  - `jsonb_populate_record_valid(base anyelement, from_json json) → boolean` — would `jsonb_populate_record` succeed? (`'{"a": "aaa"}'` into `char(2)` → f; the real call errors `value too long for type character(2)`).
  - `json[b]_populate_recordset(base, from_json) → setof anyelement` (top-level array of objects).
  - `json[b]_to_record(json) → record`, `json[b]_to_recordset → setof record` — need an `AS x(col type, ...)` column definition list; unmatched columns are NULL.
  - `jsonb_set(jsonb_in, path text[], replacement jsonb [, create_if_missing boolean])` — create_if_missing default true; all EARLIER path steps must exist or input is returned unchanged; negative indexes count from the end; out-of-range last index with create_if_missing adds at the beginning (negative) or end (positive).
  - `jsonb_set_lax(jsonb_in, path, replacement [, create_if_missing [, null_value_treatment text]])` — if replacement is SQL NULL, behaviour per `null_value_treatment`: `'raise_exception'`, `'use_json_null'` (default), `'delete_key'`, `'return_target'`.
  - `jsonb_insert(jsonb_in, path, replacement [, insert_after boolean])` — default insert BEFORE the array element; for object fields inserts only if the key does not already exist.
  - `json[b]_strip_nulls(target [, strip_in_arrays boolean])` — recursively removes object fields with null values; `strip_in_arrays` (default false) also strips null array elements; bare nulls never stripped.
  - `jsonb_path_exists(target, path jsonpath [, vars jsonb [, silent boolean]]) → boolean`; `jsonb_path_match(...) → boolean` (predicate check expressions only); `jsonb_path_query(...) → setof jsonb`; `jsonb_path_query_array(...) → jsonb`; `jsonb_path_query_first(...) → jsonb` (NULL if none). `vars` must be a JSON object whose fields are substituted for `$name` variables; `silent = true` suppresses the same errors as `@?`/`@@`.
  - `_tz` variants: `jsonb_path_exists_tz`, `jsonb_path_match_tz`, `jsonb_path_query_tz`, `jsonb_path_query_array_tz`, `jsonb_path_query_first_tz` — support timezone-aware datetime comparisons; depend on `TimeZone`, so they are STABLE and cannot be used in indexes; the non-tz versions are IMMUTABLE (indexable) but error on such comparisons.
  - `jsonb_pretty(jsonb) → text` (indented).
  - `json[b]_typeof → text`: `object`, `array`, `string`, `number`, `boolean`, `null`. `json_typeof('null'::json) → null` (the string) vs `json_typeof(NULL::json) IS NULL → t`.

### SQL/JSON path language (jsonpath)  [M3, M2]  (source: functions-json.txt)
- Path = sequence of elements evaluated left to right; `$` = context item (must be the first element); accessors: `.key`, `[*]`, `[n]` (0-relative), `.**` (recursive), methods preceded by a dot (`.size()`); filter `? (condition)` with `@` = current item; three-valued logic (true/false/unknown; test with `is unknown`). Filters can be chained, used at different nesting levels, and nested via `exists(...)`.
- Running example (GPS tracker): `jsonb_path_query(:'json', '$.track.segments[*].location')`; `'$.track.segments[*].HR ? (@ > 130)'` → 135; `'$.track.segments[*] ? (@.HR > 130)."start time"'`; `'$.track.segments[*] ? (@.location[1] < 13.4) ? (@.HR > 130)."start time"'`; `'$.track ? (exists(@.segments[*] ? (@.HR > 130))).segments.size()'` → 2.
- Deviation from the standard: a path may itself be a Boolean predicate check expression (`'$.track.segments[*].HR > 130'` → `true`), returning a single jsonb true/false/null. Predicate checks are REQUIRED for `@@` / `jsonb_path_match` and should NOT be used with `@?` / `jsonb_path_exists`.
- Modes: `lax` (default) — structural errors (missing member/element) are suppressed; operands automatically wrapped into arrays or unwrapped; comparison operators auto-unwrap; an array of size 1 equals its sole element. `strict` — structural errors raise errors. Auto-unwrapping is not done for `type()`/`size()` and only goes one level down (nested arrays remain).
  - `lax $.track.segments.location` works; `strict $.track.segments.location` → `ERROR: jsonpath member accessor can only be applied to an object`.
  - Pitfall: `lax $.**.HR` returns every HR value TWICE (`.**` selects both the array and its elements, and `.HR` unwraps the array). Use `.**` only in strict mode.
  - Pitfall: `lax $.track.segments[*].location ?(@[*] > 15)` returns the unwrapped matching NUMBERS (47.763, 47.706) not the arrays; strict mode returns the arrays.
- Operators and methods (Table 9.52): binary `+ - * / %` (single values only); unary `+`/`-` (can iterate over multiple values); `.type()`; `.size()` (array length, or 1 if not an array); `.boolean()`; `.string()`; `.double()`; `.ceiling()`; `.floor()`; `.abs()`; `.bigint()`; `.decimal([precision [, scale]])`; `.integer()`; `.number()`; `.datetime()`; `.datetime(template)`; `.date()`; `.time()`; `.time(precision)`; `.time_tz()`; `.time_tz(precision)`; `.timestamp()`; `.timestamp(precision)`; `.timestamp_tz()`; `.timestamp_tz(precision)`; `.keyvalue()` (array of `{"key","value","id"}` objects; id identifies the owning object).
  - In lax mode methods applied to an array run per element, except `.type()` and `.size()`.
  - `.datetime()` tries ISO formats in order: date, timetz, time, timestamptz, timestamp, and emits the first match's type. `.datetime(template)` uses to_timestamp parsing rules with three exceptions: no unmatched template patterns; only separators minus, period, solidus, comma, apostrophe, semicolon, colon, space; separators must match the input exactly.
  - Cross-type datetime comparison casts (date→timestamp/timestamptz, timestamp→timestamptz, time→timetz): all but date→timestamp depend on `TimeZone` and are allowed only in the `_tz` functions.
- Filter elements (Table 9.53): `==`, `!=`, `<>`, `<`, `<=`, `>`, `>=`, `true`, `false`, `null` (comparison to null works normally, unlike SQL), `&&`, `||`, `!`, `is unknown`, `like_regex "pattern" [flag "flags"]`, `starts with`, `exists(path_expression)` (returns unknown if the path would error).
- `like_regex` flags: `i` case-insensitive, `m` (^ and $ match at newlines), `s` (. matches newline), `q` (quote the pattern → substring match). Implemented with the POSIX engine (XQuery flag letters are translated). Backslashes must be doubled inside the jsonpath string literal: `$.* ? (@ like_regex "^\\d+$")`.

### SQL/JSON query functions and JSON_TABLE  [M3]  (source: functions-json.txt)
- `context_item` may be jsonb or a string castable to jsonb. Parsing errors in that implicit cast are thrown unconditionally (NOT governed by ON ERROR).
- `JSON_EXISTS(context_item, path_expression [PASSING {value AS varname} [, ...]] [{TRUE | FALSE | UNKNOWN | ERROR} ON ERROR]) → boolean`; default `FALSE ON ERROR`; UNKNOWN = SQL NULL. `JSON_EXISTS(jsonb '{"a": [1,2,3]}', 'strict $.a[5]' ERROR ON ERROR)` → `ERROR: jsonpath array subscript is out of bounds`; with `lax` → f.
- `JSON_QUERY(context_item, path_expression [PASSING ...] [RETURNING data_type [FORMAT JSON [ENCODING UTF8]]] [{WITHOUT | WITH {CONDITIONAL | [UNCONDITIONAL]}} [ARRAY] WRAPPER] [{KEEP | OMIT} QUOTES [ON SCALAR STRING]] [{ERROR | NULL | EMPTY {[ARRAY] | OBJECT} | DEFAULT expression} ON EMPTY] [{... same ...} ON ERROR]) → jsonb`.
  - Default WITHOUT WRAPPER (multiple values = error); `WITH WRAPPER` = `WITH UNCONDITIONAL WRAPPER` (even one value is wrapped); `WITH CONDITIONAL WRAPPER` wraps only multiple values. Default KEEP QUOTES; OMIT QUOTES cannot be combined with WITH WRAPPER. Default for ON EMPTY and ON ERROR: SQL NULL.
  - `JSON_QUERY(jsonb '[1,[2,3],null]', 'lax $[*][$off]' PASSING 1 AS off WITH CONDITIONAL WRAPPER) → 3`; `JSON_QUERY(jsonb '{"a": "[1, 2]"}', 'lax $.a' OMIT QUOTES) → [1, 2]`.
- `JSON_VALUE(context_item, path_expression [PASSING ...] [RETURNING data_type] [{ERROR | NULL | DEFAULT expression} ON EMPTY] [{ERROR | NULL | DEFAULT expression} ON ERROR]) → text` — single SQL/JSON scalar only (multiple values = error; use JSON_QUERY for objects/arrays); quotes always removed. `JSON_VALUE(jsonb '"123.45"', '$' RETURNING float) → 123.45`; `JSON_VALUE(jsonb '[1,2]', 'strict $[*]' DEFAULT 9 ON ERROR) → 9`.
  - `JSON_VALUE()` returns SQL NULL for a JSON null; `JSON_QUERY()` returns the JSON null as is.
- `JSON_TABLE(context_item, path_expression [AS json_path_name] [PASSING ...] COLUMNS (json_table_column [, ...]) [{ERROR | EMPTY [ARRAY]} ON ERROR])` — usable in FROM of SELECT/UPDATE/DELETE and as a MERGE data source; rows are LATERALLY joined to the generating row.
  - Column variants: `name FOR ORDINALITY` (from 1; each NESTED PATH has its own counter); `name type [FORMAT JSON [ENCODING UTF8]] [PATH path] [WRAPPER clause] [QUOTES clause] [... ON EMPTY] [... ON ERROR]` (default NULL for both; internally JSON_VALUE, or JSON_QUERY if the type is non-scalar or FORMAT JSON/WRAPPER/QUOTES is present; FORMAT JSON meaningful only for bpchar, bytea, character varying, name, json, jsonb, text or domains over them; OMIT QUOTES overrides FORMAT JSON); `name type EXISTS [PATH path] [{ERROR | TRUE | FALSE | UNKNOWN} ON ERROR]` (default FALSE; = JSON_EXISTS; type must have a cast from boolean); `NESTED [PATH] path [AS json_path_name] COLUMNS (...)` (recursive).
  - If PATH is omitted the path `$.name` (column name) is used. Top-level ON ERROR: `ERROR` or `EMPTY` (0-row table) — affects only the row-pattern path, not column errors.
  - Row pattern → one row per item; NESTED child rows are joined to the parent row; sibling NESTED PATHs at the same level are combined with UNION (non-matching sibling columns NULL). Example with `$.movies[*]` and `$.books[*]` siblings yields 5 rows (2 movie rows + 3 book/author rows).
  - Docs example: `my_films(js jsonb)` with `$.favorites[*]`, columns `id FOR ORDINALITY, kind text PATH '$.kind', NESTED PATH '$.films[*]' COLUMNS (title text FORMAT JSON PATH '$.title' OMIT QUOTES, director text PATH '$.director' KEEP QUOTES)` → 5 rows.

### Sequence manipulation functions  [M3, M5, M7]  (source: functions-sequence.txt)
- Sequences are special single-row tables created with `CREATE SEQUENCE`. The sequence is identified by a `regclass` argument (its OID in `pg_class`; the regclass input converter resolves names).
- Table 9.55:
  - `nextval(regclass) → bigint` — atomically advances and returns; concurrent sessions each get a distinct value; default sequence starts at 1. Requires USAGE or UPDATE privilege.
  - `setval(regclass, bigint [, boolean]) → bigint` — sets `last_value` and optionally `is_called`. Two-arg form sets `is_called = true` (next nextval advances first) and also sets what `currval` reports. Three-arg with `false`: next nextval returns exactly that value, and `currval` is NOT changed. `setval('myseq', 42)` → next nextval 43; `setval('myseq', 42, true)` → 43; `setval('myseq', 42, false)` → 42. Returns its second argument. Requires UPDATE privilege.
  - `currval(regclass) → bigint` — value most recently obtained by nextval for this sequence IN THIS SESSION (error if nextval was never called in the session); session-local, unaffected by other sessions. Requires USAGE or SELECT.
  - `lastval() → bigint` — like currval but for whichever sequence nextval was last applied to in the session; error if nextval not yet called. Requires USAGE or SELECT on that sequence.
- CAUTION — sequences are NOT gapless: a nextval value is never reclaimed if the transaction aborts (to avoid blocking concurrent transactions); crashes also cause gaps; `INSERT ... ON CONFLICT` computes the tuple (incl. nextval) BEFORE detecting the conflict, so gaps arise without any abort.
- `setval` changes are immediately visible to other transactions and are NOT undone on rollback.
- Crash before commit of a transaction containing nextval/setval: the sequence state change might not have reached persistent storage, so the state after restart is uncertain (original or updated). Harmless inside the database; for outside-the-database use, make sure the nextval call has COMMITTED first.

### Conditional expressions  [M3]  (source: functions-conditional.txt)
- `COALESCE`, `GREATEST`, `LEAST` are not ordinary functions → cannot take explicit `VARIADIC` array arguments.
- General CASE: `CASE WHEN condition THEN result [WHEN ...] [ELSE result] END`; first true condition wins; no ELSE and nothing true → NULL. Simple CASE: `CASE expression WHEN value THEN result ... END` (equality comparison, like C switch). All result expressions must be convertible to a single output type (10.5).
- CASE does not evaluate unneeded subexpressions: `WHERE CASE WHEN x <> 0 THEN y/x > 1.5 ELSE false END` avoids division by zero. NOT ironclad: a constant `1/0` subexpression usually fails at PLANNING time even inside a never-entered CASE arm (4.2.14).
- `COALESCE(value [, ...])` — first non-null argument; null only if all null; arguments right of the first non-null are not evaluated; like NVL / IFNULL elsewhere.
- `NULLIF(value1, value2)` — null if `value1 = value2`, else value1. Result is the first argument of the implied `=` operator, which may have been promoted: `NULLIF(1, 2.2)` yields `numeric` (there is no `integer = numeric` operator).
- `GREATEST(value [, ...])`, `LEAST(value [, ...])` — NULLs are IGNORED; result is NULL only if all are NULL (deviation from the SQL standard, which returns NULL if any argument is NULL).

### Array functions and operators  [M2, M3, M4]  (source: functions-array.txt)
- Array comparison (`=`, `<`, ...): element-by-element using the element type's default B-tree comparison function, sorting on the first difference; multidimensional arrays are visited in row-major order (last subscript varies fastest); if contents are equal but dimensionality differs, the first difference in dimensionality info decides.
- Operators (Table 9.56): `@>` contains (duplicates not special: `ARRAY[1]` and `ARRAY[1,1]` each contain the other; `ARRAY[1,4,3] @> ARRAY[3,1,3] → t`), `<@` contained by, `&&` overlap, `||` array-array (null/empty array is a no-op; same number of dimensions or differing by one: `ARRAY[1,2,3] || ARRAY[[4,5,6],[7,8,9.9]] → {{1,2,3},{4,5,6},{7,8,9.9}}`), `element || array`, `array || element` (array must be empty or one-dimensional).
- Functions (Table 9.57):
  - `array_append(arr, elem)`, `array_cat(arr, arr)`, `array_prepend(elem, arr)`.
  - `array_dims(anyarray) → text` (`[1:2][1:3]`), `array_ndims`, `array_length(anyarray, dim)` (NULL — not 0 — for empty or missing dimensions: `array_length(array[]::int[], 1) → NULL`), `array_lower`, `array_upper`, `cardinality` (total elements, 0 if empty: `cardinality(ARRAY[[1,2],[3,4]]) → 4`).
  - `array_fill(anyelement, integer[] [, integer[]])` (dimension lengths, optional lower bounds default 1: `array_fill(7, ARRAY[3], ARRAY[2]) → [2:4]={7,7,7}`).
  - `array_position(arr, elem [, start]) → integer` (first subscript or NULL; 1-D only; uses IS NOT DISTINCT FROM so NULL can be searched), `array_positions(arr, elem) → integer[]` (empty array if not found; NULL only if the array is NULL).
  - `array_remove(arr, elem)` (1-D only; can remove NULLs), `array_replace(arr, from, to)`.
  - `array_reverse(anyarray)` (reverses the FIRST dimension), `array_sample(array, n)` (n random items, n <= first-dimension length; for multi-dim an item is a slice), `array_shuffle(anyarray)` (first dimension), `array_sort(array [, descending boolean [, nulls_first boolean]])` (sorts the first dimension by the element type's default ordering; COLLATE can be added to the argument; default ascending; `nulls_first` defaults to the value of `descending`; `array_sort(ARRAY[[2,4],[2,1],[6,5]]) → {{2,1},{2,4},{6,5}}`).
  - `array_to_string(array, delimiter [, null_string])` (NULL entries omitted unless null_string given: `array_to_string(ARRAY[1,2,3,NULL,5], ',', '*') → 1,2,3,*,5`).
  - `trim_array(array, n)` (remove last n elements of the first dimension).
  - `unnest(anyarray) → setof anyelement` (storage order; multi-dim arrays are flattened), `unnest(anyarray, anyarray [, ...])` (FROM clause only; shorter arrays padded with NULLs).
- See also aggregate `array_agg` (9.21), index support in 11.2.

### Range and multirange functions and operators  [M2, M4]  (source: functions-range.txt)
- Comparison operators order ranges by lower bound first, then upper bound; multirange comparison compares each range until one is unequal. Not a useful ordering — provided so unique (B-tree) indexes can be built.
- Range operators (Table 9.58): `@>` (range contains range / element), `<@` (range or element contained), `&&` overlap, `<<` strictly left of, `>>` strictly right of, `&<` does not extend to the right of, `&>` does not extend to the left of, `-|-` adjacent (`numrange(1.1,2.2) -|- numrange(2.2,3.3) → t`), `+` union (`numrange(5,15) + numrange(10,20) → [5,20)`; ranges must overlap or be adjacent), `*` intersection (`[10,15)`), `-` difference (`int8range(5,15) - int8range(10,20) → [5,10)`; must not produce two pieces).
- Multirange operators (Table 9.59): the same operator set with every multirange/range combination: `@>` (mr@>mr, mr@>range, mr@>elem, range@>mr), `<@` (mr<@mr, mr<@range, range<@mr, elem<@mr), `&&`, `<<`, `>>`, `&<`, `&>`, `-|-` (mr/mr, mr/range, range/mr each), `+`, `*`, `-` (mr/mr only; union need NOT overlap or be adjacent: `'{[5,10)}'::nummultirange + '{[15,20)}'::nummultirange → {[5,10), [15,20)}`; `'{[5,20)}'::int8multirange - '{[10,15)}'::int8multirange → {[5,10), [15,20)}`).
- Empty-range rules: left-of/right-of/adjacent operators always return false with an empty range/multirange; elsewhere empty is the additive identity (union with empty = itself; minus empty = itself); every range contains the empty range.
- Range `+` and `-` FAIL when the result would be two disjoint sub-ranges; fix: cast to multiranges first (multirange operators never fail for disjoint inputs).
- Range functions (Table 9.60): `lower(anyrange)`, `upper(anyrange)` (NULL if empty or unbounded), `isempty`, `lower_inc`, `upper_inc`, `lower_inf`, `upper_inf` (no bound; a bound of ±Infinity returns false), `range_merge(anyrange, anyrange)` (smallest range including both: `range_merge('[1,2)'::int4range, '[3,4)'::int4range) → [1,4)`).
- Multirange functions (Table 9.61): `lower`, `upper`, `isempty`, `lower_inc`, `upper_inc`, `lower_inf`, `upper_inf`, `range_merge(anymultirange) → anyrange`, `multirange(anyrange) → anymultirange`, `unnest(anymultirange) → setof anyrange` (ascending order).
- `lower_inc`, `upper_inc`, `lower_inf`, `upper_inf` all return false for an empty range/multirange.

### Aggregate functions  [M3, M4]  (source: functions-aggregate.txt)
- Aggregates supporting "Partial Mode" are eligible for optimizations such as PARALLEL aggregation. All aggregates accept an optional ORDER BY inside the call (4.2.7); the docs show it only where order matters. (FILTER and DISTINCT syntax live in 4.2.7, not this page.)
- General-purpose (Table 9.62) — name → result [Partial Mode]:
  - `any_value(anyelement)` → arbitrary non-null input value [Yes]
  - `array_agg(anynonarray ORDER BY ...)` → anyarray, INCLUDES nulls [Yes]; `array_agg(anyarray ...)` → array of one higher dimension (inputs must have the same dimensionality, not empty/null) [Yes]
  - `avg`: smallint/integer/bigint/numeric → numeric; real/double precision → double precision; interval → interval [Yes]
  - `bit_and`, `bit_or`, `bit_xor` (smallint, integer, bigint, bit; bit_xor useful as a checksum of an unordered set) [Yes]
  - `bool_and`, `bool_or` [Yes]; `every` = SQL-standard equivalent of bool_and [Yes]
  - `count(*)` → bigint number of input rows [Yes]; `count("any")` → rows where the value is not null [Yes]
  - `json_agg` / `jsonb_agg(anyelement ORDER BY ...)` (includes nulls) [No]; `json_agg_strict` / `jsonb_agg_strict` (skips nulls) [No]
  - `json_arrayagg([value_expression] [ORDER BY sort_expression] [{NULL|ABSENT} ON NULL] [RETURNING ...])` [No] — `SELECT json_arrayagg(v) FROM (VALUES(2),(1)) t(v) → [2, 1]`
  - `json_objectagg([{key_expression {VALUE | ':'} value_expression}] [{NULL|ABSENT} ON NULL] [{WITH|WITHOUT} UNIQUE [KEYS]] [RETURNING ...])` [No]
  - `json_object_agg` / `jsonb_object_agg(key "any", value "any" ORDER BY ...)` — keys coerced to text and cannot be null; on duplicate keys json keeps EVERY pair, jsonb keeps only the LAST value [No]
  - `json_object_agg_strict` / `jsonb_object_agg_strict` (skip pairs with null value) [No]; `json_object_agg_unique` / `jsonb_object_agg_unique` (error on duplicate key) [No]; `json_object_agg_unique_strict` / `jsonb_object_agg_unique_strict` [No]
  - `max`, `min` — any numeric, string, date/time, or enum type, plus bytea, inet, interval, money, oid, pg_lsn, tid, xid8, and arrays/composites of sortable types [Yes]
  - `range_agg(anyrange|anymultirange) → anymultirange` (union) [No]; `range_intersect_agg(anyrange) → anyrange` / `(anymultirange) → anymultirange` [No]
  - `string_agg(value text, delimiter text) → text`, `string_agg(value bytea, delimiter bytea ORDER BY ...) → bytea` (non-null values; each value after the first is preceded by its delimiter) [Yes]
  - `sum`: smallint/integer → bigint; bigint → numeric; numeric → numeric; real → real; double precision → double precision; interval → interval; money → money [Yes]
  - `xmlagg(xml ORDER BY ...)` [No]
- Except `count`, all return NULL when no rows are selected: `sum` of no rows is NULL (not 0), `array_agg` gives NULL (not an empty array) → wrap in `coalesce`.
- Order-sensitive aggregates: `array_agg`, `json_agg`, `jsonb_agg`, `json_agg_strict`, `jsonb_agg_strict`, `json_object_agg`, `jsonb_object_agg`, `json_object_agg_strict`, `jsonb_object_agg_strict`, `json_object_agg_unique`, `jsonb_object_agg_unique`, `json_object_agg_unique_strict`, `jsonb_object_agg_unique_strict`, `string_agg`, `xmlagg`. Input order is unspecified by default; control it with ORDER BY inside the call. A sorted subquery "usually works" but can fail if the outer level has extra processing such as a join that reorders rows.
- `any`/`some` aggregates are NOT supported (only `every`) because `b1 = ANY((SELECT b2 ...))` would be ambiguous between subquery ANY and an aggregate.
- `SELECT count(*) FROM sometable` costs effort proportional to table size: needs a scan of the whole table or of an entire index that includes all rows.
- Statistical aggregates (Table 9.63; all Partial Mode Yes; N = number of rows where all inputs are non-null; null if meaningless e.g. N = 0): `corr(Y, X)`, `covar_pop`, `covar_samp`, `regr_avgx` (sum(X)/N), `regr_avgy` (sum(Y)/N), `regr_count → bigint`, `regr_intercept`, `regr_r2`, `regr_slope`, `regr_sxx` (sum(X^2) - sum(X)^2/N), `regr_sxy` (sum(X*Y) - sum(X)*sum(Y)/N), `regr_syy` (sum(Y^2) - sum(Y)^2/N), `stddev` (historical alias of `stddev_samp`), `stddev_pop`, `stddev_samp`, `variance` (alias of `var_samp`), `var_pop`, `var_samp`. The stddev/variance family returns double precision for real/double precision inputs, otherwise numeric.
- Ordered-set ("inverse distribution") aggregates (Table 9.64; all Partial Mode No; ignore nulls in aggregated input; fraction must be within 0..1 else error; null fraction → null):
  - `mode() WITHIN GROUP (ORDER BY anyelement)` — most frequent value (first one arbitrarily if tied).
  - `percentile_cont(fraction double precision) WITHIN GROUP (ORDER BY double precision | interval)` — continuous percentile, INTERPOLATES between adjacent items; array form `percentile_cont(fractions double precision[])` returns an array of the same dimensions.
  - `percentile_disc(fraction) WITHIN GROUP (ORDER BY anyelement)` — discrete: the first value whose position in the ordering equals or exceeds the fraction; array form returns anyarray.
- Hypothetical-set aggregates (Table 9.65; Partial Mode No; each mirrors the window function of the same name; result = what the window function would return for a hypothetical row built from `args` added to the sorted group; direct `args` must match number and types of `sorted_args`; NOT strict — rows with nulls are not dropped, nulls sort per ORDER BY): `rank(args) WITHIN GROUP (ORDER BY sorted_args) → bigint` (with gaps), `dense_rank(...) → bigint` (no gaps), `percent_rank(...) → double precision` ((rank - 1)/(total rows - 1), 0..1), `cume_dist(...) → double precision` ((rows preceding or peers with hypothetical row)/(total rows), 1/N..1).
- Grouping operation (Table 9.66): `GROUPING(group_by_expression(s)) → integer` — bit mask; rightmost argument = least-significant bit; bit 0 if that expression is part of the current grouping set, 1 if not. Arguments are not evaluated but must exactly match GROUP BY expressions. With `GROUP BY ROLLUP(make, model)`: detail rows → 0; per-make subtotal → 1; grand total → 3.

### Window functions  [M3]  (source: functions-window.txt)
- Must be invoked with an `OVER` clause. Any built-in or user-defined ORDINARY aggregate can also be used as a window function (NOT ordered-set or hypothetical-set aggregates); an aggregate is a window function only when OVER follows the call.
- Table 9.67 (complete):
  - `row_number() → bigint` — number of the current row within its partition, from 1.
  - `rank() → bigint` — rank with gaps = row_number of the first row in its peer group.
  - `dense_rank() → bigint` — rank without gaps; counts peer groups.
  - `percent_rank() → double precision` — (rank - 1) / (total partition rows - 1); 0..1 inclusive.
  - `cume_dist() → double precision` — (partition rows preceding or peers with current row) / (total partition rows); 1/N..1.
  - `ntile(num_buckets integer) → integer` — 1..num_buckets, dividing the partition as equally as possible.
  - `lag(value anycompatible [, offset integer [, default anycompatible]])` — value at the row `offset` rows BEFORE the current row within the partition; else `default`. offset defaults to 1, default to NULL; both evaluated with respect to the current row.
  - `lead(value [, offset [, default]])` — same, `offset` rows AFTER.
  - `first_value(value anyelement)` — value at the first row of the window FRAME.
  - `last_value(value anyelement)` — value at the last row of the window FRAME.
  - `nth_value(value anyelement, n integer)` — value at the n'th row of the frame (from 1); NULL if no such row.
- All depend on the window's ORDER BY. Rows not distinct on the ORDER BY columns are PEERS. The four ranking functions (`rank`, `dense_rank`, `percent_rank`, `cume_dist`) give the same answer for all rows of a peer group.
- Frame semantics: `first_value`, `last_value`, `nth_value` (and aggregates used as window functions) see only the WINDOW FRAME. The DEFAULT frame = rows from the start of the partition through the LAST PEER of the current row (i.e. `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`). This gives "unhelpful" results for `last_value` (it returns the current row's last peer) and sometimes `nth_value`. Redefine with a frame spec in `RANGE`, `ROWS` or `GROUPS` mode (4.2.8).
- Aggregate + ORDER BY + default frame = "running sum" behaviour. For whole-partition aggregation omit ORDER BY or use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.
- NOT implemented: the standard's `RESPECT NULLS` / `IGNORE NULLS` for lead, lag, first_value, last_value, nth_value (always RESPECT NULLS); `FROM FIRST` / `FROM LAST` for nth_value (only FROM FIRST; emulate FROM LAST by reversing ORDER BY).

### Merge support function  [M3]  (source: functions-merge-support.txt)
- `merge_action() → text` — returns `'INSERT'`, `'UPDATE'`, or `'DELETE'` for the current row. Usable ONLY in the RETURNING list of a `MERGE`; an error anywhere else.
- Example: `MERGE INTO products p USING stock s ON p.product_id = s.product_id WHEN MATCHED AND s.quantity > 0 THEN UPDATE SET in_stock = true, quantity = s.quantity WHEN MATCHED THEN UPDATE SET in_stock = false, quantity = 0 WHEN NOT MATCHED THEN INSERT (product_id, in_stock, quantity) VALUES (s.product_id, true, s.quantity) RETURNING merge_action(), p.*;`

### Subquery expressions  [M3, M4]  (source: functions-subquery.txt)
- All forms return Boolean.
- `EXISTS (subquery)` — true if at least one row. The subquery is generally executed only long enough to determine whether one row is returned (not to completion) → side effects (e.g. sequence functions) are unpredictable. Output list is irrelevant: convention `EXISTS(SELECT 1 WHERE ...)` (exception: subqueries using INTERSECT). Acts like a semi-join: at most one output row per outer row.
- `expression IN (subquery)` — subquery must return exactly one column. True if any equal row; false if none (incl. empty subquery). NULL (not false) if the left side is null, or no equal value exists and at least one right-hand row is null.
- `row_constructor IN (subquery)` — subquery must return as many columns as the row. Rows equal if all corresponding members are non-null and equal; unequal if any corresponding members are non-null and unequal; otherwise unknown.
- `expression NOT IN (subquery)` — true if only unequal rows found (incl. empty subquery); false if any equal row; NULL (not true) if left is null or no equal value and at least one right-hand null. `NOT IN` ≡ `<> ALL`.
- `expression operator ANY (subquery)` / `SOME` (synonym) — true if any comparison is true; false if none (incl. empty); NULL if no success and at least one null result. `IN` ≡ `= ANY`. Row-constructor form also available.
- `expression operator ALL (subquery)` — true if all rows yield true (INCLUDING an empty subquery); false if any false; NULL if no false and at least one NULL.
- Single-row comparison: `row_constructor operator (subquery)` — the subquery must return exactly as many columns and at most ONE row; zero rows → null.
- For IN/ANY/ALL it is "unwise to assume the subquery will be evaluated completely".

### Row and array comparisons  [M3, M4]  (source: functions-comparisons.txt)
- `expression IN (value [, ...])` = `expr = v1 OR expr = v2 OR ...`; null if left is null, or no match and some right-hand value is null.
- `expression NOT IN (value [, ...])` = `expr <> v1 AND expr <> v2 AND ...`; yields NULL — not true "as one might naively expect" — when no match and a null is present. Tip: `x NOT IN y` ≡ `NOT (x IN y)`; express conditions positively.
- `expression operator ANY (array expression)` / `SOME` — PostgreSQL extension. True if any element comparison is true; false if none (incl. zero-element array). NULL if the array is null; ordinarily NULL if the left side is null; NULL if the array contains nulls and no true result was obtained (assuming a strict operator).
- `expression operator ALL (array expression)` — true if all comparisons true (incl. zero-element array); false if any false; NULL if array is null, or it contains nulls and no false result.
- Row constructor comparison `row_constructor operator row_constructor`: same number of fields; the operator is applied per field pair (different specific operators may be chosen per pair); every selected operator must be a member of some B-tree operator class or the negator of an `=` member → only `=`, `<>`, `<`, `<=`, `>`, `>=` (or similar semantics).
  - `=` / `<>`: rows equal if all corresponding members non-null and equal; unequal if any corresponding members non-null and unequal; else null.
  - `<`, `<=`, `>`, `>=`: compared left-to-right, stopping at the first unequal or null pair; if that pair contains a null the result is null. `ROW(1,2,NULL) < ROW(1,3,0)` → true (third pair never considered).
  - `row_constructor IS [NOT] DISTINCT FROM row_constructor` — never null; null vs non-null is distinct, two nulls are not distinct.
- Composite type comparison `record operator record`: the SQL spec's NULL-returning row comparison is applied by PostgreSQL ONLY for two row constructors or a row constructor vs subquery output. In other composite comparisons two NULL fields are considered EQUAL and NULL is considered LARGER than non-NULL (needed for consistent sorting and indexing). Default behaviour equals IS [NOT] DISTINCT FROM for row constructors.
- Binary-image operators `*=`, `*<>`, `*<`, `*<=`, `*>`, `*>=` compare the internal binary representation of two rows (supports rows with elements lacking a default B-tree opclass). Two rows may differ in binary representation though `=` says they are equal. Ordering is deterministic but not meaningful. Used internally for materialized views; possibly useful for replication and B-Tree deduplication (65.1.4.3).

### Set-returning functions  [M3]  (source: functions-srf.txt)
- Series (Table 9.69): `generate_series(start, stop [, step])` for integer, bigint, numeric (step defaults to 1); `generate_series(start timestamp, stop timestamp, step interval) → setof timestamp`; `generate_series(start timestamptz, stop timestamptz, step interval [, timezone text]) → setof timestamptz` (DST adjustments per the named zone or `TimeZone`).
- Rules: positive step with start > stop → zero rows; negative step with start < stop → zero rows; any NULL input → zero rows; step = 0 is an ERROR.
- Examples: `generate_series(2,4)` → 2,3,4; `generate_series(5,1,-2)` → 5,3,1; `generate_series(4,3)` → 0 rows; `generate_series(1.1, 4, 1.3)` → 1.1, 2.4, 3.7; `SELECT current_date + s.a AS dates FROM generate_series(0,14,7) AS s(a)`; `generate_series('2008-03-01 00:00'::timestamp, '2008-03-04 12:00', '10 hours')` → 9 rows; tz-aware daily series across the 2001-10-28 America/New_York DST change shifts from 04:00+00 to 05:00+00.
- Subscripts (Table 9.70): `generate_subscripts(array anyarray, dim integer [, reverse boolean]) → setof integer` — valid subscripts of the dim'th dimension; zero rows if the dimension doesn't exist or any input is NULL. Pattern: `SELECT a, s, a[s] FROM (SELECT generate_subscripts(a, 1) AS s, a FROM arrays) foo`. 2-D unnest: cross join `generate_subscripts($1,1) g1(i), generate_subscripts($1,2) g2(j)` selecting `$1[i][j]`.
- `WITH ORDINALITY` — suffix on a FROM-clause function appends a `bigint` column starting at 1, incrementing per output row: `SELECT * FROM pg_ls_dir('.') WITH ORDINALITY AS t(ls,n)`. That example's data-directory listing shows: pg_serial, pg_twophase, postmaster.opts, pg_notify, postgresql.conf, pg_tblspc, logfile, base, postmaster.pid, pg_ident.conf, global, pg_xact, pg_snapshots, pg_multixact, PG_VERSION, pg_wal, pg_hba.conf, pg_stat_tmp, pg_subtrans.
- Combining multiple SRFs: see 7.2.1.4 (ROWS FROM).

### Session information functions  [M1, M5]  (source: functions-info.txt)
- Table 9.71:
  - `current_catalog`, `current_database() → name` (databases are "catalogs" in the SQL standard).
  - `current_query() → text` — text as submitted by the client (may contain multiple statements).
  - `current_role`, `current_user`, `user → name` — user of the current execution context (used for permission checks; changes with `SET ROLE` and inside `SECURITY DEFINER` functions = "effective user"). `session_user → name` — user who initiated the connection (changeable by superusers with `SET SESSION AUTHORIZATION`) = "real user". PostgreSQL does not distinguish current_role from current_user (users and roles are one kind of entity).
  - `system_user → text` — `auth_method:identity` presented during authentication, or NULL if not authenticated (e.g. Trust).
  - `current_schema` / `current_schema() → name` — first schema in the search path (NULL if the search path is empty); where unqualified objects are created.
  - `current_schemas(include_implicit boolean) → name[]` — effective search path in priority order (non-existent/unsearchable entries omitted); true includes implicit system schemas like `pg_catalog`.
  - `inet_client_addr()`, `inet_client_port()`, `inet_server_addr()`, `inet_server_port()` — NULL over a Unix-domain socket.
  - `pg_backend_pid() → integer` — PID of the server process attached to the session.
  - `pg_blocking_pids(integer) → integer[]` — PIDs of sessions blocking the given PID from acquiring a lock (empty array if not blocked / no such process). HARD block = holds a conflicting lock; SOFT block = is waiting for a conflicting lock and is ahead in the wait queue. A prepared transaction holding a conflicting lock is represented by PID 0. With parallel query, client-visible PIDs are reported (duplicates possible); parallel workers can block each other on relation extension locks (`extend` in `pg_locks`), in which case the result contains the blocked session's own PID. Needs exclusive access to the lock manager's shared state briefly → frequent calls can hurt performance.
  - `pg_conf_load_time() → timestamptz` — when config files were last loaded (per-session re-read time if the session was alive, else postmaster's).
  - `pg_current_logfile([text]) → text` — logging collector's current file (includes `log_directory`); NULL if the collector is disabled; without arg returns the first format found in order `stderr`, `csvlog`, `jsonlog`; reflects the `current_logfiles` file. Restricted to superusers and `pg_monitor` by default.
  - `pg_get_loaded_modules() → setof record(module_name text, version text, file_name text)` — module_name/version NULL unless the author used `PG_MODULE_MAGIC_EXT`.
  - `pg_my_temp_schema() → oid` (0 if none), `pg_is_other_temp_schema(oid) → boolean`.
  - `pg_jit_available() → boolean` — JIT extension available AND `jit` GUC is on.
  - `pg_numa_available() → boolean` — compiled with NUMA support.
  - `pg_listening_channels() → setof text`; `pg_notification_queue_usage() → double precision` (fraction 0–1 of the async notification queue in use).
  - `pg_postmaster_start_time() → timestamptz`.
  - `pg_safe_snapshot_blocking_pids(integer) → integer[]` — sessions blocking the given PID from acquiring a SAFE SNAPSHOT: a SERIALIZABLE transaction blocks a `SERIALIZABLE READ ONLY DEFERRABLE` transaction from acquiring a snapshot until the latter determines it can safely avoid predicate locks (13.2.3). Accesses the predicate lock manager's shared state.
  - `pg_trigger_depth() → integer` — current trigger nesting level (0 outside triggers).
- `current_catalog`, `current_role`, `current_schema`, `current_user`, `session_user`, `user` must be called WITHOUT parentheses (only `current_schema` optionally accepts them).

### Access privilege inquiry functions  [M1]  (source: functions-info.txt)
- Common shape: `has_xxx_privilege([user name or oid,] object text or oid, privilege text) → boolean`. User may be a name, OID (`pg_authid.oid`), or `public`; omitted → `current_user`. Privilege string: case-insensitive, may append `WITH GRANT OPTION`, may list several comma-separated (true if ANY is held). E.g. `has_table_privilege('joe', 'mytable', 'INSERT, SELECT WITH GRANT OPTION')`.
- Table 9.72 with allowed privilege types: `has_any_column_privilege` (SELECT, INSERT, UPDATE, REFERENCES; true if held on the whole table or on at least one column), `has_column_privilege` (column by name or attnum; same types), `has_database_privilege` (CREATE, CONNECT, TEMPORARY, TEMP), `has_foreign_data_wrapper_privilege` (USAGE), `has_function_privilege` (EXECUTE; name parsed like regprocedure: `'myfunc(int, text)'`), `has_language_privilege` (USAGE), `has_largeobject_privilege` (SELECT, UPDATE), `has_parameter_privilege` (SET, ALTER SYSTEM; case-insensitive name), `has_schema_privilege` (CREATE, USAGE), `has_sequence_privilege` (USAGE, SELECT, UPDATE), `has_server_privilege` (USAGE), `has_table_privilege` (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN), `has_tablespace_privilege` (CREATE), `has_type_privilege` (USAGE), `pg_has_role` (MEMBER = direct or indirect membership; USAGE = privileges available without SET ROLE; SET = can SET ROLE; `WITH ADMIN OPTION`/`WITH GRANT OPTION` tests ADMIN; `public` not allowed), `row_security_active(table) → boolean`.
- `aclitem` operators (Table 9.73): `aclitem = aclitem` (only equality exists; `'calvin=r*w/hobbes'::aclitem = 'calvin=r*w*/hobbes'::aclitem → f`), `aclitem[] @> aclitem` (array has an entry with matching grantee and grantor and at least those privileges).
- `aclitem` functions (Table 9.74): `acldefault(type "char", ownerId oid) → aclitem[]` (default privileges assumed when an ACL is null; type codes: `'c'` COLUMN, `'r'` TABLE and table-like, `'s'` SEQUENCE, `'d'` DATABASE, `'f'` FUNCTION or PROCEDURE, `'l'` LANGUAGE, `'L'` LARGE OBJECT, `'n'` SCHEMA, `'p'` PARAMETER, `'t'` TABLESPACE, `'F'` FOREIGN DATA WRAPPER, `'S'` FOREIGN SERVER, `'T'` TYPE or DOMAIN); `aclexplode(aclitem[]) → setof record(grantor oid, grantee oid, privilege_type text, is_grantable boolean)` (grantee 0 = PUBLIC; one row per privilege); `makeaclitem(grantee oid, grantor oid, privileges text, is_grantable boolean) → aclitem`.

### Schema visibility and catalog information functions  [M1, M4]  (source: functions-info.txt)
- Visibility (Table 9.75): an object is visible if its schema is in the search path and no same-named object (same name + argument types for functions/operators; name + access method for opclasses/opfamilies) appears earlier. Functions: `pg_collation_is_visible`, `pg_conversion_is_visible`, `pg_function_is_visible` (also procedures and aggregates), `pg_opclass_is_visible`, `pg_operator_is_visible`, `pg_opfamily_is_visible`, `pg_statistics_obj_is_visible`, `pg_table_is_visible` (all relation kinds: views, matviews, indexes, sequences, foreign tables), `pg_ts_config_is_visible`, `pg_ts_dict_is_visible`, `pg_ts_parser_is_visible`, `pg_ts_template_is_visible`, `pg_type_is_visible` — all take an oid. `SELECT relname FROM pg_class WHERE pg_table_is_visible(oid);` Use OID alias types: `pg_type_is_visible('myschema.widget'::regtype)`.
- Catalog info (Table 9.76):
  - `format_type(type oid, typemod integer) → text`; `pg_basetype(regtype) → regtype` (recurses through domain chains); `pg_char_to_encoding(name) → integer` (-1 if unknown); `pg_encoding_to_char(integer) → name`.
  - `pg_get_catalog_foreign_keys() → setof record(fktable regclass, fkcols text[], pktable regclass, pkcols text[], is_array boolean, is_opt boolean)` — FK relationships among system catalogs (is_array: last referencing column is an array; is_opt: may contain zeroes).
  - Decompilers ("a decompiled reconstruction, not the original text"): `pg_get_constraintdef(oid [, pretty])`, `pg_get_expr(pg_node_tree, relation oid [, pretty])` (pass 0 if no Vars), `pg_get_functiondef(oid)` (complete `CREATE OR REPLACE FUNCTION/PROCEDURE`), `pg_get_function_arguments`, `pg_get_function_identity_arguments` (omits defaults), `pg_get_function_result` (NULL for a procedure), `pg_get_indexdef(index oid [, column integer, pretty boolean])`, `pg_get_partition_constraintdef(table oid)`, `pg_get_partkeydef(table oid)`, `pg_get_ruledef(oid [, pretty])`, `pg_get_statisticsobjdef(oid)`, `pg_get_triggerdef(oid [, pretty])`, `pg_get_viewdef(view oid [, pretty])`, `pg_get_viewdef(view oid, wrap_column integer)`, `pg_get_viewdef(view text [, pretty])` (deprecated).
  - `pg_get_keywords() → setof record(word text, catcode "char", barelabel boolean, catdesc text, baredesc text)` — catcode `U` unreserved, `C` can be column name, `T` can be type or function name, `R` fully reserved.
  - `pg_get_serial_sequence(table text, column text) → text` — sequence owned by an identity or serial column (NULL if none). Table name parsed per SQL rules (lower-cased by default); column name taken literally. `SELECT currval(pg_get_serial_sequence('sometable', 'id'));`
  - `pg_get_userbyid(role oid) → name`.
  - `pg_index_column_has_property(index regclass, column integer, property text)`, `pg_index_has_property(index regclass, property text)`, `pg_indexam_has_property(am oid, property text)` → boolean (NULL if unknown/not applicable).
  - `pg_options_to_table(options_array text[]) → setof record(option_name, option_value)` — expands `pg_class.reloptions` / `pg_attribute.attoptions`.
  - `pg_settings_get_flags(guc text) → text[]`.
  - `pg_tablespace_databases(tablespace oid) → setof oid` (non-empty → the tablespace cannot be dropped); `pg_tablespace_location(tablespace oid) → text`.
  - `pg_typeof("any") → regtype` (`pg_typeof(33) → integer`); `COLLATION FOR ("any") → text` (`collation for ('foo'::text) → "default"`; error for non-collatable types).
  - `to_regclass`, `to_regcollation`, `to_regnamespace`, `to_regoper`, `to_regoperator`, `to_regproc`, `to_regprocedure`, `to_regrole`, `to_regtype`, `to_regtypemod(text) → integer` — like the reg* casts but return NULL instead of an error when not found (to_regoper/to_regproc also NULL when ambiguous). `format_type(to_regtype('varchar(32)'), to_regtypemod('varchar(32)')) → character varying(32)`.
- `pretty` flag: suppresses unnecessary parentheses and adds whitespace; the default (non-pretty) format is more likely to be interpreted the same way by future versions → do not use pretty output for dumps.
- Index column properties (Table 9.77): `asc`, `desc`, `nulls_first`, `nulls_last`, `orderable`, `distance_orderable` (ORDER BY col <-> constant), `returnable` (index-only scan can return the value), `search_array` (native `col = ANY(array)`), `search_nulls` (IS NULL / IS NOT NULL searches).
- Index properties (Table 9.78): `clusterable`, `index_scan` (plain non-bitmap scans), `bitmap_scan`, `backward_scan` (direction changeable mid-scan).
- Index AM properties (Table 9.79): `can_order`, `can_unique`, `can_multi_col`, `can_exclude`, `can_include`.
- GUC flags (Table 9.80): `EXPLAIN` (included in EXPLAIN (SETTINGS)), `NO_SHOW_ALL`, `NO_RESET`, `NO_RESET_ALL`, `NOT_IN_SAMPLE` (not in postgresql.conf by default), `RUNTIME_COMPUTED`.

### Object addressing, comments, input validity  [M1, M6]  (source: functions-info.txt)
- Table 9.81: `pg_get_acl(classid oid, objid oid, objsubid integer) → aclitem[]`; `pg_describe_object(classid, objid, objsubid) → text` (human-readable, possibly translated; handy for `pg_depend`); `pg_identify_object(...) → record(type, schema, name, identity)` (machine-readable, never translated); `pg_identify_object_as_address(...) → record(type text, object_names text[], object_args text[])` (server-independent); `pg_get_object_address(type, object_names, object_args) → record(classid, objid, objsubid)` (inverse). Undefined objects → NULLs. objsubid = column number, 0 for a whole object.
- Example ACL string: `{postgres=arwdDxtm/postgres,foo=r/postgres}`.
- Comments (Table 9.82): `col_description(table oid, column integer)`, `obj_description(object oid, catalog name)` (e.g. `obj_description(123456, 'pg_class')`), `obj_description(object oid)` (deprecated — OIDs are not unique across catalogs), `shobj_description(object oid, catalog name)` (shared objects: databases, roles, tablespaces).
- Validity (Table 9.83): `pg_input_is_valid(string text, type text) → boolean` (`pg_input_is_valid('42000000000', 'integer') → f`; `pg_input_is_valid('1234.567', 'numeric(7,4)') → f`); `pg_input_error_info(value text, type_name text) → record(message, detail, hint, sql_error_code)` (→ `value "42000000000" is out of range for type integer`, code `22003`; NULLs if valid). Both only work if the type's input function reports "soft" errors; otherwise invalid input aborts the transaction.

### Transaction ID and snapshot functions  [M5, M7]  (source: functions-info.txt)
- Main use: determine which transactions committed between two snapshots.
- Table 9.84:
  - `age(xid) → integer` — number of transactions between the given xid and the current transaction counter.
  - `mxid_age(xid) → integer` — number of multixact IDs between the given multixact ID and the current multixact counter.
  - `pg_current_xact_id() → xid8` — current transaction's ID; ASSIGNS a new one if the transaction has none yet (it hasn't performed any updates). In a subtransaction returns the top-level XID.
  - `pg_current_xact_id_if_assigned() → xid8` — NULL if none assigned (use this in possibly read-only transactions to avoid consuming an XID).
  - `pg_xact_status(xid8) → text` — `in progress`, `committed`, or `aborted`; NULL if too old (commit status discarded). Use case: learn whether a COMMIT succeeded after a disconnect. Prepared transactions report `in progress` (check `pg_prepared_xacts`).
  - `pg_current_snapshot() → pg_snapshot` — which XIDs are in progress now; only top-level XIDs (no subxids).
  - `pg_snapshot_xip(pg_snapshot) → setof xid8`, `pg_snapshot_xmax(pg_snapshot) → xid8`, `pg_snapshot_xmin(pg_snapshot) → xid8`.
  - `pg_visible_in_snapshot(xid8, pg_snapshot) → boolean` — was the XID completed before the snapshot was taken? Not correct for subtransaction IDs.
  - `pg_get_multixact_members(multixid xid) → setof record(xid xid, mode text)` — Modes: `forupd` (FOR UPDATE), `fornokeyupd` (FOR NO KEY UPDATE), `sh` (FOR SHARE), `keysh` (FOR KEY SHARE), plus multixact-specific `nokeyupd` (updates not modifying key columns) and `upd` (updates/deletes modifying key columns).
- `xid` is 32 bits and wraps around every 4 billion transactions. `xid8` is 64-bit and does not wrap during the life of an installation; castable to xid. All Table 9.84 functions use xid8 except `age`, `mxid_age`, `pg_get_multixact_members`.
- `pg_snapshot` text form: `xmin:xmax:xip_list` — e.g. `10:20:10,14,15` = xmin 10, xmax 20, xip_list 10, 14, 15. Components (Table 9.85):
  - `xmin` — lowest XID still active. All XIDs < xmin are either committed and visible, or rolled back and dead.
  - `xmax` — one past the highest COMPLETED XID. All XIDs >= xmax had not completed → invisible.
  - `xip_list` — XIDs in progress at snapshot time. An XID with xmin <= X < xmax and NOT in the list had already completed → visible or dead per its commit status. Does not include subxids.
- Deprecated pre-13 `txid_*` variants using bigint / `txid_snapshot` (Table 9.86): `txid_current()`, `txid_current_if_assigned()`, `txid_current_snapshot()`, `txid_snapshot_xip()`, `txid_snapshot_xmax()`, `txid_snapshot_xmin()`, `txid_visible_in_snapshot()`, `txid_status()`.
- Commit timestamps (Table 9.87) — require GUC `track_commit_timestamp`, only for transactions committed after enabling; data is routinely removed during vacuum: `pg_xact_commit_timestamp(xid) → timestamptz`, `pg_xact_commit_timestamp_origin(xid) → record(timestamp timestamptz, roident oid)`, `pg_last_committed_xact() → record(xid xid, timestamp timestamptz, roident oid)`.

### Control data, version, WAL summarization functions  [M7, M1, M2]  (source: functions-info.txt)
- Control data functions (Table 9.88) expose the same information as `pg_controldata` (cluster-wide, set at initdb + WAL/checkpoint state):
  - `pg_control_checkpoint()` columns (Table 9.89): `checkpoint_lsn pg_lsn`, `redo_lsn pg_lsn`, `redo_wal_file text`, `timeline_id integer`, `prev_timeline_id integer`, `full_page_writes boolean`, `next_xid text`, `next_oid oid`, `next_multixact_id xid`, `next_multi_offset xid`, `oldest_xid xid`, `oldest_xid_dbid oid`, `oldest_active_xid xid`, `oldest_multi_xid xid`, `oldest_multi_dbid oid`, `oldest_commit_ts_xid xid`, `newest_commit_ts_xid xid`, `checkpoint_time timestamptz`.
  - `pg_control_system()` (Table 9.90): `pg_control_version integer`, `catalog_version_no integer`, `system_identifier bigint`, `pg_control_last_modified timestamptz`.
  - `pg_control_init()` (Table 9.91): `max_data_alignment integer`, `database_block_size integer`, `blocks_per_segment integer`, `wal_block_size integer`, `bytes_per_wal_segment integer`, `max_identifier_length integer`, `max_index_columns integer`, `max_toast_chunk_size integer`, `large_object_chunk_size integer`, `float8_pass_by_value boolean`, `data_page_checksum_version integer`, `default_char_signedness boolean`.
  - `pg_control_recovery()` (Table 9.92): `min_recovery_end_lsn pg_lsn`, `min_recovery_end_timeline integer`, `backup_start_lsn pg_lsn`, `backup_end_lsn pg_lsn`, `end_of_backup_record_required boolean`.
- Version (Table 9.93): `version() → text` (developers should use `server_version_num` or `PQserverVersion` rather than parsing), `unicode_version() → text`, `icu_unicode_version() → text` (NULL without ICU).
- WAL summarization (Table 9.94; GUC `summarize_wal`; basis for incremental backup):
  - `pg_available_wal_summaries() → setof record(tli bigint, start_lsn pg_lsn, end_lsn pg_lsn)` — one row per summary file under `pg_wal/summaries`.
  - `pg_wal_summary_contents(tli, start_lsn, end_lsn) → setof record(relfilenode oid, reltablespace oid, reldatabase oid, relforknumber smallint, relblocknumber bigint, is_limit_block boolean)` — `is_limit_block = false`: that block was modified by at least one WAL record in the range; `true`: the fork was truncated to `relblocknumber` blocks, or created/dropped (relblocknumber 0).
  - `pg_get_wal_summarizer_state() → record(summarized_tli bigint, summarized_lsn pg_lsn, pending_lsn pg_lsn, summarizer_pid int)` — 0 and 0/0 if never run since start; pending_lsn >= summarized_lsn; summarizer_pid NULL if not running.
  - The summarizer refuses to generate summary files for WAL generated under `wal_level=minimal` (unsafe for incremental backup); the fields still advance but nothing is written until it reaches WAL generated with `replica` or higher.

### Configuration settings and server signaling functions  [M1, M7]  (source: functions-admin.txt)
- `current_setting(setting_name text [, missing_ok boolean]) → text` — like `SHOW`; errors on an unknown setting unless `missing_ok` is true (then NULL). `current_setting('datestyle') → ISO, MDY`.
- `set_config(setting_name text, new_value text, is_local boolean) → text` — like `SET`; `is_local = true` applies only for the current transaction (like SET LOCAL), false for the rest of the session. A NULL `new_value` is a request to RESET to the default.
- Signaling (Table 9.96): superuser-only by default (GRANT possible); each returns true if the signal was sent.
  - `pg_cancel_backend(pid integer) → boolean` — sends SIGINT; cancels the current query. Also allowed for a member of the target backend's role or for `pg_signal_backend`; only superusers can cancel superuser backends; `pg_signal_autovacuum_worker` may cancel autovacuum workers (which otherwise count as superuser backends).
  - `pg_terminate_backend(pid integer, timeout bigint DEFAULT 0) → boolean` — sends SIGTERM; same permission rules. timeout 0 → returns true once the signal is sent; timeout > 0 (milliseconds) waits for actual termination, returning true, or emits a WARNING and returns false on timeout.
  - `pg_reload_conf() → boolean` — sends SIGHUP to the postmaster, which forwards SIGHUP to its children. Check `pg_file_settings`, `pg_hba_file_rules`, `pg_ident_file_mappings` for errors first.
  - `pg_rotate_logfile() → boolean` — only when the built-in log collector is running.
  - `pg_log_backend_memory_contexts(pid integer) → boolean` — logs memory contexts at LOG level (never sent to the client, regardless of `client_min_messages`); works for backends and auxiliary processes except the logger. If a parent has more than 100 children, the first 100 are logged plus a summary. Output lines look like `level: 1; TopMemoryContext: 80800 total in 6 blocks; 14432 free (5 chunks); 66368 used`, ending with `Grand total: ...`. Frequent calls can produce a lot of log output.
- Find PIDs and roles in `pg_stat_activity.pid` / `usename`.

### Backup control and WAL/LSN functions  [M7]  (source: functions-admin.txt)
- Table 9.97. Cannot run during recovery, except `pg_backup_start`, `pg_backup_stop`, `pg_wal_lsn_diff`.
  - `pg_create_restore_point(name text) → pg_lsn` — named WAL marker usable as `recovery_target_name`; avoid duplicate names (recovery stops at the FIRST match). Superuser by default.
  - `pg_current_wal_lsn()` (WRITE location), `pg_current_wal_insert_lsn()` (INSERT location), `pg_current_wal_flush_lsn()` (FLUSH location) → pg_lsn. Insert = the "logical" end of WAL at any instant; write = end of what has actually been written out of the server's internal buffers (what outside tools can see; use for archiving partial files); flush = last location known written to durable storage. Read-only, no superuser needed; insert and flush are mainly for debugging.
  - `pg_backup_start(label text [, fast boolean]) → pg_lsn` — `fast = true` forces an immediate checkpoint (I/O spike). Superuser by default.
  - `pg_backup_stop([wait_for_archive boolean]) → record(lsn pg_lsn, labelfile text, spcmapfile text)` — returns the backup label file and tablespace map contents, which must be stored IN THE BACKUP and must NOT be written into the live data directory (PostgreSQL would then fail to restart after a crash). Default waits for WAL archiving when archiving is enabled (on a standby only if `archive_mode = always`); `false` returns immediately (only for tools that monitor archiving themselves, otherwise the backup may be useless). On a primary it also writes a backup history file (label, start/end WAL locations, start/end times) and switches to the next WAL file so the ending segment can be archived.
  - `pg_switch_wal() → pg_lsn` — forces a switch to a new WAL file; returns end location + 1 in the completed file; if no WAL activity since the last switch it does nothing and returns the start of the current file. Superuser by default.
  - `pg_walfile_name(lsn) → text`; `pg_walfile_name_offset(lsn) → record(file_name text, file_offset integer)` (e.g. `00000001000000000000000D`, `4039624`); `pg_split_walfile_name(file_name) → record(segment_number numeric, timeline_id bigint)`.
  - `pg_wal_lsn_diff(lsn1, lsn2) → numeric` — bytes (lsn1 - lsn2); use with `pg_stat_replication` for replication lag.
- LSN from file name + offset: `SELECT '0/0'::pg_lsn + pd.segment_number * ps.setting::int + :offset FROM pg_split_walfile_name(:'file_name') pd, pg_show_all_settings() ps WHERE ps.name = 'wal_segment_size';` — `000000010000000100C000AB` with offset 256 gives `C001/AB000100`.

### Recovery information and control functions  [M7]  (source: functions-admin.txt)
- Information (Table 9.98; usable during recovery and normal running):
  - `pg_is_in_recovery() → boolean`.
  - `pg_last_wal_receive_lsn() → pg_lsn` — last WAL received AND synced to disk by streaming replication; rises monotonically while streaming; static after recovery; NULL if streaming is disabled or not yet started.
  - `pg_last_wal_replay_lsn() → pg_lsn` — last WAL replayed; NULL if the server started without recovery.
  - `pg_last_xact_replay_timestamp() → timestamptz` — time the commit/abort WAL record of the last replayed transaction was generated ON THE PRIMARY; NULL if none.
  - `pg_get_wal_resource_managers() → setof record(rm_id integer, rm_name text, rm_builtin boolean)` — built-in vs extension custom resource managers.
- Control (Table 9.99; only during recovery):
  - `pg_is_wal_replay_paused() → boolean` — whether a pause has been REQUESTED.
  - `pg_get_wal_replay_pause_state() → text` — `not paused`, `pause requested`, or `paused`. Check this to know recovery has actually stopped.
  - `pg_promote(wait boolean DEFAULT true, wait_seconds integer DEFAULT 60) → boolean` — `wait = false` returns true right after sending SIGUSR1 to the postmaster. Superuser by default.
  - `pg_wal_replay_pause() → void` — while paused no database changes are applied; with hot standby all new queries see the same consistent snapshot and no new query conflicts arise.
  - `pg_wal_replay_resume() → void`.
- Pause/resume cannot run during a promotion; triggering a promotion while paused ends the pause. With streaming replication active a pause keeps receiving WAL and can eventually fill the disk.

### Snapshot synchronization  [M5, M7]  (source: functions-admin.txt)
- Problem: two sessions starting transactions independently may see different data, since a third transaction can commit between their two `START TRANSACTION`s.
- `pg_export_snapshot() → text` — saves the current snapshot and returns an identifier string to hand to other clients, which import it with `SET TRANSACTION SNAPSHOT`. Importable only until the exporting transaction ends. Multiple exports per transaction are useful only in READ COMMITTED (REPEATABLE READ and higher use one snapshot throughout). A transaction that exported a snapshot cannot be `PREPARE TRANSACTION`ed. Changes made by synchronized transactions stay invisible to each other as usual (synchronized only on pre-existing data).
- `pg_log_standby_snapshot() → pg_lsn` — writes a running-transactions snapshot to WAL immediately, without waiting for bgwriter or checkpointer; helps logical decoding on a standby, because logical slot creation waits until such a record is replayed.

### Replication management functions  [M7]  (source: functions-admin.txt)
- Replication-origin functions: superuser by default (GRANT possible). Slot functions: superusers and roles with REPLICATION. Many have replication-protocol equivalents (54.4).
- Table 9.101:
  - `pg_create_physical_replication_slot(slot_name name [, immediately_reserve boolean, temporary boolean]) → record(slot_name, lsn)` — immediately_reserve reserves the LSN now (else on first client connection); temporary = not stored on disk, current session only, also released on any error. = `CREATE_REPLICATION_SLOT ... PHYSICAL`. Streaming from a physical slot needs the streaming replication protocol.
  - `pg_drop_replication_slot(slot_name) → void` (physical or logical; = `DROP_REPLICATION_SLOT`).
  - `pg_create_logical_replication_slot(slot_name name, plugin name [, temporary boolean, twophase boolean, failover boolean]) → record(slot_name, lsn)` — twophase enables decoding of prepared transactions; failover enables syncing the slot to standbys so logical replication can resume after failover. = `CREATE_REPLICATION_SLOT ... LOGICAL`.
  - `pg_copy_physical_replication_slot(src, dst [, temporary])` — copy reserves WAL from the source's LSN; temporary defaults to the source's; invalidated slots cannot be copied.
  - `pg_copy_logical_replication_slot(src, dst [, temporary [, plugin]])` — starts from the source LSN; failover is NOT copied (set to false) to avoid being unable to continue after failover; invalidated slots cannot be copied.
  - `pg_logical_slot_get_changes(slot_name, upto_lsn pg_lsn, upto_nchanges integer, VARIADIC options text[]) → setof record(lsn pg_lsn, xid xid, data text)` — CONSUMES changes from where last consumed. Both limits NULL → decode to end of WAL; upto_lsn → only transactions committing before that LSN; upto_nchanges → stop once rows exceed the value (checked only after each transaction commit is decoded, so more rows may be returned). For a failover slot, waits until all physical slots in `synchronized_standby_slots` confirm WAL receipt.
  - `pg_logical_slot_peek_changes(...)` — same but does NOT consume (rows return again next call).
  - `pg_logical_slot_get_binary_changes(...)` / `pg_logical_slot_peek_binary_changes(...)` — data as bytea.
  - `pg_replication_slot_advance(slot_name, upto_lsn) → record(slot_name, end_lsn)` — never moves backwards or beyond the current insert location; the new position is persisted at the NEXT CHECKPOINT, so after a crash the slot may return to an earlier position; failover-slot wait applies.
  - Origins: `pg_replication_origin_create(node_name text) → oid` (name <= 512 bytes), `pg_replication_origin_drop(node_name)` (also deletes replay progress), `pg_replication_origin_oid(node_name) → oid` (NULL if missing), `pg_replication_origin_session_setup(node_name)` (only if no origin selected), `pg_replication_origin_session_reset()`, `pg_replication_origin_session_is_setup() → boolean`, `pg_replication_origin_session_progress(flush boolean) → pg_lsn`, `pg_replication_origin_xact_setup(origin_lsn pg_lsn, origin_timestamp timestamptz)` (requires session setup first), `pg_replication_origin_xact_reset()`, `pg_replication_origin_advance(node_name, lsn)` (careless use → inconsistently replicated data), `pg_replication_origin_progress(node_name, flush boolean) → pg_lsn`.
  - `pg_logical_emit_message(transactional boolean, prefix text, message text|bytea [, flush boolean DEFAULT false]) → pg_lsn` — generic message through WAL to logical decoding plugins; transactional = part of the current transaction, else written and decoded immediately; `flush` has no effect for transactional messages (flushed with the transaction).
  - `pg_sync_replication_slots() → void` — standby only; syncs logical failover slots from the primary; temporary synced slots cannot be used for decoding and must be dropped after promotion; meant for testing/debugging; cannot run if `sync_replication_slots` is on and the slotsync worker is running. CAUTION: if `hot_standby_feedback` is later disabled or the physical slot in `primary_slot_name` is removed, VACUUM on the primary may remove needed rows and invalidate the synced slot.

### Database object size and location functions  [M2]  (source: functions-admin.txt)
- bigint results are in bytes. A non-existent OID returns NULL, EXCEPT `pg_database_size` and `pg_tablespace_size`, which raise an error.
- Table 9.102:
  - `pg_column_size("any") → integer` — bytes used to store a value; on a table column value reflects any compression.
  - `pg_column_compression("any") → text` — compression algorithm of a variable-length value; NULL if not compressed.
  - `pg_column_toast_chunk_id("any") → oid` — chunk_id of an on-disk TOASTed value; NULL if un-TOASTed or not on disk.
  - `pg_database_size(name|oid)` — requires CONNECT on the database (granted by default) or `pg_read_all_stats`.
  - `pg_indexes_size(regclass)` — all indexes attached to the table.
  - `pg_relation_size(relation regclass [, fork text])` — one fork: `main` (default), `fsm` (free space map), `vm` (visibility map), `init` (initialization fork, if any).
  - `pg_size_bytes(text) → bigint` — units bytes, B, kB, MB, GB, TB, PB.
  - `pg_size_pretty(bigint|numeric) → text` — units are powers of 2 (1kB = 1024 bytes, 1MB = 1048576 bytes).
  - `pg_table_size(regclass)` — table excluding indexes, INCLUDING its TOAST table, FSM, and VM.
  - `pg_tablespace_size(name|oid)` — needs CREATE on the tablespace or `pg_read_all_stats`, unless it is the current database's default tablespace.
  - `pg_total_relation_size(regclass)` — everything incl. indexes and TOAST = `pg_table_size + pg_indexes_size`.
- Location (Table 9.103):
  - `pg_relation_filenode(relation regclass) → oid` — usually equals `pg_class.relfilenode`, but for certain system catalogs relfilenode is 0 and this function is required; NULL for relations without storage (views).
  - `pg_relation_filepath(relation regclass) → text` — full path relative to PGDATA.
  - `pg_filenode_relation(tablespace oid, filenode oid) → regclass` — inverse of filepath; tablespace 0 = database default; NULL if no match or for temporary relations.
- Collations (Table 9.104): `pg_collation_actual_version(oid) → text` (OS version; if different from `pg_collation.collversion`, dependent objects may need rebuilding; see ALTER COLLATION), `pg_database_collation_actual_version(oid) → text` (vs `pg_database.datcollversion`), `pg_import_system_collations(schema regnamespace) → integer` (what initdb uses; skips existing entries, never removes stale ones; superuser only).
- Statistics manipulation (Table 9.105; not during recovery). WARNING: changes are likely to be overwritten by autovacuum / VACUUM / ANALYZE — temporary.
  - `pg_restore_relation_stats(VARIADIC kwargs "any") → boolean` — name/value pairs; required `schemaname`, `relname`; supported `relpages integer`, `reltuples real`, `relallvisible integer`, `relallfrozen integer`; optional `version integer` (source server version). Minor errors → WARNING and continue; true only if all were restored. Requires MAINTAIN on the table or database ownership. Example: `SELECT pg_restore_relation_stats('schemaname', 'myschema', 'relname', 'mytable', 'relpages', 173::integer, 'reltuples', 10000::real);`
  - `pg_clear_relation_stats(schemaname text, relname text) → void` — as if newly created.
  - `pg_restore_attribute_stats(VARIADIC kwargs "any") → boolean` — required `schemaname`, `relname`, `attname` (text) or `attnum` (smallint), and `inherited`; other keys are `pg_stats` column names (e.g. `avg_width 125::integer`, `null_frac 0.5::real`); optional `version`.
  - `pg_clear_attribute_stats(schemaname, relname, attname, inherited boolean) → void`.
- Partitioning (Table 9.106): `pg_partition_tree(regclass) → setof record(relid regclass, parentrelid regclass, isleaf boolean, level integer)` (level 0 = input, 1 = children, ...; no rows if not partitioned); `pg_partition_ancestors(regclass) → setof regclass` (includes itself); `pg_partition_root(regclass) → regclass` (NULL if not a partition). Total size: `SELECT pg_size_pretty(sum(pg_relation_size(relid))) FROM pg_partition_tree('measurement');`

### Index maintenance functions  [M4]  (source: functions-admin.txt)
- Normally done by autovacuum; not during recovery; superusers and the index owner only (Table 9.107).
- `brin_summarize_new_values(index regclass) → integer` — summarizes all unsummarized page ranges; returns the number of new summaries inserted.
- `brin_summarize_range(index regclass, blockNumber bigint) → integer` — only the range covering that table block, if not already summarized.
- `brin_desummarize_range(index regclass, blockNumber bigint) → void` — removes that range's summary tuple.
- `gin_clean_pending_list(index regclass) → bigint` — moves the GIN pending list into the main structure in bulk; returns the number of pages removed; 0 for an index built with `fastupdate` off (no pending list).

### Generic file access functions  [M1, M2]  (source: functions-admin.txt)
- Only files inside the cluster directory and `log_directory` are accessible, unless superuser or `pg_read_server_files`. Relative paths for the cluster directory.
- SECURITY: EXECUTE on `pg_read_file()` and related functions lets a user read ANY file the server process can read, bypassing all in-database privilege checks (including `pg_authid` data and all table data).
- Optional-parameter signatures are separate physical functions — GRANT on each one separately (check with `\df`).
- `missing_ok` (default false): true → NULL or empty set for a missing file; other failures always error.
- Table 9.108:
  - `pg_ls_dir(dirname text [, missing_ok boolean, include_dot_dirs boolean]) → setof text` (dot dirs excluded by default; including them distinguishes an empty directory from a missing one with missing_ok). Superuser by default.
  - Directory listings returning `setof record(name text, size bigint, modification timestamptz)` for ordinary files (dot files, directories, special files excluded), superusers and `pg_monitor` by default: `pg_ls_logdir()` (log directory), `pg_ls_waldir()` (WAL directory), `pg_ls_logicalmapdir()` (`pg_logical/mappings`), `pg_ls_logicalsnapdir()` (`pg_logical/snapshots`), `pg_ls_replslotdir(slot_name text)` (`pg_replslot/slot_name`), `pg_ls_summariesdir()` (`pg_wal/summaries`), `pg_ls_archive_statusdir()` (`pg_wal/archive_status`), `pg_ls_tmpdir([tablespace oid])` (temp-file directory; default `pg_default`).
  - `pg_read_file(filename text [, offset bigint, length bigint] [, missing_ok boolean]) → text` — negative offset = relative to end; bytes interpreted in the database encoding (error if invalid). Superuser by default.
  - `pg_read_binary_file(...) → bytea` — no encoding checks; `SELECT convert_from(pg_read_binary_file('file_in_utf8.txt'), 'UTF8');`
  - `pg_stat_file(filename text [, missing_ok boolean]) → record(size bigint, access timestamptz, modification timestamptz, change timestamptz, creation timestamptz, isdir boolean)` — `change` on Unix only, `creation` on Windows only.

### Advisory lock functions  [M5]  (source: functions-admin.txt)
- Lock application-defined resources identified by one 64-bit key or two 32-bit keys; the two key spaces DO NOT overlap.
- A conflicting lock held by another session → the function waits, or (try_ variants) returns false.
- Shared locks conflict only with exclusive locks on the same resource; exclusive conflicts with both.
- Session-level locks are held until released or session end; transaction-level locks until the transaction ends and cannot be released manually.
- Session-level requests STACK: locking a resource three times needs three unlocks to release it before session end.
- Table 9.109 (each has `(key bigint)` and `(key1 integer, key2 integer)` forms):
  - `pg_advisory_lock → void` — exclusive, session, waits.
  - `pg_advisory_lock_shared → void` — shared, session, waits.
  - `pg_advisory_unlock → boolean` — release exclusive session lock; false plus an SQL WARNING if not held.
  - `pg_advisory_unlock_shared → boolean` — release shared session lock; same false/WARNING behaviour.
  - `pg_advisory_unlock_all() → void` — release all session-level advisory locks; implicitly called at session end, even on ungraceful disconnect.
  - `pg_advisory_xact_lock → void` — exclusive, transaction, waits.
  - `pg_advisory_xact_lock_shared → void` — shared, transaction, waits.
  - `pg_try_advisory_lock → boolean` — exclusive, session, no wait.
  - `pg_try_advisory_lock_shared → boolean` — shared, session, no wait.
  - `pg_try_advisory_xact_lock → boolean` — exclusive, transaction, no wait.
  - `pg_try_advisory_xact_lock_shared → boolean` — shared, transaction, no wait.
- Proper usage: see 13.3.5.

### Built-in trigger functions  [M6, M7]  (source: functions-trigger.txt)
- Table 9.110 (FK and deferred-index-constraint trigger functions also exist but are internal and undocumented here):
  - `suppress_redundant_updates_trigger() → trigger` — as a row-level BEFORE UPDATE trigger it skips updates that do not change the row. By default PostgreSQL ALWAYS performs a physical row update even if nothing changed (faster because no checking, and sometimes useful). Redundant updates cost time (especially with many indexes) and leave dead rows for VACUUM. The trigger adds a small but non-trivial per-row cost, so if most updates really change data it makes updates slower on average.
  - `tsvector_update_trigger() → trigger` — maintains a tsvector column from text columns; config named as a trigger argument: `tsvector_update_trigger(tsvcol, 'pg_catalog.swedish', title, body)`.
  - `tsvector_update_trigger_column() → trigger` — config taken from a regconfig column: `tsvector_update_trigger_column(tsvcol, tsconfigcol, title, body)`.
- Usage: `CREATE TRIGGER z_min_update BEFORE UPDATE ON tablename FOR EACH ROW EXECUTE FUNCTION suppress_redundant_updates_trigger();` — triggers fire in NAME ORDER, so give it a name sorting last (the "z" prefix) so it doesn't override other triggers that modify the row.

### Event trigger functions  [M6]  (source: functions-event-triggers.txt)
- `pg_event_trigger_ddl_commands() → setof record` — only in a `ddl_command_end` event trigger function (error elsewhere); one row per base command (a single SQL statement can produce several rows). Columns: `classid oid`, `objid oid`, `objsubid integer`, `command_tag text`, `object_type text`, `schema_name text` (unquoted; NULL if none), `object_identity text` (schema-qualified, quoted as needed), `in_extension boolean` (part of an extension script), `command pg_ddl_command` (internal format; cannot be output directly, pass to other functions).
- `pg_event_trigger_dropped_objects() → setof record` — only in a `sql_drop` event (error elsewhere). Columns: `classid`, `objid`, `objsubid`, `original boolean` (a root object of the deletion), `normal boolean` (reached via a normal dependency), `is_temporary boolean`, `object_type text`, `schema_name text`, `object_name text` (NULL unless schema+name uniquely identifies it; never schema-qualified), `object_identity text`, `address_names text[]`, `address_args text[]` (with object_type, feed `pg_get_object_address` on a remote server).
- Example: a plpgsql `RETURNS event_trigger` function loops `FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()` and does `RAISE NOTICE '% dropped object: % %.% %', tg_tag, ...`; registered with `CREATE EVENT TRIGGER ... ON sql_drop EXECUTE FUNCTION ...`.
- Table rewrite (Table 9.111; only in a `table_rewrite` event): `pg_event_trigger_table_rewrite_oid() → oid`; `pg_event_trigger_table_rewrite_reason() → integer` — bitmap: 1 = persistence changed, 2 = a column default changed, 4 = a column has a new data type, 8 = the table access method changed.

### Statistics information: MCV lists  [M4]  (source: functions-statistics.txt)
- `pg_mcv_list_items(pg_mcv_list) → setof record(index integer, values text[], nulls boolean[], frequency double precision, base_frequency double precision)` — items of a multi-column MCV list built by `CREATE STATISTICS`.
- `pg_mcv_list` values are obtainable ONLY from `pg_statistic_ext_data.stxdmcv`: `SELECT m.* FROM pg_statistic_ext JOIN pg_statistic_ext_data ON (oid = stxoid), pg_mcv_list_items(stxdmcv) m WHERE stxname = 'stts';`

## Complete inventories

### Inventory: window functions (Table 9.67, complete)
| function | returns | meaning |
|---|---|---|
| `row_number()` | bigint | row number within partition, from 1 |
| `rank()` | bigint | rank with gaps (row_number of first peer) |
| `dense_rank()` | bigint | rank without gaps (counts peer groups) |
| `percent_rank()` | double precision | (rank - 1)/(partition rows - 1), 0..1 |
| `cume_dist()` | double precision | (rows preceding or peer)/(partition rows), 1/N..1 |
| `ntile(num_buckets integer)` | integer | bucket 1..num_buckets, as equal as possible |
| `lag(value [, offset [, default]])` | anycompatible | value `offset` rows before (default offset 1, default NULL) |
| `lead(value [, offset [, default]])` | anycompatible | value `offset` rows after |
| `first_value(value)` | anyelement | first row of the FRAME |
| `last_value(value)` | anyelement | last row of the FRAME |
| `nth_value(value, n integer)` | anyelement | n'th row of the frame (from 1), NULL if none |
- Default frame: partition start through the current row's last peer. Frame modes: RANGE, ROWS, GROUPS. Not implemented: IGNORE NULLS / RESPECT NULLS option (always RESPECT), FROM FIRST/FROM LAST (only FROM FIRST).

### Inventory: aggregates with Partial Mode (Tables 9.62-9.65)
- Partial Mode Yes: any_value, array_agg (both forms), avg, bit_and, bit_or, bit_xor, bool_and, bool_or, count(*), count("any"), every, max, min, string_agg (text and bytea), sum, corr, covar_pop, covar_samp, regr_avgx, regr_avgy, regr_count, regr_intercept, regr_r2, regr_slope, regr_sxx, regr_sxy, regr_syy, stddev, stddev_pop, stddev_samp, variance, var_pop, var_samp.
- Partial Mode No: json_agg, jsonb_agg, json_agg_strict, jsonb_agg_strict, json_arrayagg, json_objectagg, json_object_agg, jsonb_object_agg, json_object_agg_strict, jsonb_object_agg_strict, json_object_agg_unique, jsonb_object_agg_unique, json_object_agg_unique_strict, jsonb_object_agg_unique_strict, range_agg, range_intersect_agg, xmlagg, mode, percentile_cont (scalar and array), percentile_disc (scalar and array), rank/dense_rank/percent_rank/cume_dist (hypothetical-set).
- Grouping operation: `GROUPING(exprs)`.
- `sum` result types: smallint→bigint, integer→bigint, bigint→numeric, numeric→numeric, real→real, double precision→double precision, interval→interval, money→money. `avg`: integer types/numeric→numeric, real/double→double precision, interval→interval.

### Inventory: subquery and array/row comparison constructs (9.24, 9.25)
| construct | empty RHS | NULL behaviour |
|---|---|---|
| `EXISTS (subquery)` | false | never null |
| `x IN (subquery)` / `x IN (list)` | false | null if x null, or no match and any RHS null |
| `x NOT IN (subquery/list)` | true | null if x null, or no match and any RHS null |
| `x op ANY/SOME (subquery or array)` | false | null if no true and any null result; null array → null |
| `x op ALL (subquery or array)` | true | null if no false and any null result; null array → null |
| `row op (subquery)` | null (zero rows) | subquery must return at most one row |
| `row = row` / `row <> row` | n/a | null unless decidable from non-null pairs |
| `row < row` etc. | n/a | left-to-right; null if first unequal-or-null pair has a null |
| `row IS [NOT] DISTINCT FROM row` | n/a | never null |
| composite `record op record` | n/a | NULL fields equal, NULL > non-NULL |
| `*=`, `*<>`, `*<`, `*<=`, `*>`, `*>=` | n/a | binary-image comparison |

### Inventory: JSON operators
- json and jsonb: `-> int`, `-> text`, `->> int`, `->> text`, `#> text[]`, `#>> text[]`.
- jsonb only: `@>`, `<@`, `?`, `?|`, `?&`, `||`, `- text`, `- text[]`, `- integer`, `#- text[]`, `@? jsonpath`, `@@ jsonpath`.

### Inventory: JSON functions
- Creation: to_json, to_jsonb, array_to_json, json_array, row_to_json, json_build_array, jsonb_build_array, json_build_object, jsonb_build_object, json_object (SQL/JSON form), json_object(text[]), jsonb_object(text[]), json_object(keys, values), jsonb_object(keys, values), json(), json_scalar, json_serialize.
- Testing: `IS [NOT] JSON [VALUE | SCALAR | ARRAY | OBJECT] [WITH | WITHOUT UNIQUE [KEYS]]`.
- Processing: json[b]_array_elements, json[b]_array_elements_text, json[b]_array_length, json[b]_each, json[b]_each_text, json[b]_extract_path, json[b]_extract_path_text, json[b]_object_keys, json[b]_populate_record, jsonb_populate_record_valid, json[b]_populate_recordset, json[b]_to_record, json[b]_to_recordset, jsonb_set, jsonb_set_lax, jsonb_insert, json[b]_strip_nulls, jsonb_path_exists, jsonb_path_match, jsonb_path_query, jsonb_path_query_array, jsonb_path_query_first, the five `_tz` variants, jsonb_pretty, json[b]_typeof.
- SQL/JSON query functions: JSON_EXISTS, JSON_QUERY, JSON_VALUE, JSON_TABLE.
- Aggregates: json_agg, jsonb_agg, json_agg_strict, jsonb_agg_strict, json_arrayagg, json_objectagg, json[b]_object_agg[_strict|_unique|_unique_strict].
- Text search: to_tsvector(json|jsonb), json_to_tsvector, jsonb_to_tsvector, ts_headline(json|jsonb).

### Inventory: jsonpath operators, methods and filter elements
- Arithmetic: `+` `-` `*` `/` `%` (binary, single values), unary `+` `-` (iterate).
- Methods: `.type()`, `.size()`, `.boolean()`, `.string()`, `.double()`, `.ceiling()`, `.floor()`, `.abs()`, `.bigint()`, `.decimal([p [, s]])`, `.integer()`, `.number()`, `.datetime()`, `.datetime(template)`, `.date()`, `.time([p])`, `.time_tz([p])`, `.timestamp([p])`, `.timestamp_tz([p])`, `.keyvalue()`.
- Accessors: `$`, `.key`, `."quoted key"`, `[n]`, `[*]`, `.**`, `@` (inside filters), `$var` (from vars/PASSING).
- Filter elements: `==`, `!=`, `<>`, `<`, `<=`, `>`, `>=`, `true`, `false`, `null`, `&&`, `||`, `!`, `is unknown`, `like_regex ... [flag ...]` (flags i, m, s, q), `starts with`, `exists(...)`.
- Modes: `lax` (default), `strict`.
- Errors suppressed by `@?`, `@@` and `silent => true`: missing object field or array element, unexpected JSON item type, datetime errors, numeric errors.

### Inventory: array operators and functions
- Operators: `@>`, `<@`, `&&`, `||` (array||array, elem||array, array||elem), comparison operators.
- Functions: array_append, array_cat, array_dims, array_fill, array_length, array_lower, array_ndims, array_position, array_positions, array_prepend, array_remove, array_replace, array_reverse, array_sample, array_shuffle, array_sort, array_to_string, array_upper, cardinality, trim_array, unnest(anyarray), unnest(anyarray, anyarray [, ...]). Related: string_to_array, string_to_table, array_agg, generate_subscripts, array_to_json, array_to_tsvector.

### Inventory: range/multirange
- Range operators: `@>` (range, element), `<@` (range, element), `&&`, `<<`, `>>`, `&<`, `&>`, `-|-`, `+`, `*`, `-`.
- Multirange operators: the same set across every mr/range/element combination; `+`, `*`, `-` between multiranges.
- Functions: lower, upper, isempty, lower_inc, upper_inc, lower_inf, upper_inf, range_merge (range pair or multirange), multirange(anyrange), unnest(anymultirange). Aggregates: range_agg, range_intersect_agg.

### Inventory: string, binary, bit
- SQL-syntax string: `||`, btrim, IS [NOT] [form] NORMALIZED, bit_length, char_length/character_length, lower, lpad, ltrim, normalize, octet_length, overlay, position, rpad, rtrim, substring (3 forms + obsolete), trim (2 forms), unicode_assigned, upper.
- Other string: `^@`, ascii, chr, concat, concat_ws, format, initcap, casefold, left, length, md5, parse_ident, pg_client_encoding, quote_ident, quote_literal (2), quote_nullable (2), regexp_count, regexp_instr, regexp_like, regexp_match, regexp_matches, regexp_replace (2), regexp_split_to_array, regexp_split_to_table, regexp_substr, repeat, replace, reverse, right, split_part, starts_with, string_to_array, string_to_table, strpos, substr, to_ascii (3), to_bin, to_hex, to_oct, translate, unistr.
- Pattern operators: LIKE, NOT LIKE, ILIKE, NOT ILIKE, `~~`, `~~*`, `!~~`, `!~~*`, SIMILAR TO, NOT SIMILAR TO, `~`, `~*`, `!~`, `!~*`.
- bytea: `||`, bit_length, btrim, ltrim, octet_length, overlay, position, rtrim, substring, trim, bit_count, crc32, crc32c, get_bit, get_byte, length (2), md5, reverse, set_bit, set_byte, sha224, sha256, sha384, sha512, substr, convert, convert_from, convert_to, encode, decode (formats base64, escape, hex).
- bit: `||`, `&`, `|`, `#`, `~`, `<<`, `>>`, bit_count, bit_length, length, octet_length, overlay, position, substring, get_bit, set_bit.

### Inventory: regex embedded-option / flag letters (Table 9.24)
`b` BRE · `c` case-sensitive · `e` ERE · `i` case-insensitive · `m` = `n` · `n` newline-sensitive · `p` partial newline-sensitive · `q` literal · `s` non-newline-sensitive (default) · `t` tight (default) · `w` inverse partial newline-sensitive · `x` expanded · plus `g` (global; regexp_matches/regexp_replace only). Directors: `***:` (ARE), `***=` (literal).

### Inventory: date/time
- EXTRACT/date_part fields: century, day, decade, dow, doy, epoch, hour, isodow, isoyear, julian, microseconds, millennium, milliseconds, minute, month, quarter, second, timezone, timezone_hour, timezone_minute, week, year.
- date_trunc fields: microseconds, milliseconds, second, minute, hour, day, week, month, quarter, year, decade, century, millennium.
- Functions: age (2), clock_timestamp, current_date, current_time[(p)], current_timestamp[(p)], date_add, date_bin, date_part (2), date_subtract, date_trunc (3), extract (2), isfinite (3), justify_days, justify_hours, justify_interval, localtime[(p)], localtimestamp[(p)], make_date, make_interval, make_time, make_timestamp, make_timestamptz, now, statement_timestamp, timeofday, transaction_timestamp, to_timestamp(double precision), timezone (4 forms), pg_sleep, pg_sleep_for, pg_sleep_until; OVERLAPS; AT TIME ZONE; AT LOCAL.
- Time sources: transaction start (now, transaction_timestamp, CURRENT_*, LOCAL*), statement start (statement_timestamp), wall clock (clock_timestamp, timeofday).

### Inventory: to_char template patterns
- Date/time: HH, HH12, HH24, MI, SS, MS, US, FF1-FF6, SSSS, SSSSS, AM/am/PM/pm, A.M./a.m./P.M./p.m., Y,YYY, YYYY, YYY, YY, Y, IYYY, IYY, IY, I, BC/bc/AD/ad, B.C./b.c./A.D./a.d., MONTH, Month, month, MON, Mon, mon, MM, DAY, Day, day, DY, Dy, dy, DDD, IDDD, DD, D, ID, W, WW, IW, CC, J, Q, RM, rm, TZ, tz, TZH, TZM, OF. Modifiers: FM, TH, th, FX, TM, SP (not implemented).
- Numeric: 9, 0, `.`, `,`, PR, S, L, D, G, MI, PL, SG, RN/rn, TH/th, V, EEEE. Modifiers: FM, TH, th.

### Inventory: UUID functions
gen_random_uuid() (v4), uuidv4() (v4), uuidv7([shift interval]) (v7, 48-bit ms timestamp, 1970 to about year 10889), uuid_extract_timestamp(uuid) (v1 and v7 only), uuid_extract_version(uuid) (RFC 9562 variants).

### Inventory: sequence functions
| function | privilege | effect |
|---|---|---|
| `nextval(regclass)` | USAGE or UPDATE | atomic advance; never rolled back |
| `setval(regclass, bigint)` | UPDATE | last_value = v, is_called = true (next is v+1); currval = v |
| `setval(regclass, bigint, false)` | UPDATE | next nextval returns v; currval unchanged |
| `currval(regclass)` | USAGE or SELECT | session-local last nextval of that sequence |
| `lastval()` | USAGE or SELECT | session-local last nextval of any sequence |

### Inventory: transaction ID, snapshot and commit-timestamp functions
| function | returns |
|---|---|
| `age(xid)` | integer |
| `mxid_age(xid)` | integer |
| `pg_current_xact_id()` | xid8 (assigns if needed) |
| `pg_current_xact_id_if_assigned()` | xid8 or NULL |
| `pg_xact_status(xid8)` | text: in progress / committed / aborted / NULL |
| `pg_current_snapshot()` | pg_snapshot |
| `pg_snapshot_xip(pg_snapshot)` | setof xid8 |
| `pg_snapshot_xmax(pg_snapshot)` | xid8 |
| `pg_snapshot_xmin(pg_snapshot)` | xid8 |
| `pg_visible_in_snapshot(xid8, pg_snapshot)` | boolean |
| `pg_get_multixact_members(xid)` | setof (xid, mode) |
| `pg_xact_commit_timestamp(xid)` | timestamptz |
| `pg_xact_commit_timestamp_origin(xid)` | (timestamp, roident) |
| `pg_last_committed_xact()` | (xid, timestamp, roident) |
| deprecated `txid_current`, `txid_current_if_assigned`, `txid_current_snapshot`, `txid_snapshot_xip`, `txid_snapshot_xmax`, `txid_snapshot_xmin`, `txid_visible_in_snapshot`, `txid_status` | bigint / txid_snapshot equivalents |
- Multixact member modes: forupd, fornokeyupd, sh, keysh, nokeyupd, upd.

### Inventory: session information functions
current_catalog, current_database(), current_query(), current_role, current_schema[()], current_schemas(bool), current_user, inet_client_addr(), inet_client_port(), inet_server_addr(), inet_server_port(), pg_backend_pid(), pg_blocking_pids(int), pg_conf_load_time(), pg_current_logfile([text]), pg_get_loaded_modules(), pg_my_temp_schema(), pg_is_other_temp_schema(oid), pg_jit_available(), pg_numa_available(), pg_listening_channels(), pg_notification_queue_usage(), pg_postmaster_start_time(), pg_safe_snapshot_blocking_pids(int), pg_trigger_depth(), session_user, system_user, user.

### Inventory: privilege inquiry functions and allowed privilege types
| function | privileges |
|---|---|
| has_any_column_privilege | SELECT, INSERT, UPDATE, REFERENCES |
| has_column_privilege | SELECT, INSERT, UPDATE, REFERENCES |
| has_database_privilege | CREATE, CONNECT, TEMPORARY, TEMP |
| has_foreign_data_wrapper_privilege | USAGE |
| has_function_privilege | EXECUTE |
| has_language_privilege | USAGE |
| has_largeobject_privilege | SELECT, UPDATE |
| has_parameter_privilege | SET, ALTER SYSTEM |
| has_schema_privilege | CREATE, USAGE |
| has_sequence_privilege | USAGE, SELECT, UPDATE |
| has_server_privilege | USAGE |
| has_table_privilege | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN |
| has_tablespace_privilege | CREATE |
| has_type_privilege | USAGE |
| pg_has_role | MEMBER, USAGE, SET (+ WITH ADMIN/GRANT OPTION) |
| row_security_active | n/a |
- aclitem: `=`, `aclitem[] @> aclitem`, acldefault, aclexplode, makeaclitem. acldefault type codes: c r s d f l L n p t F S T.

### Inventory: visibility, catalog-info, addressing, comment, validity functions
- Visibility: pg_collation_is_visible, pg_conversion_is_visible, pg_function_is_visible, pg_opclass_is_visible, pg_operator_is_visible, pg_opfamily_is_visible, pg_statistics_obj_is_visible, pg_table_is_visible, pg_ts_config_is_visible, pg_ts_dict_is_visible, pg_ts_parser_is_visible, pg_ts_template_is_visible, pg_type_is_visible.
- Catalog info: format_type, pg_basetype, pg_char_to_encoding, pg_encoding_to_char, pg_get_catalog_foreign_keys, pg_get_constraintdef, pg_get_expr, pg_get_functiondef, pg_get_function_arguments, pg_get_function_identity_arguments, pg_get_function_result, pg_get_indexdef, pg_get_keywords, pg_get_partition_constraintdef, pg_get_partkeydef, pg_get_ruledef, pg_get_serial_sequence, pg_get_statisticsobjdef, pg_get_triggerdef, pg_get_userbyid, pg_get_viewdef (3), pg_index_column_has_property, pg_index_has_property, pg_indexam_has_property, pg_options_to_table, pg_settings_get_flags, pg_tablespace_databases, pg_tablespace_location, pg_typeof, COLLATION FOR, to_regclass, to_regcollation, to_regnamespace, to_regoper, to_regoperator, to_regproc, to_regprocedure, to_regrole, to_regtype, to_regtypemod.
- Index column properties: asc, desc, nulls_first, nulls_last, orderable, distance_orderable, returnable, search_array, search_nulls. Index properties: clusterable, index_scan, bitmap_scan, backward_scan. AM properties: can_order, can_unique, can_multi_col, can_exclude, can_include. GUC flags: EXPLAIN, NO_SHOW_ALL, NO_RESET, NO_RESET_ALL, NOT_IN_SAMPLE, RUNTIME_COMPUTED.
- Addressing: pg_get_acl, pg_describe_object, pg_identify_object, pg_identify_object_as_address, pg_get_object_address. Comments: col_description, obj_description (2), shobj_description. Validity: pg_input_is_valid, pg_input_error_info.
- Control data: pg_control_checkpoint, pg_control_system, pg_control_init, pg_control_recovery. Version: version, unicode_version, icu_unicode_version. WAL summaries: pg_available_wal_summaries, pg_wal_summary_contents, pg_get_wal_summarizer_state.

### Inventory: WAL / LSN / backup / recovery functions
| function | purpose | during recovery? |
|---|---|---|
| pg_create_restore_point(name) | named recovery target | no |
| pg_current_wal_lsn() | write location | no |
| pg_current_wal_insert_lsn() | insert location | no |
| pg_current_wal_flush_lsn() | flush location | no |
| pg_backup_start(label [, fast]) | begin base backup | yes |
| pg_backup_stop([wait_for_archive]) | end backup; label + tablespace map | yes |
| pg_switch_wal() | force segment switch | no |
| pg_walfile_name(lsn) | segment file name | no |
| pg_walfile_name_offset(lsn) | file name + byte offset | no |
| pg_split_walfile_name(file) | segment_number, timeline_id | no |
| pg_wal_lsn_diff(a, b) | bytes between LSNs | yes |
| pg_is_in_recovery() | in recovery? | both |
| pg_last_wal_receive_lsn() | last streamed + synced | both |
| pg_last_wal_replay_lsn() | last replayed | both |
| pg_last_xact_replay_timestamp() | primary's commit time of last replayed xact | both |
| pg_get_wal_resource_managers() | loaded rmgrs | both |
| pg_is_wal_replay_paused() | pause requested? | recovery only |
| pg_get_wal_replay_pause_state() | not paused / pause requested / paused | recovery only |
| pg_promote([wait, wait_seconds]) | promote standby | recovery only |
| pg_wal_replay_pause() / pg_wal_replay_resume() | pause / resume replay | recovery only |
| pg_export_snapshot() | share a snapshot | n/a |
| pg_log_standby_snapshot() | write running-xacts record | n/a |

### Inventory: replication management functions
pg_create_physical_replication_slot, pg_drop_replication_slot, pg_create_logical_replication_slot, pg_copy_physical_replication_slot, pg_copy_logical_replication_slot, pg_logical_slot_get_changes, pg_logical_slot_peek_changes, pg_logical_slot_get_binary_changes, pg_logical_slot_peek_binary_changes, pg_replication_slot_advance, pg_replication_origin_create, pg_replication_origin_drop, pg_replication_origin_oid, pg_replication_origin_session_setup, pg_replication_origin_session_reset, pg_replication_origin_session_is_setup, pg_replication_origin_session_progress, pg_replication_origin_xact_setup, pg_replication_origin_xact_reset, pg_replication_origin_advance, pg_replication_origin_progress, pg_logical_emit_message (text and bytea), pg_sync_replication_slots.

### Inventory: size, location and object management functions
| function | measures |
|---|---|
| pg_column_size(any) | bytes of one stored value (after compression) |
| pg_column_compression(any) | compression method or NULL |
| pg_column_toast_chunk_id(any) | TOAST chunk_id or NULL |
| pg_relation_size(rel [, fork]) | one fork: main / fsm / vm / init |
| pg_table_size(rel) | heap + TOAST + FSM + VM (no indexes) |
| pg_indexes_size(rel) | all indexes of the table |
| pg_total_relation_size(rel) | pg_table_size + pg_indexes_size |
| pg_database_size(name/oid) | whole database (errors if missing) |
| pg_tablespace_size(name/oid) | whole tablespace (errors if missing) |
| pg_size_pretty(bigint/numeric) | human units, powers of 2 |
| pg_size_bytes(text) | parse human units |
| pg_relation_filenode(rel) | filenode (correct even for mapped catalogs) |
| pg_relation_filepath(rel) | path relative to PGDATA |
| pg_filenode_relation(tbs, filenode) | inverse mapping |
- Also: pg_collation_actual_version, pg_database_collation_actual_version, pg_import_system_collations; pg_restore_relation_stats (relpages, reltuples, relallvisible, relallfrozen, version), pg_clear_relation_stats, pg_restore_attribute_stats, pg_clear_attribute_stats; pg_partition_tree, pg_partition_ancestors, pg_partition_root; brin_summarize_new_values, brin_summarize_range, brin_desummarize_range, gin_clean_pending_list.
- File access: pg_ls_dir, pg_ls_logdir, pg_ls_waldir, pg_ls_logicalmapdir, pg_ls_logicalsnapdir, pg_ls_replslotdir, pg_ls_summariesdir, pg_ls_archive_statusdir, pg_ls_tmpdir, pg_read_file, pg_read_binary_file, pg_stat_file.
- Settings/signaling: current_setting, set_config, pg_cancel_backend, pg_log_backend_memory_contexts, pg_reload_conf, pg_rotate_logfile, pg_terminate_backend.

### Inventory: advisory lock functions
| | session, wait | session, try | xact, wait | xact, try | release |
|---|---|---|---|---|---|
| exclusive | pg_advisory_lock | pg_try_advisory_lock | pg_advisory_xact_lock | pg_try_advisory_xact_lock | pg_advisory_unlock |
| shared | pg_advisory_lock_shared | pg_try_advisory_lock_shared | pg_advisory_xact_lock_shared | pg_try_advisory_xact_lock_shared | pg_advisory_unlock_shared |
- Plus `pg_advisory_unlock_all()`. Every function has `(bigint)` and `(integer, integer)` forms. Transaction-level locks have no unlock function.

### Inventory: trigger, event trigger and statistics functions
- Trigger: suppress_redundant_updates_trigger, tsvector_update_trigger, tsvector_update_trigger_column.
- Event trigger: pg_event_trigger_ddl_commands (ddl_command_end), pg_event_trigger_dropped_objects (sql_drop), pg_event_trigger_table_rewrite_oid and pg_event_trigger_table_rewrite_reason (table_rewrite; reason bits 1 persistence, 2 default, 4 type, 8 access method).
- Statistics: pg_mcv_list_items.

### Inventory: other sections
- Math functions: abs, cbrt, ceil, ceiling, degrees, div, erf, erfc, exp, factorial, floor, gamma, gcd, lcm, lgamma, ln, log, log10, log(b, x), min_scale, mod, pi, power, radians, round (2), scale, sign, sqrt, trim_scale, trunc (2), width_bucket (2); random (4 forms), random_normal, setseed; acos/acosd, asin/asind, atan/atand, atan2/atan2d, cos/cosd, cot/cotd, sin/sind, tan/tand; sinh, cosh, tanh, asinh, acosh, atanh.
- Comparison helpers: num_nonnulls, num_nulls. Conditionals: CASE, COALESCE, NULLIF, GREATEST, LEAST. Enum: enum_first, enum_last, enum_range (2). Merge: merge_action. SRFs: generate_series (5 forms), generate_subscripts (2), WITH ORDINALITY.
- Network: operators `<<`, `<<=`, `>>`, `>>=`, `&&`, `~`, `&`, `|`, `+`, `-`; functions abbrev (2), broadcast, family, host, hostmask, inet_merge, inet_same_family, masklen, netmask, network, set_masklen (2), text; MAC: trunc (2), macaddr8_set7bit.
- Text search: operators `@@` (3), `||`, `&&`, `||` (tsquery), `!!`, `<->`, `@>`, `<@`; functions array_to_tsvector, get_current_ts_config, length, numnode, plainto_tsquery, phraseto_tsquery, websearch_to_tsquery, querytree, setweight (2), strip, to_tsquery, to_tsvector (3), json_to_tsvector, jsonb_to_tsvector, ts_delete (2), ts_filter, ts_headline (3), ts_rank, ts_rank_cd, ts_rewrite (2), tsquery_phrase (2), tsvector_to_array, unnest(tsvector); debug ts_debug, ts_lexize, ts_parse (2), ts_token_type (2), ts_stat.
- XML: xmltext, xmlcomment, xmlconcat, xmlelement, xmlforest, xmlpi, xmlroot, xmlagg, IS [NOT] DOCUMENT, XMLEXISTS, xml_is_well_formed, xml_is_well_formed_document, xml_is_well_formed_content, xpath, xpath_exists, XMLTABLE, table_to_xml, query_to_xml, cursor_to_xml, table_to_xmlschema, query_to_xmlschema, cursor_to_xmlschema, table_to_xml_and_xmlschema, query_to_xml_and_xmlschema, schema_to_xml, schema_to_xmlschema, schema_to_xml_and_xmlschema, database_to_xml, database_to_xmlschema, database_to_xml_and_xmlschema.
- Geometry: see the operator and function lists in the Geometric notes (Tables 9.36-9.38).

## Lesson ideas

### Visualizers
- **Snapshot number line** [M5]: draw XIDs on a line with `xmin`, `xmax` and the `xip_list` dots from `pg_current_snapshot()`. Shade "< xmin → completed", "xip → in progress (invisible)", "xmin..xmax not in xip → completed", ">= xmax → invisible". Step two sessions: session A `pg_current_xact_id()`, session B takes a snapshot, A commits, then show `pg_visible_in_snapshot()` flipping only in a NEW snapshot.
- **Window frame animator** [M3]: a sorted partition with peer groups coloured; slide the current row and highlight the default frame (start through last peer), then toggle `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, `GROUPS`, `RANGE` and show `last_value`, `nth_value`, `sum` change live. Show `rank`/`dense_rank`/`row_number`/`percent_rank`/`cume_dist` side by side on ties.
- **jsonpath stepper** [M3]: tree view of the GPS document; animate each accessor producing a sequence of items; a lax/strict toggle shows auto-unwrapping, the `.**` double count, and filters unwrapping arrays.
- **LSN pipeline** [M7]: three markers on a WAL tape: insert, write, flush (`pg_current_wal_insert_lsn`, `_lsn`, `_flush_lsn`); `pg_switch_wal` jumps to the next 16MB segment; `pg_walfile_name_offset` decodes a marker into a file name and offset.
- **Relation size stack** [M2]: stacked bar of main / fsm / vm / init forks, TOAST, indexes, mapping to `pg_relation_size(rel, fork)`, `pg_table_size`, `pg_indexes_size`, `pg_total_relation_size`; clicking a fork shows `pg_relation_filepath`.
- **Advisory lock counter** [M5]: per-key counters for session-level locks (stacking 3 locks needs 3 unlocks) vs transaction-level locks that vanish at COMMIT; a two-session view of shared vs exclusive conflicts and `pg_try_*` returning false.
- **Three-valued logic truth board** [M3]: an interactive AND/OR/NOT table plus NOT IN with a NULL in the list returning NULL.
- **UUIDv7 anatomy** [M2]: color the timestamp prefix of `uuidv7()` and show `uuid_extract_timestamp` / `uuid_extract_version`; compare insertion order with `gen_random_uuid()`.
- **Regex greediness game** [M3]: the `(.*)(\d+)(.*)` vs `(.*?)...` vs `{1,1}` examples, showing whole-RE greediness decided first, then subexpression split.
- **ROLLUP + GROUPING bitmask** [M3]: rows light up with bit masks 0/1/3.

### Playground SQL (PGlite, PG18, single session)
```sql
-- snapshots and xids
SELECT pg_current_xact_id_if_assigned();            -- NULL in a read-only txn
BEGIN; SELECT pg_current_xact_id(); SELECT pg_current_snapshot(); COMMIT;
SELECT pg_xact_status(pg_current_xact_id());
SELECT pg_snapshot_xmin(s), pg_snapshot_xmax(s), array(SELECT pg_snapshot_xip(s)) FROM pg_current_snapshot() s;

-- window functions and frames
SELECT v, row_number() OVER w, rank() OVER w, dense_rank() OVER w, percent_rank() OVER w, cume_dist() OVER w,
       last_value(v) OVER w AS lv_default,
       last_value(v) OVER (ORDER BY v ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS lv_full,
       sum(v) OVER w AS running
FROM (VALUES (1),(2),(2),(3)) t(v) WINDOW w AS (ORDER BY v);

-- ordered-set, hypothetical-set, FILTER
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY g), percentile_disc(0.5) WITHIN GROUP (ORDER BY g),
       mode() WITHIN GROUP (ORDER BY g % 3), rank(5) WITHIN GROUP (ORDER BY g),
       count(*) FILTER (WHERE g > 5) FROM generate_series(1,10) g;
SELECT sum(x), coalesce(sum(x),0), array_agg(x) FROM (SELECT 1 x WHERE false) s;   -- NULL, 0, NULL

-- NULL traps
SELECT 1 NOT IN (2, NULL), 1 IN (1, NULL), ROW(1,NULL) IS NULL, ROW(1,NULL) IS NOT NULL,
       ROW(1,2,NULL) < ROW(1,3,0), GREATEST(1, NULL, 3), NULLIF(1, 2.2), pg_typeof(NULLIF(1, 2.2));

-- jsonb + jsonpath
SELECT '{"a":[1,2,3,4,5]}'::jsonb @? '$.a[*] ? (@ > 2)', '{"a":[1,2,3,4,5]}'::jsonb @@ '$.a[*] > 2';
SELECT jsonb_path_query('{"x":[{"HR":1},{"HR":2}]}', 'lax $.**.HR');      -- duplicates
SELECT jsonb_path_query('{"x":[{"HR":1},{"HR":2}]}', 'strict $.**.HR');
SELECT JSON_VALUE(jsonb '[1,2]', 'strict $[*]' DEFAULT 9 ON ERROR), JSON_QUERY(jsonb '[1,[2,3]]', '$[*]' WITH CONDITIONAL WRAPPER);
SELECT * FROM JSON_TABLE('{"a":[{"k":1,"t":["x","y"]},{"k":2,"t":["z"]}]}'::jsonb, '$.a[*]'
  COLUMNS (id FOR ORDINALITY, k int, NESTED PATH '$.t[*]' COLUMNS (t text PATH '$')));
SELECT '{"a": "b"}'::jsonb || '42'::jsonb, '[1,2]'::jsonb || jsonb_build_array('[3,4]'::jsonb), jsonb_set_lax('{"a":1}', '{a}', NULL, true, 'delete_key');

-- arrays and ranges
SELECT array_sort(ARRAY[3,NULL,1]), array_sort(ARRAY[3,NULL,1], true), array_reverse(ARRAY[[1,2],[3,4]]),
       array_length('{}'::int[], 1), cardinality('{}'::int[]), ARRAY[1] @> ARRAY[1,1];
SELECT int4range(1,3)::int4multirange + int4range(5,7)::int4multirange;   -- works
SELECT int4range(1,3) + int4range(5,7);                                    -- error: disjoint

-- sequences have gaps
CREATE SEQUENCE s; BEGIN; SELECT nextval('s'); ROLLBACK; SELECT nextval('s');   -- 2
SELECT setval('s', 42, false), nextval('s');                                    -- 42, 42

-- sizes, forks, files
CREATE TABLE t AS SELECT g, repeat('x', 3000) AS big FROM generate_series(1,1000) g; VACUUM t;
SELECT pg_relation_size('t'), pg_relation_size('t','fsm'), pg_relation_size('t','vm'), pg_table_size('t'),
       pg_total_relation_size('t'), pg_size_pretty(pg_total_relation_size('t')), pg_relation_filepath('t');
SELECT pg_column_size(big), pg_column_compression(big) FROM t LIMIT 1;

-- advisory lock stacking
SELECT pg_advisory_lock(42), pg_advisory_lock(42);
SELECT objid, mode, granted FROM pg_locks WHERE locktype = 'advisory';
SELECT pg_advisory_unlock(42), pg_advisory_unlock(42), pg_advisory_unlock(42);   -- t, t, f + WARNING
BEGIN; SELECT pg_advisory_xact_lock(7); COMMIT;                                     -- released at commit

-- WAL / LSN
SELECT pg_current_wal_insert_lsn(), pg_current_wal_lsn(), pg_current_wal_flush_lsn(),
       pg_walfile_name(pg_current_wal_lsn()), pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0');
SELECT * FROM pg_control_checkpoint(); SELECT * FROM pg_control_init();

-- UUIDs, input validity, catalog helpers
SELECT uuidv7(), uuid_extract_version(uuidv7()), uuid_extract_timestamp(uuidv7()), uuidv7(interval '-1 day');
SELECT pg_input_is_valid('42000000000', 'integer'), * FROM pg_input_error_info('42000000000', 'integer');
SELECT format('INSERT INTO %I VALUES (%L)', 'Foo bar', E'O\'Reilly');
SELECT pg_index_column_has_property('t_pkey'::regclass, 1, 'returnable');  -- after adding a PK

-- event trigger / redundant updates
CREATE TRIGGER z_min_update BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION suppress_redundant_updates_trigger();
UPDATE t SET g = g WHERE g = 1;   -- UPDATE 0

-- extended statistics MCV
CREATE STATISTICS stts (mcv) ON g, big FROM t; ANALYZE t;
SELECT m.* FROM pg_statistic_ext JOIN pg_statistic_ext_data ON (oid = stxoid), pg_mcv_list_items(stxdmcv) m WHERE stxname = 'stts' LIMIT 5;
```
- Some admin functions (pg_backup_start, replication slots, pg_read_file, pg_ls_waldir, pg_terminate_backend) need superuser or real server processes and may not run in PGlite; show them as read-only reference output or simulate.

### Pitfalls the docs warn about (with the documented fix)
- `x = NULL` is never true → use `IS NULL` (or, for legacy apps only, `transform_null_equals`).
- Row `IS NULL` / `IS NOT NULL` are not inverses → use `row IS [NOT] DISTINCT FROM NULL` to test only the whole row.
- `NOT IN` returns NULL when a NULL is present → express the condition positively / use NOT EXISTS.
- `sum()` / `array_agg()` over zero rows return NULL → wrap in `coalesce`.
- Order-sensitive aggregates have unspecified order; a sorted subquery can be reordered by an outer join → put `ORDER BY` inside the aggregate call.
- `last_value` with the default frame returns the current row's last peer → add `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.
- `regexp_matches` without `g` / without a sub-select drops non-matching rows → use `regexp_match` or a scalar sub-select.
- Hostile regex/SIMILAR TO patterns can take arbitrary time and memory → use `statement_timeout`, prefer LIKE.
- `TIMESTAMP 'now'` in a DEFAULT freezes creation time → use `now()` / `CURRENT_TIMESTAMP`.
- `+ interval '1 day'` ≠ `+ interval '24 hours'` across DST → choose deliberately; `date_add(..., zone)` for explicit zones.
- `to_timestamp('12.3','SS.MS')` is 300 ms → write `12.003` for 3 ms.
- `IYYY-MM-DD` in to_char gives surprising results near year start → don't mix ISO-week and Gregorian fields.
- `EXTRACT(week)` near year boundaries belongs to the ISO year → pair `week` with `isoyear`.
- `date_part` returns double precision (precision loss) → use `extract`.
- Lax jsonpath `.**` double-counts → use `.**` only in strict mode.
- `@@` with non-predicate path returns NULL; `@?` with a predicate is always true → match operator to path kind.
- `_tz` jsonpath functions are STABLE (not indexable); the non-tz ones error on tz-dependent comparisons.
- JSON_TABLE / JSON_VALUE ON ERROR does not catch parse errors of the context item's implicit cast.
- Range `+`/`-` fail on disjoint results → cast to multiranges.
- Geometric `=` compares AREA → use `~=` for sameness.
- Sequences have gaps (aborts, crashes, ON CONFLICT) → never rely on gapless sequences; commit `nextval` before using it externally; `setval` is not rolled back.
- `pg_get_serial_sequence` lowercases the table argument but not the column → quote mixed-case table names.
- `obj_description(oid)` alone may return the wrong comment → pass the catalog name.
- Pretty-printed decompiled definitions may not reload identically in future versions → don't use pretty output for dumps.
- `pg_backup_stop` label/tablespace-map content must go in the backup, never in the live data directory (restart failure after crash).
- `pg_backup_stop(false)` may yield a useless backup unless your tool monitors archiving.
- Duplicate restore point names → recovery stops at the first one.
- `pg_wal_replay_pause()` only requests a pause → check `pg_get_wal_replay_pause_state()`; a long pause with streaming fills the disk.
- `pg_replication_slot_advance` position persists only at the next checkpoint → may move back after a crash.
- Synced slots can be invalidated if `hot_standby_feedback` is turned off or `primary_slot_name`'s slot is dropped.
- Granting EXECUTE on `pg_read_file` etc. exposes every file the server can read (incl. `pg_authid`) → grant very carefully, and on each overload separately.
- Statistics set by `pg_restore_*_stats` are overwritten by VACUUM/ANALYZE → treat as temporary.
- `pg_blocking_pids` / `pg_safe_snapshot_blocking_pids` take shared lock-manager state → don't poll them frequently.
- Holding locks while `pg_sleep` blocks others → release locks before sleeping.
- `suppress_redundant_updates_trigger` adds per-row cost → only when many updates are no-ops; name it to fire last ("z_" prefix).
- `count(*)` scans the whole table or a full index → no shortcut.
- A constant `1/0` inside an unreachable CASE arm can still fail at plan time.
- `quote_literal(NULL)` returns NULL → use `quote_nullable` / `%L`.
