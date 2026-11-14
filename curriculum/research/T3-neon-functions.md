# T3 — Neon: JSON, string, math, date, aggregate and window functions

Source: neon.com/postgresql tutorial pages (rendered text in `scratchpad/ext/neon/`). Secondary source; the PG18 docs
(slices A-O) remain the source of truth. Every Neon page opens with an identical "works the same on any Postgres
deployment ... Lakebase Postgres ... Databricks and Neon" marketing paragraph; it is ignored below.

Display convention to know about: Neon's sample outputs print SQL NULL as the word `null` (psql `\pset null null`
style). That makes SQL NULL and JSON `null` look identical in their outputs (e.g. `phones -> 3` gives SQL NULL,
`jsonb_build_array(10, null)` gives JSON null). Lessons should show the difference explicitly (see JSON pitfalls).

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 58 | aggregate-functions.txt | Overview of AVG/COUNT/MAX/MIN/SUM on dvdrental film: ROUND(AVG) 19.98, COUNT(*) 1000, drama 62, max/min via subquery, SUM by rating. |
| 59 | aggregate-functions__array_agg.txt | ARRAY_AGG(expr [ORDER BY ...]) actors per film; unordered by default, ORDER BY first_name ASC, last_name DESC. |
| 60 | aggregate-functions__avg-function.txt | AVG ignores NULL (10,NULL,30 gives 20), DISTINCT, ::numeric(10,2) formatting, GROUP BY/HAVING on payment; empty set gives NULL. |
| 61 | aggregate-functions__bool_and.txt | BOOL_AND ignores NULLs; teams/projects sample; GROUP BY and HAVING BOOL_AND(active) = true. |
| 62 | aggregate-functions__bool_or.txt | BOOL_OR ignores NULLs; teams/members sample; Team C (false, NULL) gives f. |
| 63 | aggregate-functions__count-function.txt | COUNT(*) vs COUNT(col) vs COUNT(DISTINCT); full-scan explanation tied to MVCC; GROUP BY / HAVING > 40. |
| 64 | aggregate-functions__max-function.txt | MAX in SELECT, subquery for rows-with-max, GROUP BY customer, HAVING > 8.99. |
| 65 | aggregate-functions__min-function.txt | MIN on any comparable type; DISTINCT has no effect; per-category min/max length. |
| 66 | aggregate-functions__string_agg-function.txt | STRING_AGG(expr, sep [ORDER BY]) actor lists and per-country email lists; text only, no trailing separator. |
| 67 | aggregate-functions__sum-function.txt | SUM ignores NULL, empty set gives NULL, COALESCE to 0, DISTINCT, top-5 customers, SUM of intervals unnormalized. |
| 81 | date-functions.txt | Index of date functions in 6 sections (current time, extract, convert, intervals, AT TIME ZONE, utilities). |
| 82 | date-functions__age.txt | AGE(ts, ts) and AGE(ts); 5 years 6 mons 7 days; longest rentals. |
| 83 | date-functions__at-time-zone.txt | AT TIME ZONE with UTC, abbreviations, named zones, numeric offset; output reveals type flip and POSIX sign. |
| 84 | date-functions__clock_timestamp.txt | clock_timestamp changes within a statement; time_it() PL/pgSQL timing helper. |
| 85 | date-functions__current_date.txt | CURRENT_DATE in WHERE, naive age by /365, DEFAULT CURRENT_DATE on delivery table. |
| 86 | date-functions__current_time.txt | CURRENT_TIME[(precision)] returns timetz; DEFAULT on a TIME column (log table). |
| 87 | date-functions__current_timestamp.txt | CURRENT_TIMESTAMP = transaction start = NOW(); TRANSACTION_TIMESTAMP synonym; note table default. |
| 88 | date-functions__date_bin.txt | DATE_BIN(stride, source, origin) PG14+; origin shifts bins; equals DATE_TRUNC for whole units; 30-minute event buckets. |
| 89 | date-functions__date_part.txt | DATE_PART fields (century, decade, quarter, week, millennium, dow, doy...); returns double precision. |
| 90 | date-functions__date_trunc.txt | DATE_TRUNC fields and optional time_zone; rentals per month/week/staff-year. |
| 91 | date-functions__extract.txt | EXTRACT field table for timestamp vs interval; many literal examples incl. epoch, doy 366, interval decade/century. |
| 92 | date-functions__isfinite.txt | ISFINITE on date/timestamp/interval with 'infinity' (claims intervals cannot be infinite: outdated). |
| 93 | date-functions__justify_days.txt | 30-day chunks become months; 55 days 30 minutes gives 1 mon 25 days 00:30:00. |
| 94 | date-functions__justify_hours.txt | 24-hour chunks become days; days untouched. |
| 95 | date-functions__justify_interval.txt | Both plus sign normalization: '-2 days 5 hours' gives -1 days -19:00:00. |
| 96 | date-functions__localtime.txt | LOCALTIME[(p)] time without zone at transaction start, default precision 6. |
| 97 | date-functions__localtimestamp.txt | LOCALTIMESTAMP[(p)] timestamp without zone at transaction start. |
| 98 | date-functions__make_date.txt | MAKE_DATE(y,m,d), leap day, generate_series calendar. |
| 99 | date-functions__make_interval.txt | MAKE_INTERVAL with named args, zero default, from table columns. |
| 100 | date-functions__make_time.txt | MAKE_TIME(h,m,s), out-of-range error, string args. |
| 101 | date-functions__now.txt | NOW() timestamptz, TimeZone effect, pg_timezone_names, interval arithmetic, frozen within a transaction, TIMEOFDAY contrast. |
| 102 | date-functions__pg_sleep.txt | pg_sleep(seconds) incl. fractions; NOW() vs CLOCK_TIMESTAMP() around a sleep. |
| 103 | date-functions__statement_timestamp.txt | statement_timestamp changes per statement inside a transaction, constant within a statement. |
| 104 | date-functions__timeofday.txt | TIMEOFDAY() returns text like clock_timestamp; cast to timestamp and to_char. |
| 105 | date-functions__to_date.txt | TO_DATE(text, fmt) with pattern table; invalid date 2017/02/30 errors. |
| 106 | date-functions__to_timestamp.txt | TO_TIMESTAMP patterns, FX strict spacing, out-of-range errors, MS digit semantics, 2-digit year rounding. |
| 107 | functions.txt | Hub page linking the 5 function families (aggregate/window, string, date, math, JSON). No technical content. |
| 137 | json-functions.txt | Index: 8 sections (create, search via jsonpath, query, modify, arrays, objects, aggregate, utility); lists jsonb_path_match (no page of its own). |
| 138 | json-functions__json-extract.txt | `->` / `->>` on arrays (0-based, negative from end, out of range gives NULL) and objects (missing key gives NULL); employees.phones and requests.data samples. |
| 139 | json-functions__json-path.txt | JSON path intro: `$`, `.key`, `.*`, `[n]`, `[*]`, `@`, filters `? (...)`; lax (default) vs strict mode with error 2203A. Lists non-PG slice/filter syntax (see discrepancies). |
| 140 | json-functions__jsonb_agg.txt | jsonb_agg over jsonb_build_object, with GROUP BY; LEFT JOIN gives `[null]` for empty group; jsonb_agg_strict gives `[]`. |
| 141 | json-functions__jsonb_array_elements.txt | Expand top-level array to jsonb rows; nested arrays stay one element; DISTINCT over skills. Non-array input errors; NULL gives empty set. |
| 142 | json-functions__jsonb_array_elements_text.txt | Same but text output; numbers come out as text, need a cast. |
| 143 | json-functions__jsonb_array_length.txt | Top-level length only (`[1,2,3,[4,5],6]` gives 5); empty gives 0; non-array errors; NULL gives NULL; pets count example. |
| 144 | json-functions__jsonb_build_array.txt | Variadic array builder, each arg via to_jsonb; `[10, null, "Hi", true]`. Uses dvdrental film table. |
| 145 | json-functions__jsonb_build_object.txt | Alternating key/value builder; odd arg count error + HINT text. |
| 146 | json-functions__jsonb_each.txt | Object to (key text, value jsonb) rows; filter keys in WHERE; lateral use with links.attributes. |
| 147 | json-functions__jsonb_each_text.txt | Same with text values. |
| 148 | json-functions__jsonb_extract_path.txt | Variadic text path (not jsonpath), array index as '0' string; documents.employee.contacts sample. |
| 149 | json-functions__jsonb_extract_path_text.txt | Text-returning variant of the above. |
| 150 | json-functions__jsonb_insert.txt | Insert before/after (insert_after default false) into arrays/objects/nested; existing key error "cannot replace existing key"; UPDATE with jsonb_insert. |
| 151 | json-functions__jsonb_object.txt | Object from text[] (1-D alternating, 2-D pairs, or keys[]+values[]); all values become strings. |
| 152 | json-functions__jsonb_object_agg.txt | Aggregate key/value into object; NULL values kept; jsonb_object_agg_strict drops them; jsonb_pretty for display. |
| 153 | json-functions__jsonb_object_keys.txt | Set of top-level keys; DISTINCT across rows; join back `info->key` for dynamic access. |
| 154 | json-functions__jsonb_path_exists.txt | Boolean existence test of a jsonpath; used in SELECT and WHERE. |
| 155 | json-functions__jsonb_path_query.txt | Set-returning jsonpath query; example silently drops rows with no match (page wrongly says "returns NULL"). |
| 156 | json-functions__jsonb_path_query_array.txt | All matches wrapped as one jsonb array; no match gives `[]`; NULL arg gives NULL. |
| 157 | json-functions__jsonb_path_query_first.txt | First match or SQL NULL; one output row per input row. |
| 158 | json-functions__jsonb_populate_record.txt | `null::type` as the target template; composite type and table row type examples. |
| 159 | json-functions__jsonb_populate_recordset.txt | Array of objects to SETOF type; address_type example; json_agg round trip. |
| 160 | json-functions__jsonb_pretty.txt | Indented text output; recipes sample table. |
| 161 | json-functions__jsonb_set.txt | Replace at path; create_missing default true; out-of-range index appends; nested object/array updates; UPDATE example. |
| 162 | json-functions__jsonb_strip_nulls.txt | Recursively removes object fields with null values, keeps nulls inside arrays. Page text overstates (claims extras object removed). |
| 163 | json-functions__jsonb_to_record.txt | Object to record with AS column-definition list; fewer columns allowed; nested array to composite[] (`pets pet[]`). |
| 164 | json-functions__jsonb_typeof.txt | Returns object/array/string/number/null (page omits boolean). |
| 165 | json-functions__jsonb-operators.txt | Full operator table (`-> ->> @> <@ ? ?| ?& || - #- @? @@`) plus `#>`/`#>>`; 4-product catalog sample with nested attributes and tags. |
| 166 | json-functions__row_to_json.txt | Composite to json (not jsonb); `row('John',20)` gives f1/f2 keys; subquery/CTE alias pattern; optional pretty boolean. |
| 167 | json-functions__to_jsonb.txt | Scalars, bool, NULL, arrays to jsonb; jsonb_typeof to verify. |
| 168 | math-functions.txt | Summary table of 26 math functions with one example each. |
| 169 | math-functions__abs.txt | ABS and the `@` prefix operator. |
| 170 | math-functions__cbrt.txt | CBRT double precision, negative input, numeric string, cube_volumes table with NULL. |
| 171 | math-functions__ceil.txt | CEIL(200.25) 201; CEIL(SUM(amount)) per customer. |
| 172 | math-functions__degrees.txt | DEGREES(1), DEGREES(PI()); angles table with ROUND(...::numeric, 0). |
| 173 | math-functions__div.txt | DIV integer quotient, 30-minute length bins, age via EXTRACT(YEAR FROM AGE()). Misstates `/` behaviour. |
| 174 | math-functions__exp.txt | EXP(1), EXP(0), numeric string, '10X' error text. |
| 175 | math-functions__factorial.txt | factorial(5) 120; negative-input error text. |
| 176 | math-functions__floor.txt | FLOOR(150.75) 150; FLOOR(SUM(amount)). |
| 177 | math-functions__gcd.txt | gcd() PG13+, Euclid explanation, nested gcd, (buggy) recursive CTE, PL/pgSQL gcd, CREATE AGGREGATE gcd_agg. |
| 178 | math-functions__lcm.txt | lcm() PG13+, nested lcm, recursive CTE, CREATE AGGREGATE lcm_agg (144). |
| 179 | math-functions__ln.txt | LN(10), LN(EXP(1)) = 1, numeric strings, '10x' error. |
| 180 | math-functions__log.txt | LOG(n) base 10, LOG(b, n) numeric with 16 decimals, string coercion error. |
| 181 | math-functions__min_scale.txt | min_scale (PG13+): 1.2300 gives 2, 10 gives 0. |
| 182 | math-functions__mod.txt | MOD sign follows dividend; decimals; division by zero. |
| 183 | math-functions__pi-function.txt | PI(); circles table area with ROUND(::NUMERIC, 2). |
| 184 | math-functions__power.txt | POWER with ints, decimals, negative and fractional exponents; compound-interest investments table. |
| 185 | math-functions__radians.txt | RADIANS(180); angles table. |
| 186 | math-functions__random.txt | random() in [0,1), random ints, ORDER BY random() LIMIT 1, shuffle, setseed. |
| 187 | math-functions__round.txt | ROUND(x[,n]); no round(double precision, int), cast to numeric or wrapper function; AVG per customer. |
| 188 | math-functions__scale.txt | SCALE(); product_prices grouped by scale (1:2, 2:1, 3:2, 4:3, 5:2). |
| 189 | math-functions__sign.txt | SIGN incl. NULL; sales trend up/down/unchanged with LAG and a CTE refactor. |
| 190 | math-functions__sqrt.txt | SQRT(25); distance from origin over coordinates table. |
| 191 | math-functions__trim_scale.txt | TRIM_SCALE(123.45000); UPDATE products SET price = TRIM_SCALE(price). |
| 192 | math-functions__trunc.txt | TRUNC(x[,n]) incl. negative n (150.45, -2 gives 100); avg rental rate per category. |
| 193 | math-functions__width_bucket.txt | WIDTH_BUCKET semantics (0 and count+1 overflow buckets), film length histogram and ASCII bars. |
| 257 | string-functions.txt | Summary table of 25 string functions with examples (LTRIM('00123') example is wrong). |
| 258 | string-functions__ascii.txt | ASCII of first char; Unicode code point for UTF8 ('Ω'). |
| 259 | string-functions__chr.txt | CHR(65), CHR(97), CHR(937) 'Ω'. |
| 260 | string-functions__concat_ws.txt | CONCAT_WS skips NULL strings, NULL separator gives NULL. |
| 261 | string-functions__concat-function.txt | `||` vs CONCAT NULL handling; contacts table with NULL phones. |
| 262 | string-functions__format.txt | FORMAT specifier %[position][flags][width]type; s/I/L; width/flags/position examples. |
| 263 | string-functions__initcap.txt | INITCAP word rules; blog_posts title UPDATE. |
| 264 | string-functions__left.txt | LEFT incl. negative n; initials GROUP BY. |
| 265 | string-functions__length-function.txt | LENGTH chars; CHAR_LENGTH synonyms; NULL. |
| 266 | string-functions__lower.txt | LOWER locale-based; case-insensitive WHERE. |
| 267 | string-functions__lpad.txt | LPAD default space fill, truncation, zero padding, LPAD bar chart of payments. |
| 268 | string-functions__ltrim.txt | LTRIM chars/default space; articles title clean-up. |
| 269 | string-functions__md5.txt | MD5 returns 32-hex TEXT. |
| 270 | string-functions__position.txt | POSITION(sub IN s): 1-based, case-sensitive, 0 if absent, first match only. |
| 271 | string-functions__regexp_matches.txt | REGEXP_MATCHES set-returning text[]; 'g' flag hashtags; UNNEST; Cat/Dog film filter. |
| 272 | string-functions__regexp_replace.txt | Backreference name swap, [[:alpha:]]/[[:digit:]] removal with 'g', collapse spaces. |
| 273 | string-functions__repeat.txt | REPEAT; n<1 gives ''; ratings bar chart. |
| 274 | string-functions__replace.txt | REPLACE all occurrences; UPDATE posts url http to https. |
| 275 | string-functions__reverse.txt | REVERSE; palindromes on words table. |
| 276 | string-functions__right.txt | RIGHT incl. negative n; last names ending in 'son'. |
| 277 | string-functions__rpad.txt | RPAD padding/truncation, dotted leaders, RPAD(title, 10, '') truncation trick. |
| 278 | string-functions__rtrim.txt | RTRIM chars/default space; tweets clean-up. |
| 279 | string-functions__split_part.txt | SPLIT_PART 1-based, out of range gives ''; year/month from payment_date text. |
| 280 | string-functions__substring.txt | SUBSTRING positional, FROM/FOR, POSIX regex capture, SQL-regex with escape. |
| 281 | string-functions__to_char.txt | TO_CHAR numeric and datetime pattern tables; timestamp/currency/int examples (outputs were images). |
| 282 | string-functions__to_number.txt | TO_NUMBER with G/D/S/L patterns; dropped fraction; overflow error text. |
| 283 | string-functions__translate.txt | TRANSLATE per-character mapping/deletion; substitution cipher demo. |
| 284 | string-functions__trim-function.txt | TRIM LEADING/TRAILING/BOTH; todo table clean-up. |
| 285 | string-functions__upper.txt | UPPER locale-based; case-insensitive WHERE. |
| 419 | window-function.txt | Window function guide: aggregate to GROUP BY to OVER progression, syntax, WINDOW clause, 11-function list, ranking/value/offset examples on products. |
| 420 | window-function__cume_dist-function.txt | CUME_DIST range (0,1], ties equal; sales_stats over 2018 and by year (outputs were images). |
| 421 | window-function__dense_rank-function.txt | DENSE_RANK gap-free; dense_ranks demo table; top product per group via CTE. |
| 422 | window-function__first_value-function.txt | FIRST_VALUE whole set and per group (with full RANGE frame). |
| 423 | window-function__lag-function.txt | LAG(expr, offset, default); sales table year-over-year, per group (outputs given). |
| 424 | window-function__last_value-function.txt | LAST_VALUE always shown with RANGE UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING. |
| 425 | window-function__lead-function.txt | LEAD over a GROUP BY CTE; two-CTE variance; per group. |
| 426 | window-function__nth_value-function.txt | NTH_VALUE(expr, n) second most expensive, whole set and per group, full frame. |
| 427 | window-function__ntile-function.txt | NTILE(buckets) sizing rule (bigger buckets first); sales_stats 2019 and per year. |
| 428 | window-function__percent_rank-function.txt | PERCENT_RANK on sales_stats (states a contradictory range). |
| 429 | window-function__rank-function.txt | RANK with gaps; ranks demo table; per group by price DESC. |
| 430 | window-function__row_number.txt | ROW_NUMBER, DISTINCT trap and CTE fix, pagination, nth-highest price. |

## Teaching material by topic

### JSON/JSONB: the mental model and the extraction operators  [M2, M3]  (source: json-functions.txt, json-functions__json-extract.txt, json-functions__jsonb-operators.txt, json-functions__jsonb_extract_path*.txt)
- Pedagogical angle: Neon teaches JSON as an 8-step progression: create, search (jsonpath), query (operators), modify,
  arrays, objects, aggregate, utility. Each function page has the same shape: syntax, NULL/error behaviour in one
  sentence ("non-array errors; NULL gives empty set"), a literal example, then a small table example. That
  "what happens on the wrong input" sentence is worth copying into every lesson card.
- The single most important distinction, repeated on nearly every page: `->` returns **jsonb** (output shows quotes:
  `"Software Engineer"`), `->>` returns **text** (no quotes). The visual cue of the quotes is how the tutorial makes it
  click. Same pairing for `#>` / `#>>`, `jsonb_extract_path` / `jsonb_extract_path_text`, `jsonb_each` / `jsonb_each_text`,
  `jsonb_array_elements` / `jsonb_array_elements_text`.
- Array access: 0-based, negative indexes count from the end (`-1` is last), out-of-range gives SQL NULL.
  ```sql
  CREATE TABLE employees(id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, phones JSONB NOT NULL);
  INSERT INTO employees (name, phones) VALUES
    ('John Doe',   '["(408) 555-1111", "(408) 555-2222", "(408) 555-3333"]'),
    ('Jane Smith', '["(408) 666-1111", "(408) 666-2222", "(408) 666-3333"]');
  SELECT name, phones -> 0  AS j, phones ->> 0 AS t FROM employees WHERE name = 'John Doe';
  -- j = "(408) 555-1111" (jsonb), t = (408) 555-1111 (text)
  SELECT phones ->> -1 FROM employees WHERE name = 'Jane Smith';   -- (408) 666-3333
  SELECT phones -> 3  FROM employees WHERE name = 'Jane Smith';    -- NULL (only 3 elements)
  ```
- Object access: `data -> 'current_position'` / `data ->> 'current_position'`; missing key gives NULL (no error).
- Path operators: `data #> '{attributes}'`, `data #> '{attributes, color}'` (jsonb), `data #>> '{attributes, color}'` (text).
  The path is a text[] literal; array indexes go in as strings.
- Function equivalents with a variadic path (explicitly "not a JSON path"):
  `jsonb_extract_path(data, 'employee', 'contacts', '0', 'value')` gives `"john.doe@example.com"`;
  `jsonb_extract_path_text(...)` gives `john.doe@example.com`. Signature: `jsonb_extract_path(target jsonb, VARIADIC path_elems text[])`.
  Teaching note: same result as `data #> '{employee,contacts,0,value}'`.
- Pitfall: `->` chained to a string comparison: `WHERE data -> 'category' = 'Electronics'` compares jsonb to an unknown
  literal (cast to jsonb, fails as invalid JSON); use `->>` for text compares or containment `@>`.
- Pitfall: `->>` returns text, so numeric compares need a cast: `(data ->> 'price')::numeric > 999`. Neon sidesteps
  this by using jsonpath (`@?` / `@@`) for numeric filters, which is a good teaching contrast.

### JSONB operator catalogue (containment, existence, concat, delete)  [M2, M3, M4]  (source: json-functions__jsonb-operators.txt)
- Neon's table (verbatim semantics):

  | Op | Signature | Meaning |
  |---|---|---|
  | `->` | `jsonb -> 'key'` | value as jsonb |
  | `->>` | `jsonb ->> 'key'` | value as text |
  | `#>` / `#>>` | `jsonb #> text[]` | value at path as jsonb / text |
  | `@>` | `jsonb @> jsonb → boolean` | left contains right |
  | `<@` | `jsonb <@ jsonb → boolean` | left is contained in right |
  | `?` | `jsonb ? text → boolean` | string is a top-level key or a top-level array element |
  | `?\|` | `jsonb ?\| text[] → boolean` | any of the strings exist |
  | `?&` | `jsonb ?& text[] → boolean` | all of the strings exist |
  | `\|\|` | `jsonb \|\| jsonb → jsonb` | concatenate |
  | `-` | `jsonb - text` | delete key, or matching string elements of an array |
  | `-` | `jsonb - text[]` | delete all matching keys / elements |
  | `-` | `jsonb - integer` | delete array element by index (negative from end) |
  | `#-` | `jsonb #- text[]` | delete field/element at path |
  | `@?` | `jsonb @? jsonpath → boolean` | path returns any item |
  | `@@` | `jsonb @@ jsonpath → boolean` | result of a jsonpath predicate |
- Worked examples on the 4-row product catalog (schema below):
  ```sql
  SELECT id, data ->> 'name' FROM products WHERE data @> '{"category": "Electronics"}';   -- ids 1,2
  SELECT data ->> 'name' FROM products WHERE '{"price": 999.99}'::jsonb <@ data;           -- iPhone 15 Pro
  SELECT '{"name": "iPad"}'::jsonb || '{"price": 799}'::jsonb;                            -- {"name": "iPad", "price": 799}
  SELECT data ->> 'name' FROM products WHERE data ? 'price';                               -- all 4
  SELECT data ->> 'name' FROM products WHERE data -> 'tags' ? 'Apple';                     -- iPhone, Leather Case
  SELECT data ->> 'name' FROM products WHERE data -> 'attributes' ?| array['storage','size'];  -- iPhone, Galaxy Watch
  SELECT data ->> 'name' FROM products WHERE data -> 'attributes' ?& array['color','storage']; -- iPhone only
  SELECT '{"name": "John Doe", "age": 22}'::jsonb - 'name';                                -- {"age": 22}
  SELECT '["PostgreSQL", "API", "Web Dev"]'::jsonb - 'API';                                -- ["PostgreSQL", "Web Dev"]
  SELECT '{"name": "John Doe", "age": 22, "email": "john.doe@example.com"}'::jsonb - ARRAY['age','email']; -- {"name": "John Doe"}
  SELECT data ->> 'name' FROM products WHERE data @? '$.price ? (@ > 999)';                -- iPhone 15 Pro
  SELECT data ->> 'name' FROM products WHERE data @@ '$.price > 999';                      -- iPhone 15 Pro
  ```
- Teaching angle for `@?` vs `@@`: same answer, different shape. `@?` takes a path with a filter and asks "any items?";
  `@@` takes a predicate expression and asks "is it true?". Show both side by side.
- Teaching angle for `?`: it only looks at the TOP level. `data ? 'color'` is false even though attributes.color exists;
  you must first navigate (`data -> 'attributes' ? 'color'`). Also `?` matches array string elements (tags example).
- Index link (M4, not in the Neon page; from PG docs): `@>`, `?`, `?|`, `?&`, `@?`, `@@` are the operators the default
  `jsonb_ops` GIN opclass accelerates; `->>` equality needs an expression B-tree index. This page gives the perfect
  dataset to demo `EXPLAIN` before/after `CREATE INDEX ... USING gin (data)` (needs `SET enable_seqscan = off` at 4 rows).
- Pitfall: `||` is a shallow merge: right-side top-level keys overwrite; nested objects are replaced, not merged.
- Pitfall: `-` with text on an array removes string elements only; to remove the 2nd element use `- 1` (integer).

### JSON path (SQL/JSON path language)  [M3]  (source: json-functions__json-path.txt, jsonb_path_query*.txt, jsonb_path_exists.txt)
- Angle: "JSON path is to JSON what XPath is to XML." Build-up on one document: `$.name` then `$.*` then `$.pets[0].name`
  then `$.pets[*].name` then filter `$.pets[*] ? (@.species == "Cat")`, explaining each token (`$` root, `.key`, `[n]`,
  `[*]` wildcard, `@` current item inside a filter, `?` applies the filter).
  ```sql
  CREATE TABLE person (id SERIAL PRIMARY KEY, info JSONB);
  INSERT INTO person (info) VALUES
   ('{"name": "John", "age": 30, "city": "New York", "pets": [{"name": "Max", "species": "Dog"}, {"name": "Whiskers", "species": "Cat"}]}');
  SELECT jsonb_path_query(info, '$.name') FROM person;            -- "John"
  SELECT jsonb_path_query(info, '$.*') FROM person;               -- 4 rows: 30, "New York", "John", [pets array]
  SELECT jsonb_path_query(info, '$.pets[*].name') FROM person;    -- "Max", "Whiskers" (2 rows)
  SELECT jsonb_path_query(info, '$.pets[*] ? (@.species == "Cat")') FROM person;  -- {"name": "Whiskers", "species": "Cat"}
  ```
  Note string literals inside jsonpath use double quotes (`"Cat"`), inside a single-quoted SQL literal.
- Lax vs strict (the key concept): default is `lax`; a missing key yields an empty result. Prefix `strict` and the same
  path errors:
  ```sql
  SELECT jsonb_path_query(info, '$.email') FROM person;           -- (0 rows)
  SELECT jsonb_path_query(info, 'strict $.email') FROM person;
  -- ERROR:  JSON object does not contain key "email"   SQL state: 2203A
  ```
- The four query functions compared (one table in the lesson):

  | function | returns | no match |
  |---|---|---|
  | `jsonb_path_query(j, p)` | SETOF jsonb (one row per match) | zero rows; the source row disappears from the SELECT output |
  | `jsonb_path_query_array(j, p)` | jsonb array of all matches | `[]` (NULL if either arg NULL) |
  | `jsonb_path_query_first(j, p)` | first match, jsonb | SQL NULL |
  | `jsonb_path_exists(j, p)` | boolean | false |
  | `jsonb_path_match(j, p)` | boolean predicate result | (listed in index only, no page) |
- Worked example showing the row-dropping effect (products table with Laptop having specs.cpu, Smartphone not):
  ```sql
  SELECT jsonb_path_query(attributes, '$.specs.cpu') AS cpu FROM products;   -- 1 row: "Intel i7"
  SELECT name, jsonb_path_exists(attributes, '$.specs.cpu') FROM products;   -- Laptop t, Smartphone f
  SELECT jsonb_path_query_array(data, '$.pets[*].name') FROM employees;      -- ["Fluffy","Buddy"], ["Max"], ["Snowball"]
  SELECT jsonb_path_query_first(data, '$.pets[*].name') FROM person;         -- "Fluffy", "Max", "Snowball"
  ```
- Pitfall: two set-returning `jsonb_path_query` calls in one SELECT list (brand, price example) run in lockstep; if
  they return different counts PG pads with NULLs (PG10+ SRF semantics). Prefer `_first` for scalar extraction.
- Pitfall: `jsonb_array_length(jsonb_path_query(info, '$.pets'))` (Neon pet_count example) works but is clumsier than
  `jsonb_array_length(info -> 'pets')`.

### Building JSON: to_jsonb, jsonb_build_array/object, jsonb_object, row_to_json  [M2, M3]  (source: to_jsonb.txt, jsonb_build_array.txt, jsonb_build_object.txt, jsonb_object.txt, row_to_json.txt)
- `to_jsonb(value) → jsonb`: `to_jsonb('Hello'::text)` gives `"Hello"` (`jsonb_typeof` = string); `to_jsonb(10::int)` 10;
  `to_jsonb(9.99::numeric)` 9.99; booleans true/false; arrays become JSON arrays (`ARRAY['red','green','blue']` gives
  `["red", "green", "blue"]`); composites become objects.
- `jsonb_build_array(VARIADIC "any") → jsonb`: `jsonb_build_array(10, null, 'Hi', true)` gives `[10, null, "Hi", true]`
  (SQL NULL becomes JSON null inside builders).
- `jsonb_build_object(VARIADIC "any") → jsonb`: keys coerced to text, values via to_jsonb. Odd arg count:
  `ERROR: argument list must have even number of elements` / `HINT: The arguments of jsonb_build_object() must consist of alternating keys and values.`
- `jsonb_object(text[])` / `jsonb_object(keys text[], values text[])`: everything becomes a JSON **string**
  (`{"age": "22", "name": "John"}`: note `"22"` not `22`). 2-D form is an array of pairs; Neon's own 2-D example
  `'{{"name","age"},{"John", 22}}'` produces `{"John": "22", "name": "age"}`, a nice "read the shape carefully" pitfall
  (correct form: `'{{"name","John"},{"age","22"}}'`).
- `row_to_json(record [, pretty boolean]) → json` (returns **json**, not jsonb: output has no spaces
  `{"f1":"John","f2":20}` and preserves column order). Anonymous `row(...)` gets keys f1, f2...; use a subquery or CTE
  alias (`row_to_json(t) FROM (SELECT title, length FROM film) t`) to get real column names.
- Pattern: `jsonb_build_object('name', name, 'price', price)` per row + `jsonb_agg(...)` = API response in one query.

### Aggregating into JSON: jsonb_agg, jsonb_object_agg and their _strict variants  [M3]  (source: jsonb_agg.txt, jsonb_object_agg.txt)
- Angle: "one row per parent with a JSON array of children", the classic API-shaping query, built in three steps:
  flat aggregate, then GROUP BY with JOIN, then LEFT JOIN exposing the NULL problem.
  ```sql
  SELECT department_name, jsonb_agg(employee_name) AS employees
  FROM departments d LEFT JOIN employees e ON d.id = e.department_id
  GROUP BY department_name;
  -- Engineering | ["John Doe", "Jane Smith", "Alice Johnson"]
  -- Sales       | ["Bob Brown"]
  -- IT          | [null]          <-- empty department
  -- jsonb_agg_strict(employee_name) gives IT | []
  ```
  Note: the `[]` happens because the IT group has one input row (the NULL from the LEFT JOIN), so the aggregate state
  is created and the null skipped. With zero input rows (e.g. a scalar aggregate over an empty table) any jsonb_agg
  returns SQL NULL. Contrast with `jsonb_agg(x) FILTER (WHERE x IS NOT NULL)`, which gives SQL NULL for IT (filtered
  rows never reach the aggregate), hence the common idiom `COALESCE(jsonb_agg(x) FILTER (WHERE x IS NOT NULL), '[]')`.
  Verify both in PGlite before teaching.
- `jsonb_object_agg(key, value)`: key must not be NULL; NULL values are kept (`"Alex Miller": null`);
  `jsonb_object_agg_strict` drops pairs with NULL value. `jsonb_object_agg(department_name, id)` gives
  `{"Sales": 1, "Marketing": 2}`.
- Version note: `jsonb_agg_strict`, `jsonb_object_agg_strict` (and `_unique` variants) are PG16+.
- Pitfall: element order inside jsonb_agg follows input order, which is unspecified; use `jsonb_agg(x ORDER BY x)`.

### Modifying JSONB: jsonb_set, jsonb_insert, jsonb_strip_nulls  [M3, M5]  (source: jsonb_set.txt, jsonb_insert.txt, jsonb_strip_nulls.txt)
- Signatures: `jsonb_set(target jsonb, path text[], new_value jsonb [, create_missing boolean DEFAULT true])`;
  `jsonb_insert(target jsonb, path text[], new_value jsonb [, insert_after boolean DEFAULT false]) → jsonb`.
- Angle: contrast them as "replace" vs "insert", with the same six example shapes (array, nested array, object, nested
  object, array inside object, UPDATE on a table). Great as a side-by-side diff visualizer.
  ```sql
  SELECT jsonb_set('[1,2,3]', '{0}', '-1');                 -- [-1, 2, 3]
  SELECT jsonb_set('[1,2,3]', '{4}', '4');                  -- [1, 2, 3, 4]  (index past end appends)
  SELECT jsonb_set('[1,2,[4,5],6]', '{2,0}', '3');          -- [1, 2, [3, 5], 6]
  SELECT jsonb_set('{"name": "Jane Doe"}', '{age}', '25');          -- {"age": 25, "name": "Jane Doe"}
  SELECT jsonb_set('{"name": "Jane Doe"}', '{age}', '25', false);   -- {"name": "Jane Doe"} (unchanged)
  SELECT jsonb_insert('[1,2,3]', '{0}', '0');               -- [0, 1, 2, 3]
  SELECT jsonb_insert('[1,2,3]', '{0}', '0', true);         -- [1, 0, 2, 3]
  SELECT jsonb_insert('[1,2,[4,5],6]', '{2,0}', '3');       -- [1, 2, [3, 4, 5], 6]
  SELECT jsonb_insert('{"name": "John"}', '{age}', '2');    -- {"age": 2, "name": "John"}
  SELECT jsonb_insert('{"name": "John"}', '{name}', '"Jane"');
  -- ERROR:  cannot replace existing key   HINT:  Try using the function jsonb_set to replace key value.
  SELECT jsonb_insert('{"name": "John", "skills": ["PostgreSQL", "API"]}', '{skills,1}', '"Web Dev"');
  -- {"name": "John", "skills": ["PostgreSQL", "Web Dev", "API"]}
  UPDATE employee_skills SET data = jsonb_set(data, '{skills,0}', '"Web Dev"') WHERE id = 1 RETURNING *;
  ```
- Pitfall: new_value is jsonb, so a string must be written `'"Jane Smith"'` (inner double quotes). `'Jane Smith'` fails.
- Pitfall (from PG docs, worth adding): `jsonb_set(target, path, NULL)` returns SQL NULL for the whole document
  (strict function), wiping the column in an UPDATE; use `jsonb_set_lax` or `'null'::jsonb`.
- `jsonb_strip_nulls(j)`: recursively removes object fields whose value is null; nulls inside arrays stay.
  `{"first_name": "John", "middle_name": null, "last_name": "Doe", "scores": [null, 4, 5]}` gives
  `{"scores": [null, 4, 5], "last_name": "Doe", "first_name": "John"}`. Nested example result:
  `{"id": 1, "name": "Laptop", "specs": {"cpu": "Intel i7", "gpu": "Nvidia GTX 1650", "extras": {"fingerprint_reader": true}}}`.
- M5 angle (not in Neon): every jsonb_set UPDATE writes a whole new tuple version (and new TOAST chunks if large);
  there is no in-place partial update. Good bridge to MVCC/TOAST lessons.

### Shredding JSON into rows: array_elements, each, object_keys, to_record, populate_record(set)  [M3]  (source: jsonb_array_elements*.txt, jsonb_array_length.txt, jsonb_each*.txt, jsonb_object_keys.txt, jsonb_to_record.txt, jsonb_populate_record*.txt, jsonb_typeof.txt, jsonb_pretty.txt)
- Behaviour summary (each page's "wrong input" sentence):

  | function | output | non-matching type | NULL input |
  |---|---|---|---|
  | `jsonb_array_elements(a)` | SETOF jsonb | error | empty set |
  | `jsonb_array_elements_text(a)` | SETOF text | error | empty set |
  | `jsonb_array_length(a)` | int, top level only | error | NULL |
  | `jsonb_each(o)` | SETOF (key text, value jsonb) | error | empty set |
  | `jsonb_each_text(o)` | SETOF (key text, value text) | error | empty set |
  | `jsonb_object_keys(o)` | SETOF text | error | empty set |
  | `jsonb_typeof(v)` | text: object, array, string, number, boolean, null | n/a | NULL |
- Nested arrays are a single element: `jsonb_array_elements('[1,2,3, [4,5], 6]')` gives 5 rows incl. `[4, 5]`;
  `jsonb_array_length` of the same is 5.
- Implicit LATERAL with comma join (Neon's style), the key pattern for M3:
  ```sql
  SELECT href, key, value FROM links, jsonb_each(attributes);       -- 8 rows from 3 links
  SELECT id, key, info -> key AS value FROM person, jsonb_object_keys(info) AS key;
  SELECT DISTINCT jsonb_array_elements_text(skills) FROM employees; -- 9 unique skills from 12
  ```
  `_text` versions return numbers as text ("1","2","3"): cast explicitly.
- `jsonb_to_record(obj) AS alias(col type, ...)`: column names match keys; extra keys ignored; you may declare fewer
  columns; nested arrays of objects map to a composite array type:
  ```sql
  CREATE TYPE pet AS (type VARCHAR, name VARCHAR);
  SELECT * FROM jsonb_to_record('{"id": 1, "name": "Alice", "age": 30, "pets": [{"type":"cat", "name": "Ellie"}, {"type":"dog", "name": "Birdie"}]}')
    AS person (id INT, name TEXT, pets pet[]);
  -- 1 | Alice | {"(cat,Ellie)","(dog,Birdie)"}
  ```
- `jsonb_populate_record(null::person, '{"id": 1, "name": "John", "age": 22}')` gives `(1,John,22)`: the `null::type`
  argument is only a type template. Table row types work too (`null::employees`).
- `jsonb_populate_recordset(null::address_type, '[{...},{...}]')` with `SELECT *` gives proper columns
  (street | city | zipcode). Pattern for bulk-ingesting a JSON payload into a table:
  `INSERT INTO t SELECT * FROM jsonb_populate_recordset(null::t, $1)`.
- `jsonb_pretty(j)` returns indented text (psql shows `+` continuation marks). Key order in output is jsonb's storage
  order (shorter keys first, then by bytes), e.g. `"id"`, `"age"`, `"name"`: a visible demonstration that jsonb does not
  preserve key order (M2).

### Window functions: concept and syntax  [M3]  (source: window-function.txt)
- Pedagogical angle (worth copying verbatim as a lesson arc): start from an aggregate (`AVG(price)` over the table,
  1 row), then GROUP BY (one row per group, rows collapse), then the same AVG with `OVER (PARTITION BY group_name)`:
  "Similar to an aggregate function, a window function operates on a set of rows. However, it does not reduce the
  number of rows returned by the query." The "window" = the set of rows the function sees for the current row.
  This three-query progression on one 11-row table is the cleanest "aha" path; animate rows collapsing vs staying.
- Evaluation order stated explicitly: window functions are computed on the result set **after** JOIN, WHERE,
  GROUP BY and HAVING and **before** the final ORDER BY (and before DISTINCT / LIMIT, per the ROW_NUMBER page).
  Consequence: you cannot filter on a window result in WHERE; wrap in a CTE/subquery (DENSE_RANK "top per group").
- Syntax as taught:
  ```
  window_function(arg1, arg2, ...) OVER (
     [PARTITION BY partition_expression]
     [ORDER BY sort_expression [ASC | DESC] [NULLS {FIRST | LAST}]]
     [frame_clause])
  ```
  PARTITION BY optional (whole result set = one partition). Named windows: `... OVER w ... WINDOW w AS (PARTITION BY c1 ORDER BY c2)`.
  (Neon's WINDOW-clause example has a stray trailing comma `wf2() OVER w,` before FROM: a syntax error if copied.)
- Neon's function list (11): CUME_DIST, DENSE_RANK, FIRST_VALUE, LAG, LAST_VALUE, LEAD, NTILE, NTH_VALUE,
  PERCENT_RANK, RANK, ROW_NUMBER; plus "AVG(), MIN(), MAX(), SUM(), COUNT() can be also used as window functions".
- Sample data: product_groups (Smartphone, Laptop, Tablet) + 11 products (schema below). Computed group averages:
  Smartphone 500, Laptop 850, Tablet 350 (overall 586.36...). The Laptop group's deliberate tie
  (Lenovo Thinkpad 700, Sony VAIO 700) is what drives every RANK vs DENSE_RANK vs ROW_NUMBER explanation.

### Ranking: ROW_NUMBER, RANK, DENSE_RANK  [M3]  (source: window-function.txt, row_number.txt, rank-function.txt, dense_rank-function.txt)
- Angle: one tiny single-column table per function so the tie behaviour is visible without noise:
  ```sql
  CREATE TABLE ranks (c VARCHAR(10));
  INSERT INTO ranks(c) VALUES ('A'),('A'),('B'),('B'),('B'),('C'),('E');
  SELECT c, RANK() OVER (ORDER BY c) FROM ranks;              -- 1,1,3,3,3,6,7   (computed)
  CREATE TABLE dense_ranks (c VARCHAR(10));
  INSERT INTO dense_ranks(c) VALUES ('A'),('A'),('B'),('C'),('C'),('D'),('E');
  SELECT c, DENSE_RANK() OVER (ORDER BY c) FROM dense_ranks;  -- 1,1,2,3,3,4,5   (computed)
  ```
  Neon's RANK rule: "adds the number of tied rows to the tied rank to calculate the rank of the next row".
- Laptop partition ordered by price ASC: Lenovo 700, Sony 700, Dell 800, HP 1200 gives
  ROW_NUMBER 1,2,3,4 (tie order arbitrary), RANK 1,1,3,4, DENSE_RANK 1,1,2,3.
- Whole-table `DENSE_RANK() OVER (ORDER BY price DESC)`: 1200 gives 1, 900 gives 2, 800 gives 3, 700 (x3) gives 4,
  500 gives 5, 400 gives 6, 200 (x2) gives 7, 150 gives 8 (computed).
- Top-N per group pattern (filter needs a CTE because of evaluation order):
  ```sql
  WITH cte AS (
    SELECT product_id, product_name, group_id, price,
           DENSE_RANK() OVER (PARTITION BY group_id ORDER BY price DESC) price_rank
    FROM products)
  SELECT product_id, product_name, price FROM cte WHERE price_rank = 1;
  -- iPhone 900, HP Elite 1200, iPad 700  (computed; DENSE_RANK/RANK keep ties, ROW_NUMBER would pick one)
  ```
- ROW_NUMBER + DISTINCT pitfall (excellent "evaluation order" exercise):
  ```sql
  SELECT DISTINCT price, ROW_NUMBER() OVER (ORDER BY price) FROM products ORDER BY price;
  -- 11 rows, duplicates remain: row_number is computed BEFORE DISTINCT, and every row number is unique
  WITH prices AS (SELECT DISTINCT price FROM products)
  SELECT price, ROW_NUMBER() OVER (ORDER BY price) FROM prices;   -- 8 rows: 150,200,400,500,700,800,900,1200
  ```
- Pagination with ROW_NUMBER: `SELECT * FROM (SELECT ..., ROW_NUMBER() OVER (ORDER BY product_name) rn FROM products) x WHERE rn BETWEEN 6 AND 10;`
  Teaching note (not in Neon): result depends on collation (in C collation `iPad`/`iPhone` sort after all capitalised
  names; in en_US they sort among the I's); and like OFFSET it still computes all earlier rows; keyset pagination is
  the scalable alternative (M4).
- Nth highest (third most expensive distinct price = 800, Dell Vostro): nested DISTINCT + ROW_NUMBER subquery. Simpler
  equivalent: `DENSE_RANK() ... WHERE rnk = 3`, a nice refactoring exercise.

### Value functions: FIRST_VALUE, LAST_VALUE, NTH_VALUE and the frame trap  [M3]  (source: window-function.txt, first_value-function.txt, last_value-function.txt, nth_value-function.txt)
- The single most valuable pitfall in this slice. Neon states the default frame (when ORDER BY is present) is
  `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, so:
  - `FIRST_VALUE(price) OVER (PARTITION BY group_name ORDER BY price)` works with the default frame (the first row is
    always in the frame): lowest price per group.
  - `LAST_VALUE(price) OVER (PARTITION BY group_name ORDER BY price)` with the default frame returns the current row's
    value (or its last peer), NOT the group maximum. Fix: `RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.
  - Subtle extra (not stated by Neon, follows from RANGE + peers): in the Laptop group with the default frame, Lenovo
    and Sony (both 700) both see the frame end at the last 700-peer, so LAST_VALUE(product_name) returns the same name
    for both rows. Great visualizer case: frame boundary jumps over peers in RANGE mode but not in ROWS mode.
  - Without ORDER BY the frame is the whole partition (from PG docs), so LAST_VALUE "works" but is nondeterministic.
- NTH_VALUE(expression, offset): offset > 0, counted from the first row of the frame. Neon uses the full frame:
  ```sql
  SELECT product_id, product_name, price,
         NTH_VALUE(product_name, 2) OVER (ORDER BY price DESC
            RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
  FROM products;   -- 'iPhone' on every row (computed: HP Elite 1200 is 1st, iPhone 900 is 2nd)
  -- with PARTITION BY group_id: g1 Nexus, g2 Dell Vostro, g3 Samsung Galaxy Tab (computed)
  ```
  With the default frame, the first row of each partition would get NULL (its frame has only 1 row).
- FIRST_VALUE/LAST_VALUE/LAG/LEAD argument rules per Neon: expression may be a column, expression or subquery, "must
  return a single value" and "cannot be a window function".

### Offset functions: LAG and LEAD  [M3]  (source: window-function.txt, lag-function.txt, lead-function.txt)
- Signature: `LAG(expression [, offset [, default_value]]) OVER (...)`, same for LEAD. offset defaults to 1; default_value
  defaults to NULL and is returned when the offset falls outside the partition.
- Year-over-year with the sales table (outputs from the page):
  ```sql
  SELECT year, amount, LAG(amount, 1) OVER (ORDER BY year) previous_year_sales
  FROM sales WHERE group_id = 1;
  -- 2018 | 1474.00 | NULL
  -- 2019 | 1915.00 | 1474.00
  -- 2020 | 1646.00 | 1915.00
  SELECT year, amount, group_id,
         LAG(amount, 1) OVER (PARTITION BY group_id ORDER BY year) previous_year_sales
  FROM sales;      -- 9 rows, NULL at 2018 of each group
  ```
- LEAD after GROUP BY via a CTE (aggregate first, then window), then a second CTE for the variance:
  ```sql
  WITH cte AS (SELECT year, SUM(amount) amount FROM sales GROUP BY year),
       cte2 AS (SELECT year, amount, LEAD(amount, 1) OVER (ORDER BY year) next_year_sales FROM cte)
  SELECT year, amount, next_year_sales, next_year_sales - amount AS variance FROM cte2;
  -- 2018 | 5021.00 | 4944.00 | -77.00
  -- 2019 | 4944.00 | 5137.00 | 193.00
  -- 2020 | 5137.00 | NULL    | NULL          (computed)
  ```
  Teaching note: the CTE is not required: `LEAD(SUM(amount)) OVER (ORDER BY year)` works directly in a GROUP BY query
  because windows run after grouping, a good "evaluation order" follow-up. The `ORDER BY year` inside Neon's CTE is
  useless (the window has its own ORDER BY).
- Pitfall: `price - LAG(price) OVER (...)` repeated twice in the overview; use a named WINDOW or compute once in a CTE.
- Pitfall: LAG over a WHERE-filtered set looks at the previous *returned* row, not the previous calendar year; gaps in
  data (missing year) silently compare non-adjacent years.

### Distribution: CUME_DIST, PERCENT_RANK, NTILE  [M3]  (source: cume_dist-function.txt, percent_rank-function.txt, ntile-function.txt)
- Shared dataset `sales_stats(name, year, amount)`, 5 people x 2 years (schema below). Outputs were images; computed:
  - 2018 `CUME_DIST() OVER (ORDER BY amount)`: Yin Yang 30000 0.2, Jane Doe 110000 0.4, John Doe 120000 0.6,
    Jack Daniel 150000 0.8, Stephane Heady 200000 1.0. Neon's reading: "80% of sales employees have sales less than or
    equal to 150K in 2018."
  - 2019 `PERCENT_RANK() OVER (ORDER BY amount)`: Yin 0, Jane 0.25, John 0.5, Jack 0.75, Stephane 1.
  - 2019 `NTILE(3) OVER (ORDER BY amount)` on 5 rows: buckets sized 2,2,1: Yin 1, Jane 1, John 2, Jack 2, Stephane 3.
- Formulas to put side by side: PERCENT_RANK = (rank - 1) / (rows - 1), range [0, 1], first row always 0.
  CUME_DIST = (rows with value <= current, i.e. position of last peer) / rows, range (0, 1]. Ties get the same value.
- NTILE rules from the page: buckets must be a positive integer expression (> 0), not nullable; when rows are not
  divisible "groups of two sizes with the difference by one. The bigger groups always come before the smaller groups".
  ORDER BY is optional but "you should always use the ORDER BY clause". Use case: quartiles/deciles, top x% reports.
- Pitfall (Neon page error): PERCENT_RANK page states `0 < PERCENT_RANK() <= 1` and in the next sentence "the first value
  always receives a rank of zero". Correct range is `0 <= PERCENT_RANK() <= 1`.

### Aggregate functions: NULL semantics, DISTINCT, GROUP BY / HAVING  [M3, M5]  (source: aggregate-functions.txt, avg-function.txt, count-function.txt, max-function.txt, min-function.txt, sum-function.txt, bool_and.txt, bool_or.txt)
- Angle: every aggregate page follows the same ladder: whole table, then subquery ("find the rows that have the max"),
  then GROUP BY, then HAVING. Most use the dvdrental `payment` / `film` tables (not loadable in PGlite as-is, see
  Discrepancies); the BOOL_AND/BOOL_OR and AVG-NULL pages use tiny self-contained tables that are lesson-ready.
- NULL rules as stated across the pages (the core lesson card):

  | aggregate | NULL inputs | empty set | DISTINCT |
  |---|---|---|---|
  | `COUNT(*)` | counted (counts rows) | 0 | n/a |
  | `COUNT(col)` | ignored | 0 | `COUNT(DISTINCT col)` = unique non-null values |
  | `SUM(x)` | ignored | **NULL, not zero** | `SUM(DISTINCT x)`: 1,1,2 gives 3 vs 4 |
  | `AVG(x)` | ignored (10, NULL, 30 gives 20.00, not 13.33) | NULL | `AVG(DISTINCT amount)` 6.14 vs 4.20 |
  | `MIN/MAX(x)` | ignored | NULL | "DISTINCT option does not have any effects" |
  | `BOOL_AND/BOOL_OR` | ignored | NULL | n/a |
- AVG-NULL demo (self-contained):
  ```sql
  CREATE TABLE t1 (id serial PRIMARY KEY, amount INTEGER);
  INSERT INTO t1 (amount) VALUES (10), (NULL), (30);
  SELECT AVG(amount)::numeric(10,2) FROM t1;            -- 20.00
  SELECT SUM(amount)/COUNT(*) FROM t1;                  -- 13 (integer division, and NULL counted): contrast exercise
  ```
- SUM-empty fix: `SELECT COALESCE(SUM(amount), 0) total FROM payment WHERE customer_id = 2000;` gives 0.
- AVG output formatting: `AVG(amount)` on numeric returns many digits (`4.2006056453822965`); Neon uses
  `::numeric(10,2)` or `ROUND(AVG(x), 2)`.
- COUNT(*) and MVCC (M5 bridge, verbatim idea from the page): "When you apply the COUNT(*) function to the entire table,
  PostgreSQL has to scan the whole table sequentially ... This is related to the PostgreSQL MVCC implementation. Due to
  multiple transactions seeing different states of data simultaneously, there is no direct way for COUNT(*) function
  to count across the entire table." (Add from PG docs: an index-only scan can help when the visibility map is mostly
  all-visible; `pg_class.reltuples` gives a fast estimate.)
- BOOL_AND / BOOL_OR with NULLs (self-contained, outputs from the page):
  ```sql
  -- projects: Team A (false, true), Team B (true, true), Team C (true, NULL)
  SELECT team_name, BOOL_AND(active) FROM projects JOIN teams USING (team_id) GROUP BY team_name;
  -- Team A f | Team B t | Team C t     (NULL ignored, so C is "all true")
  -- members: Team A (true, NULL), Team B (true, false), Team C (false, NULL)
  SELECT team_name, BOOL_OR(active) FROM members JOIN teams USING (team_id) GROUP BY team_name;
  -- Team A t | Team B t | Team C f
  ```
  Pitfall: because NULLs are ignored, a group whose values are all NULL returns NULL (neither t nor f), and
  `HAVING BOOL_AND(active) = true` drops it. Ask learners: "is Team C really all-active?" (Its BI project is unknown.)
  `every()` is the SQL-standard alias of bool_and (PG docs).
- "Rows with the max" pattern: `WHERE replacement_cost = (SELECT MAX(replacement_cost) FROM film)`, returns all ties.
  Alternative to teach later: `ORDER BY ... FETCH FIRST 1 ROWS WITH TIES`, or RANK() = 1.
- GROUP BY by primary key with non-aggregated columns: Neon writes `SELECT customer_id, first_name, last_name, AVG(amount)
  ... GROUP BY customer_id`. This is legal only because customer_id is customer's PK (functional dependency, PG 9.1+).
  Great "why does this work here but fail elsewhere" moment.
- SUM over intervals: `SUM(return_date - rental_date)` gives `71786 days 190098:21:00`: hours are not normalized into
  days. Ties directly to `justify_hours` / `justify_interval` (date section).
- HAVING vs WHERE: aggregates cannot appear in WHERE (Neon's MAX page loosely says MAX can be used "in the WHERE" clause;
  it means inside a subquery in WHERE).

### Ordered-set-free concatenation aggregates: ARRAY_AGG, STRING_AGG  [M3]  (source: array_agg.txt, string_agg-function.txt)
- `ARRAY_AGG(expression [ORDER BY sort_expression {ASC|DESC}, ...])`: without ORDER BY, element order is arbitrary
  ("the actors in each film are arbitrarily ordered"); add ORDER BY inside the call: `ARRAY_AGG(first_name || ' ' || last_name ORDER BY first_name ASC, last_name DESC)`.
- `STRING_AGG(expression, separator [ORDER BY ...])`: text only ("If you use other types than character string type, you
  need to explicitly cast"); no trailing separator. Example: `STRING_AGG(email, ';')` per country.
  Note: the ORDER BY goes after the last argument with no comma: `STRING_AGG(name, ',' ORDER BY name)`.
- Pitfall: Neon groups by `title` (not film_id): two films with the same title would be merged. Group by the key.
- Pitfall: `first_name || ' ' || last_name` returns NULL if either part is NULL; `concat_ws(' ', ...)` does not
  (string section). ARRAY_AGG keeps NULLs as elements; STRING_AGG skips NULL values.

### String functions (compact reference)  [M3, M4]  (source: string-functions.txt and the 28 string-functions__*.txt pages)
- Angle: each page = syntax, NULL behaviour, a literal example, a dvdrental `customer`/`film` example, and sometimes a
  small self-contained table (blog_posts, articles, tweets, todo, posts, words, contacts) used for an UPDATE clean-up.
  The "clean up messy data with UPDATE ... SET col = fn(col) RETURNING *" pattern recurs and is a good DML exercise.
- One line per function (signature | example | gotcha):
  - `ASCII(char)` | `ASCII('A')` 65, `ASCII('ABC')` 65 (first char), `ASCII('Ω')` 937 | returns the Unicode code point in UTF8.
  - `CHR(int)` | `CHR(65)` 'A', `CHR(937)` 'Ω' | inverse of ASCII.
  - `CONCAT(s1, s2, ...)` | `CONCAT(name, ' ', '(', email, ')', ' ', phone)` | ignores NULL args, while `'John' || NULL` is NULL (contacts table demo below). Available since 9.1.
  - `CONCAT_WS(sep, s1, ...)` | `CONCAT_WS(' ', 'PostgreSQL', 'Tutorial')` | skips NULL strings (no doubled separators); NULL separator gives NULL.
  - `FORMAT(fmt, ...)` | `FORMAT('%1$s apple, %2$s orange, %1$s banana', 'small', 'big')`; `FORMAT('|%10s|','one')` gives `|       one|`, `'|%-10s|'` gives `|one       |` | specifier `%[position][flags][width]type`; types `s` (NULL as empty string), `I` (identifier), `L` (literal); `%%` for a percent sign; width can be `*` or `*n$`. `%I`/`%L` are the safe way to build dynamic SQL in PL/pgSQL (M6).
  - `INITCAP(text)` | `INITCAP('hello john')` 'Hello John' | words = alphanumeric runs; "postgresql" becomes "Postgresql" (lowercases the rest): blog_posts UPDATE demo.
  - `LEFT(s, n)` / `RIGHT(s, n)` | `LEFT('ABC',2)` 'AB', `LEFT('ABC',-2)` 'A', `RIGHT('XYZ',-1)` 'YZ' | negative n = all but the last / first |n|.
  - `LENGTH(s)` | `LENGTH('PostgreSQL Tutorial')` 19 | characters, not bytes (use `octet_length`); synonyms `CHAR_LENGTH`, `CHARACTER_LENGTH`; NULL in, NULL out.
  - `LOWER(s)` / `UPPER(s)` | `WHERE LOWER(last_name) = 'barnett'` | locale-dependent; a plain index on last_name is not used: needs an expression index `ON customer (lower(last_name))` (M4), or citext.
  - `LPAD(s, len [, fill])` / `RPAD(s, len, fill)` | `LPAD('123',5,'0')` '00123', `LPAD(123::text,5,'0')`, `RPAD('123',6,'0')` '123000' | default fill is space; longer input is truncated (on the right for both); `RPAD(title, 10, '')` truncates only (empty fill cannot pad). LPAD/REPEAT text bar charts: `LPAD('*', CAST(TRUNC(SUM(amount)/10) AS INT), '*')`, `REPEAT('*', (COUNT(film_id)/10)::INT)`.
  - `LTRIM(s [, chars])` / `RTRIM(s [, chars])` / `TRIM([LEADING|TRAILING|BOTH] chars FROM s)` | `LTRIM('#postgres','#')`, `RTRIM('postgres!!!','!')`, `TRIM(LEADING '0' FROM '000123450')` '123450', `TRAILING` '00012345', `BOTH` '12345' | the second arg is a character SET, not a substring (`RTRIM('abcxxzx','xyz')` gives 'abc'); default is space.
  - `MD5(s)` | `MD5('PostgreSQL MD5')` 'f78fdb18bf39b23d42313edfaf7e0a44' | returns 32-char hex TEXT; not for passwords (use pgcrypto `crypt()`).
  - `POSITION(sub IN s)` | `POSITION('Tutorial' IN 'PostgreSQL Tutorial')` 12; `POSITION('is' IN 'This is a cat')` 3 | case-sensitive, 1-based, 0 when not found, first occurrence only.
  - `REGEXP_MATCHES(s, pattern [, flags])` | `REGEXP_MATCHES('Learning #PostgreSQL #REGEXP_MATCHES', '#([A-Za-z0-9_]+)', 'g')` gives 2 rows `{PostgreSQL}`, `{REGEXP_MATCHES}`; wrap in `UNNEST` for plain text | **set-returning**: in a SELECT list, rows with no match vanish (that is why the film Cat/Dog example only lists matching films). Returns text[] per match (captures). Pattern `'Cat | Dog '` includes literal spaces; use `\m...\M` word boundaries.
  - `REGEXP_REPLACE(s, pattern, repl [, flags])` | `REGEXP_REPLACE('John Doe','(.*) (.*)','\2, \1')` 'Doe, John'; `REGEXP_REPLACE('ABC12345xyz','[[:alpha:]]','','g')` '12345'; `'\s{2,}'` to ' ' collapses spaces | without 'g' only the first match is replaced.
  - `REPEAT(s, n)` | `REPEAT('A',3)` 'AAA' | n < 1 gives ''; NULL gives NULL.
  - `REPLACE(s, from, to)` | `REPLACE('ABC AA','A','Z')` 'ZBC ZZ' | replaces all occurrences; not idempotent: running `REPLACE(url,'http','https')` twice gives 'httpss'. Guard with `WHERE url LIKE 'http:%'`.
  - `REVERSE(s)` | palindrome check `word = REVERSE(word)` on words table (radar, level, civic, man, 12321, madam) | NULL in, NULL out.
  - `SPLIT_PART(s, delim, n)` | `SPLIT_PART('A,B,C', ',', 2)` 'B'; n=4 gives '' (empty string, not NULL) | Neon says n "must be a positive integer"; since PG14 negative n counts from the end. Neon's `split_part(payment_date::TEXT,'-',1)` is better done with `EXTRACT`.
  - `SUBSTRING(s, start [, len])` / `SUBSTRING(s FROM start FOR len)` / `SUBSTR` | `SUBSTRING('PostgreSQL', 1, 8)` 'PostgreS', `SUBSTRING('PostgreSQL', 8)` 'SQL' | regex forms: `SUBSTRING('The house number is 9001', '([0-9]{1,4})')` '9001' (first capture group; NULL if no match); SQL-regex form `SUBSTRING('PostgreSQL' FROM '%#"S_L#"%' FOR '#')` 'SQL' (pattern must match the whole string).
  - `TO_CHAR(value, fmt)` / `TO_NUMBER(s, fmt)`: see next bullet.
  - `TRANSLATE(s, from, to)` | `TRANSLATE('12345','134','ax')` 'a2x5' | per-character mapping; extra `from` chars are deleted; Neon's toy "encryption" example is a substitution cipher (good fun exercise, not security).
- TO_CHAR / TO_NUMBER:
  - Numeric patterns: `9` digit, `0` leading zero, `.` decimal point, `D` locale decimal point, `,` group, `G` locale group,
    `FM` fill mode (suppress padding blanks/zeros), `PR` negative in angle brackets, `S` sign, `L` currency symbol,
    `MI`/`PL`/`SG` minus/plus/both at position, `RN` Roman numeral (1-3999), `TH`/`th` ordinal suffix.
  - Examples: `TO_CHAR(2017, '9,999')` '2,017'; `TO_CHAR(TIMESTAMP '2017-08-18 22:30:59', 'HH24:MI:SS')` '22:30:59';
    `TO_CHAR(payment_date, 'MON-DD-YYYY HH12:MIPM')`; `TO_CHAR(amount, 'l99999D99')` adds the locale currency symbol.
    `TO_NUMBER('12,345.6-', '99G999D9S')` -12345.6; `TO_NUMBER('$1,234,567.89', 'L9G999g999.99')` 1234567.89;
    `TO_NUMBER('1,234,567.89', '9G999g999')` 1234567 (fraction dropped); `TO_NUMBER('1,234,567.89', '999G999.99')`
    gives `ERROR: numeric field overflow  DETAIL: A field with precision 6, scale 0 must round to an absolute value less than 10^6.`
  - Pitfall: numeric TO_CHAR output has a leading space reserved for the sign; use `FM` to drop it.
  - Date/time patterns (Neon list, corrected where wrong): `YYYY`, `Y,YYY`, `YY`, `Y`, `IYYY`/`IYY`/`IY`/`I` (ISO
    week-numbering year, 4/3/2/1 digits), `BC/AD` variants, `MONTH/Month/month`, `MON/Mon/mon`, `MM`, `DAY/Day/day`,
    `DY/Dy/dy`, `DDD` (001-366), `IDDD` (001-371), `DD`, `D` (Sunday=1..Saturday=7), `ID` (Monday=1..Sunday=7), `W`, `WW`,
    `IW`, `CC`, `J` (Julian day), `RM/rm`, `HH`/`HH12` (01-12), `HH24` (00-23), `MI`, `SS`, `MS`, `US`, `SSSS`
    (seconds past midnight), `AM/PM`, `A.M./P.M.`.
- Self-contained NULL-concatenation demo (contacts table, page output):
  ```sql
  SELECT CONCAT(name, ' ', '(', email, ')', ' ', phone) FROM contacts;
  -- 'Jane Smith (jane.smith@example.com) '   (phone NULL silently dropped; note the trailing space)
  SELECT name || ' (' || email || ') ' || phone FROM contacts;  -- NULL for Jane and Alice
  SELECT CONCAT_WS(' ', name, '(' || email || ')', phone) FROM contacts;  -- no trailing space
  ```

### Math functions (compact reference)  [M2, M3]  (source: math-functions.txt and the 25 math-functions__*.txt pages)
- Angle: same compact template per function; the useful lessons hide in the type rules (numeric vs double precision
  vs integer results) and in four "applied" examples: compound interest (POWER), distance from origin (SQRT),
  sales trend (SIGN + LAG), histogram (WIDTH_BUCKET + REPEAT). Those four are worth turning into playgrounds.
- One line per function (signature | example | gotcha):
  - `ABS(x)` and prefix operator `@` | `ABS(-10.25)` 10.25, `@ -15` 15 | same type as input.
  - `CBRT(x)` | `CBRT(27)` 3, `CBRT(-27)` -3 | double precision; NULL in, NULL out.
  - `CEIL(x)` / `CEILING(x)` | `CEIL(200.25)` 201, `CEIL(-12.8)` -12 | rounds toward +infinity, so negatives go "up" toward zero.
  - `FLOOR(x)` | `FLOOR(150.75)` 150 | toward -infinity (`FLOOR(-1.5)` is -2).
  - `DEGREES(rad)` / `RADIANS(deg)` | `DEGREES(PI())` 180, `DEGREES(1)` 57.29577951308232, `RADIANS(180)` 3.141592653589793 | double precision; cast to numeric before 2-arg ROUND.
  - `DIV(y, x)` | `DIV(10,3)` 3 | integer quotient truncated toward zero, numeric type. Neon claims `/` "returns a floating-point result": false for integers (`10/3` is already 3 in PG); DIV matters for numeric inputs (`10.0/3` vs `DIV(10.0,3)`). Binning idiom `DIV(length, 30) * 30`.
  - `EXP(x)` / `LN(x)` / `LOG(x)` / `LOG(b, x)` | `EXP(1)` 2.718281828459045, `LN(10)` 2.302585092994046, `LOG(100)` 2, `LOG(2,8)` 3.0000000000000000 | `LOG(b,x)` is numeric only (hence the 16 trailing digits); quoted numeric literals like `EXP('10')` work because an unknown-type literal is coerced, `EXP('10X')` gives `invalid input syntax for type double precision: "10X"`. LN(0) errors.
  - `FACTORIAL(n)` | `factorial(5)` 120 | negative: `ERROR: factorial of a negative number is undefined`. (The old `!` postfix operator was removed in PG14.)
  - `GCD(a,b)` / `LCM(a,b)` (PG13+) | `gcd(8,12)` 4, `gcd(gcd(30,45),60)` 15, `lcm(12,18)` 36, `lcm(lcm(12,18),24)` 72 | int, bigint, numeric; gcd(0,0)=0; lcm with a zero gives 0.
  - `MIN_SCALE(n)` / `SCALE(n)` / `TRIM_SCALE(n)` (min_scale, trim_scale PG13+) | `min_scale(1.2300)` 2, `scale(3.141592653589793)` 15, `trim_scale(123.45000)` 123.45 | numeric only; `UPDATE products SET price = TRIM_SCALE(price)` turns 449.00 into 449 (display/storage of unconstrained numeric).
  - `MOD(y, x)` / `%` | `MOD(15,4)` 3, `MOD(15,-4)` 3, `MOD(-15,4)` -3, `MOD(10.5,3)` 1.5 | sign follows the dividend; divisor 0 raises division by zero.
  - `PI()` | 3.141592653589793 | `ROUND((PI() * radius * radius)::NUMERIC, 2)` (circles table).
  - `POWER(a, b)` | `POWER(2,3)` 8, `POWER(2.5,2)` 6.2500000000000000, `POWER(10,-2)` 0.01, `POWER(2,1.5)` 2.8284271247461901 | numeric when any arg is numeric. Compound interest: `ROUND(amount * POWER(1 + rate/100, years), 2)` gives 1050.00, 2450.09, 6230.91.
  - `RANDOM()` | `floor(random() * 100) + 1` integer 1..100; `ORDER BY RANDOM() LIMIT 1` | range is [0, 1). `ORDER BY random()` sorts the whole table (use TABLESAMPLE for big tables). `SETSEED(0.5)` makes the sequence repeatable in that session. PG17+ also has `random(min, max)`.
  - `ROUND(x [, n])` | `ROUND(10.4)` 10, `ROUND(10.5)` 11, `ROUND(10.812,2)` 10.81, `ROUND(10.817,2)` 10.82 | two-arg form exists only for numeric (no `round(double precision, integer)`; cast with `::numeric`). Neon's suggested wrapper `CREATE FUNCTION round(double precision, int) RETURNS numeric AS $$ SELECT round($1::numeric, $2) $$ LANGUAGE sql;`. Extra pitfall (PG docs): numeric rounds half away from zero, double precision rounds half to even, so `round(2.5::float8)` is 2 but `round(2.5)` is 3.
  - `SIGN(x)` | `SIGN(-10), SIGN(0), SIGN(10), SIGN(NULL)` gives -1, 0, 1, NULL | trend classifier with LAG (below).
  - `SQRT(x)` | `SQRT(25)` 5; `SQRT(x*x + y*y)` over numeric gives `5.000000000000000` | negative input errors.
  - `TRUNC(x [, n])` | `TRUNC(10.6)` 10, `TRUNC(1.234,2)` 1.23, `TRUNC(150.45,-2)` 100 | toward zero; negative n zeroes digits left of the point.
  - `WIDTH_BUCKET(v, low, high, count)` | `WIDTH_BUCKET(-1,0,30,3)` 0, `(0,..)` 1, `(12,..)` 2, `(25,..)` 3, `(35,..)` 4 | low inclusive, high exclusive; below gives 0, at-or-above high gives count+1. (PG also has the array-thresholds form `width_bucket(v, anyarray)`.)
- SIGN + LAG trend classifier (self-contained, page output):
  ```sql
  CREATE TABLE yearly_sales (year INTEGER PRIMARY KEY, sales_amount NUMERIC NOT NULL);   -- Neon calls it "sales"
  INSERT INTO yearly_sales VALUES (2013,10000),(2014,12000),(2015,15000),(2016,15000),(2017,20000),(2018,22000),
    (2019,22000),(2020,23000),(2021,22000),(2022,24000),(2023,26000);
  WITH s AS (SELECT year, sales_amount, LAG(sales_amount) OVER (ORDER BY year) AS prev FROM yearly_sales)
  SELECT year, sales_amount, prev,
         CASE WHEN prev IS NULL THEN 'N/A'
              WHEN SIGN(sales_amount - prev) = 1 THEN 'up'
              WHEN SIGN(sales_amount - prev) = -1 THEN 'down'
              ELSE 'unchanged' END AS sales_trend
  FROM s;   -- 2013 N/A, 2016 unchanged, 2019 unchanged, 2021 down, all others up
  ```
- WIDTH_BUCKET histogram (dvdrental film, lengths 40-200 in 6 buckets): frequencies 147, 203, 184, 194, 175, 97;
  ASCII bars via `REPEAT('*', DIV(frequency,10)::int)`. Replicate in PGlite with
  `SELECT 40 + (random()*160)::int AS length FROM generate_series(1,1000)`.
- User-defined aggregates from a 2-arg function (good M6 teaser):
  ```sql
  CREATE AGGREGATE gcd_agg(bigint) (SFUNC = gcd, STYPE = bigint);
  CREATE AGGREGATE lcm_agg(bigint) (SFUNC = lcm, STYPE = bigint);
  SELECT gcd_agg(value) FROM numbers;   -- 30,45,60,90,120 gives 15
  SELECT lcm_agg(value) FROM numbers;   -- 12,18,24,48 gives 144
  ```
  Why it works without INITCOND: gcd/lcm are strict, so the first non-null input becomes the initial state.
- Pitfall (Neon bug, good debugging exercise): the recursive-CTE GCD example's anchor selects `(id, gcd_value)` but the
  recursive term selects `(gcd(gcd_value, value), numbers.id)`: columns are swapped, so the recursion carries the id in
  the gcd column. The LCM CTE assumes ids are exactly 1..n (joins on `rn + 1 = numbers.id`). Both are reasons to prefer
  the aggregate.
- Neon also shows a PL/pgSQL `gcd(a INTEGER, b INTEGER)` (Euclid loop) "for earlier versions"; on PG13+ creating it
  overloads/shadows the built-in only for integer args (search_path dependent): note when reusing.

### Date/time: "which now?" (transaction vs statement vs clock time)  [M3, M5]  (source: date-functions.txt, now.txt, current_timestamp.txt, current_date.txt, current_time.txt, localtime.txt, localtimestamp.txt, clock_timestamp.txt, statement_timestamp.txt, timeofday.txt, pg_sleep.txt)
- The best teaching sequence in the date pages: put `pg_sleep` between two calls in ONE statement, then across
  statements in ONE transaction:
  ```sql
  SELECT NOW(), PG_SLEEP(3), NOW();                          -- identical values
  SELECT statement_timestamp(), pg_sleep(3), statement_timestamp();   -- identical values
  SELECT CLOCK_TIMESTAMP(), PG_SLEEP(3), CLOCK_TIMESTAMP();  -- 3 s apart
  SELECT TIMEOFDAY(), pg_sleep(5), TIMEOFDAY();             -- 5 s apart, TEXT 'Sat Jan 27 04:19:08.650831 2024 EET'
  BEGIN; SELECT now(); SELECT pg_sleep(3); SELECT now(); COMMIT;   -- same now() both times
  -- statement_timestamp() in 3 INSERTs inside one BEGIN..END, 3 s sleeps between: 3 different values (logs table)
  ```
  Summary table for the lesson:

  | function | frozen at | type |
  |---|---|---|
  | `NOW()`, `CURRENT_TIMESTAMP[(p)]`, `TRANSACTION_TIMESTAMP()` | transaction start | timestamptz |
  | `CURRENT_DATE` | transaction start | date |
  | `CURRENT_TIME[(p)]` | transaction start | timetz (time with time zone) |
  | `LOCALTIME[(p)]` / `LOCALTIMESTAMP[(p)]` | transaction start | time / timestamp (default precision 6) |
  | `STATEMENT_TIMESTAMP()` | statement start | timestamptz |
  | `CLOCK_TIMESTAMP()` | not frozen | timestamptz |
  | `TIMEOFDAY()` | not frozen | text |
  M5 link: "transaction start" is literally the snapshot-era notion; a long transaction that stamps rows with now()
  gives them all the same time even if committed minutes later.
- `time_it()` PL/pgSQL helper (clock_timestamp before/after `EXECUTE p_statement`, `EXTRACT(EPOCH FROM end_time - start_time) * 1000`):
  `SELECT time_it('SELECT pg_sleep(1)')` gives ~1007.731 ms. Must use clock_timestamp; now() would give 0.
- Defaults: `delivery_date DATE DEFAULT CURRENT_DATE`, `created_at TIME DEFAULT CURRENT_TIME` (timetz silently cast to
  time, zone dropped), `created_at TIMESTAMPTZ DEFAULT now()`.
- `NOW()` output follows the session `TimeZone`: `SET TIMEZONE='Africa/Cairo'` changes the displayed offset (+02), not the
  instant. `SELECT * FROM pg_timezone_names` lists zones (name, abbrev, utc_offset, is_dst). `NOW()::timestamp` drops the zone.
- `pg_sleep(seconds)` accepts fractions (`PG_SLEEP(1.5)`). In PGlite this blocks the single-threaded engine; keep
  sleeps under ~1 s in playgrounds.
- Pitfall: `WHERE rental_date = CURRENT_DATE` (Neon example) on a timestamp column only matches rows at exactly
  midnight. Use `rental_date >= CURRENT_DATE AND rental_date < CURRENT_DATE + 1` (sargable for an index, M4).
- Pitfall: `(CURRENT_DATE - date_of_birth) / 365 AS age` (Neon example) drifts with leap years; use
  `EXTRACT(YEAR FROM AGE(date_of_birth))` (date - date is an integer number of days).

### Date/time: extracting, truncating, binning  [M3]  (source: date_part.txt, extract.txt, date_trunc.txt, date_bin.txt)
- `EXTRACT(field FROM source)` / `DATE_PART('field', source)`. Fields: century, decade, year, quarter, month, week, day,
  hour, minute, second, milliseconds, microseconds, dow (Sunday 0..Saturday 6), isodow (Monday 1..Sunday 7), doy, epoch,
  isoyear, millennium, timezone, timezone_hour, timezone_minute.
- Examples (TIMESTAMP '2016-12-31 13:30:15'): year 2016, quarter 4, month 12, day 31, century 21, decade 201, dow 6,
  doy 366, epoch 1483191015.000000, second 15.000000, isodow 6, milliseconds 15000.000, microseconds 15000000.
  `date_part('week', TIMESTAMP '2017-09-30')` 39; `date_part('millennium', now())` 3; `date_part('dow', '2017-03-18')` 6, doy 77.
- From intervals (`INTERVAL '6 years 5 months 4 days 3 hours 2 minutes 1 second'`): year 6, quarter 2, month 5, day 4,
  hour 3, minute 2, second 1, milliseconds 1000, microseconds 1000000; decade of 60 years = 6; millennium of 1999 years =
  1; century = 19. Interval month is "modulo 12" (months part only).
- Return types: `date_part` returns double precision; `EXTRACT` returns **numeric** since PG14 (hence `15.000000`,
  `1483191015.000000` in Neon's output; Neon's text still says double precision).
- `DATE_TRUNC(field, source [, time_zone])`: fields millennium, century, decade, year, quarter, month, week, day, hour,
  minute, second, milliseconds, microseconds. `DATE_TRUNC('hour', TIMESTAMP '2017-03-17 02:09:30')` 02:00:00. Week
  truncation goes to Monday (dvdrental weeks all start on Mondays: 2005-05-23, 2005-05-30, ...). The optional time_zone
  arg applies to timestamptz input (PG12+). Monthly report pattern: `GROUP BY DATE_TRUNC('month', rental_date)`.
- `DATE_BIN(stride, source, origin)` (PG14+): arbitrary strides (15 minutes, 90 seconds, 6 hours); stride > 0 and no
  month-or-larger units.
  ```sql
  SELECT DATE_BIN('15 minutes', TIMESTAMP '2020-02-11 15:44:17', TIMESTAMP '2001-01-01');           -- 15:30:00
  SELECT DATE_BIN('15 minutes', TIMESTAMP '2020-02-11 15:44:17', TIMESTAMP '2001-01-01 00:02:30');  -- 15:32:30
  SELECT DATE_BIN('1 hour', TIMESTAMP '2024-06-15 09:37:52', TIMESTAMP '2001-01-01'),
         DATE_TRUNC('hour', TIMESTAMP '2024-06-15 09:37:52');                                       -- both 09:00:00
  SELECT DATE_BIN('30 minutes', event_time, TIMESTAMP '2001-01-01') AS bucket, COUNT(*) FROM events GROUP BY bucket ORDER BY bucket;
  ```
  Neon gives no CREATE for `events`; see the sample schema below. Good visualizer: a timeline with tick marks
  anchored at the origin, sliding the origin shifts every bin.

### Date/time: constructing, parsing, intervals, time zones  [M2, M3]  (source: make_date.txt, make_time.txt, make_interval.txt, to_date.txt, to_timestamp.txt, age.txt, justify_*.txt, isfinite.txt, at-time-zone.txt)
- Constructors: `MAKE_DATE(year int, month int, day int) → date` (negative year = BC; `MAKE_DATE(2024, 2, 29)` OK);
  calendar generator `SELECT MAKE_DATE(2023, 1, day) FROM generate_series(1, 7) AS day`.
  `MAKE_TIME(hour int, min int, sec double precision) → time`; `MAKE_TIME(25,30,45)` gives
  `ERROR: time field value out of range: 25:30:45`; string args coerce (`MAKE_TIME('8','30','59.999999')`).
  `MAKE_INTERVAL([years [, months [, weeks [, days [, hours [, mins [, secs double precision]]]]]]])`, all default 0;
  named notation `MAKE_INTERVAL(years => 3, months => 6, days => 15, hours => 4)` gives `3 years 6 mons 15 days 04:00:00`;
  `MAKE_INTERVAL()` gives `00:00:00`; positional from columns `MAKE_INTERVAL(year, month, 0, day, hour, minute, second)`.
- Parsing: `TO_DATE('20170103','YYYYMMDD')`, `TO_DATE('10 Feb 2017', 'DD Mon YYYY')`; `TO_DATE('2017/02/30','YYYY/MM/DD')`
  gives `ERROR: date/time field value out of range`. `TO_TIMESTAMP(text, fmt)` returns timestamptz:
  - `TO_TIMESTAMP('2017     Aug','YYYY MON')` skips extra spaces; with `FX` prefix it errors (`invalid value "" for "MON"`, SQLSTATE 22007).
  - `'2017-02-31 30:8:00'` with `HH24` errors (SQLSTATE 22008).
  - MS/US are fractional digits: `TO_TIMESTAMP('01-01-2017 10:2', 'DD-MM-YYYY SS:MS')` gives `00:00:10.2` (200 ms, same as `10:200`); write `10:002` for 2 ms.
  - 2-digit years go to the nearest century year: `'12 31 99 12:45'` with `MM DD YY HH:MI` gives 1999-12-31 **00:45**
    (HH is 12-hour, so "12" without a meridiem is midnight: a pitfall Neon shows without commenting on it). `16` gives 2016.
- `AGE(ts, ts)` / `AGE(ts)` (vs current_date midnight): `AGE('2017-01-01','2011-06-24')` gives `5 years 6 mons 7 days`;
  top rental durations `AGE(return_date, rental_date)` like `9 days 05:59:00`. Use `EXTRACT(YEAR FROM AGE(...))` for whole
  years (Neon wraps it in a pointless `DIV(..., 1)`).
- Justify family (the fix for `SUM(interval)` output like `71786 days 190098:21:00`):
  - `JUSTIFY_DAYS('30 days')` 1 mon, `'45 days'` 1 mon 15 days, `'55 days 30 minutes'` 1 mon 25 days 00:30:00 (30-day months).
  - `JUSTIFY_HOURS('25 hours')` 1 day 01:00:00, `'70 hours'` 2 days 22:00:00; leaves days alone.
  - `JUSTIFY_INTERVAL('35 days')` 1 mon 5 days, `'30 hours'` 1 day 06:00:00, `'-2 days 5 hours'` gives `-1 days -19:00:00` (sign-normalized).
  - Teaching point (M2): an interval is stored as three separate fields (months, days, microseconds), which is why
    they do not normalize automatically and why "1 month" + "30 days" are different.
- `ISFINITE(date|timestamp|interval)`: `ISFINITE(DATE 'infinity')` f, `ISFINITE(TIMESTAMP 'infinity')` f. Neon says
  intervals are always finite: outdated, PG17+ supports `'infinity'::interval`.
- `AT TIME ZONE` (session TimeZone = America/Los_Angeles in the examples, PDT -07 in March 2024):
  ```sql
  SELECT TIMESTAMP '2024-03-21 10:00:00' AT TIME ZONE 'UTC';                  -- 2024-03-21 03:00:00-07  (timestamptz)
  SELECT TIMESTAMP WITH TIME ZONE '2024-03-21 10:00:00-04' AT TIME ZONE 'UTC'; -- 2024-03-21 14:00:00     (timestamp!)
  SELECT TIMESTAMP '2024-03-21 10:00:00' AT TIME ZONE 'PST';                  -- 2024-03-21 11:00:00-07
  SELECT TIMESTAMP '2024-03-21 10:00:00' AT TIME ZONE 'America/New_York';     -- 2024-03-21 07:00:00-07
  SELECT TIMESTAMP '2024-03-21 10:00:00' AT TIME ZONE '-08:00';               -- 2024-03-20 19:00:00-07  (!)
  ```
  Two lessons hidden in Neon's own output: (1) the operator flips the type: timestamp to timestamptz ("interpret this
  wall-clock time as being in zone Z") and timestamptz to timestamp ("show the wall clock in zone Z"); Neon's claim
  that it "always returns TIMESTAMP WITH TIME ZONE" is contradicted by example 2. (2) A text offset like '-08:00' is
  POSIX-style (positive = WEST of Greenwich), so '-08:00' means UTC+8: 10:00 at UTC+8 = 02:00 UTC = 19:00 PDT the day
  before. Use a named zone or `INTERVAL '-08:00'` instead. 'PST' is a fixed abbreviation (no DST) while
  'America/Los_Angeles' follows DST.

## Reusable sample schemas

All self-contained (no dvdrental needed), PG18/PGlite-safe, small. Several Neon pages reuse the names `products`,
`employees`, `sales`, `person`; names below are disambiguated so they can coexist in one playground.

```sql
-- 1) Window-function catalog (Neon window-function.txt). Fits: M3 window lessons (ranking ties, frames, LAG/LEAD).
CREATE TABLE product_groups (group_id serial PRIMARY KEY, group_name varchar(255) NOT NULL);
CREATE TABLE products (
  product_id serial PRIMARY KEY, product_name varchar(255) NOT NULL, price decimal(11,2),
  group_id int NOT NULL REFERENCES product_groups (group_id));
INSERT INTO product_groups (group_name) VALUES ('Smartphone'), ('Laptop'), ('Tablet');
INSERT INTO products (product_name, group_id, price) VALUES
  ('Microsoft Lumia', 1, 200), ('HTC One', 1, 400), ('Nexus', 1, 500), ('iPhone', 1, 900),
  ('HP Elite', 2, 1200), ('Lenovo Thinkpad', 2, 700), ('Sony VAIO', 2, 700), ('Dell Vostro', 2, 800),
  ('iPad', 3, 700), ('Kindle Fire', 3, 150), ('Samsung Galaxy Tab', 3, 200);

-- 2) Year x group sales (lag/lead pages). Fits: M3 LAG/LEAD, PARTITION BY, aggregate-then-window.
CREATE TABLE sales (year smallint CHECK (year > 0), group_id int NOT NULL, amount decimal(10,2) NOT NULL,
                    PRIMARY KEY (year, group_id));
INSERT INTO sales VALUES (2018,1,1474),(2018,2,1787),(2018,3,1760),(2019,1,1915),(2019,2,1911),
                         (2019,3,1118),(2020,1,1646),(2020,2,1975),(2020,3,1516);

-- 3) Distribution functions (cume_dist / percent_rank / ntile pages). Fits: M3 CUME_DIST, PERCENT_RANK, NTILE.
CREATE TABLE sales_stats (name varchar(100) NOT NULL, year smallint NOT NULL CHECK (year > 0),
                          amount decimal(10,2) CHECK (amount >= 0), PRIMARY KEY (name, year));
INSERT INTO sales_stats VALUES
  ('John Doe',2018,120000),('Jane Doe',2018,110000),('Jack Daniel',2018,150000),('Yin Yang',2018,30000),
  ('Stephane Heady',2018,200000),('John Doe',2019,150000),('Jane Doe',2019,130000),('Jack Daniel',2019,180000),
  ('Yin Yang',2019,25000),('Stephane Heady',2019,270000);

-- 4) JSONB product catalog (jsonb-operators page, nested objects + arrays). Fits: M2 jsonb, M3 operators, M4 GIN demo.
CREATE TABLE catalog (id serial PRIMARY KEY, data jsonb);
INSERT INTO catalog (data) VALUES
 ('{"name":"iPhone 15 Pro","category":"Electronics","brand":"Apple","price":999.99,
    "attributes":{"color":"Graphite","storage":"256GB","display":"6.1-inch Super Retina XDR display","processor":"A15 Bionic chip"},
    "tags":["smartphone","iOS","Apple"]}'),
 ('{"name":"Samsung Galaxy Watch 4","category":"Electronics","brand":"Samsung","price":349.99,
    "attributes":{"color":"Black","size":"42mm","display":"AMOLED display","sensors":["heart rate monitor","ECG","SpO2"]},
    "tags":["smartwatch","wearable","Samsung"]}'),
 ('{"name":"Leather Case for iPhone 15 Pro","category":"Accessories","brand":"Apple","price":69.99,
    "attributes":{"color":"Saddle Brown","material":"Genuine leather","compatible_devices":["iPhone 15 Pro","iPhone 15 Pro Max"]},
    "tags":["phone case","accessory","Apple"]}'),
 ('{"name":"Wireless Charging Pad","category":"Accessories","brand":"Anker","price":29.99,
    "attributes":{"color":"White","compatible_devices":["iPhone","Samsung Galaxy","Apple Watch","Samsung Galaxy Watch"]},
    "tags":["accessory","wireless charger"]}');
-- scale it up for the GIN/EXPLAIN demo (still small enough for PGlite):
-- INSERT INTO catalog (data) SELECT jsonb_build_object('name','Item '||g,'category',(ARRAY['Electronics','Accessories','Toys'])[1+g%3],
--   'price',(random()*1000)::numeric(8,2),'tags',jsonb_build_array('t'||(g%20))) FROM generate_series(1,5000) g;

-- 5) JSON path document with nested array of objects (json-path page). Fits: M3 jsonpath, lax vs strict.
CREATE TABLE person_doc (id serial PRIMARY KEY, info jsonb);
INSERT INTO person_doc (info) VALUES
 ('{"name":"John","age":30,"city":"New York","pets":[{"name":"Max","species":"Dog"},{"name":"Whiskers","species":"Cat"}]}'),
 ('{"name":"Alice","age":30,"pets":[{"type":"cat","name":"Fluffy"},{"type":"dog","name":"Buddy"}]}'),
 ('{"name":"Bob","age":35,"pets":[{"type":"dog","name":"Max"}]}'),
 ('{"name":"Charlie","age":40,"pets":[{"type":"rabbit","name":"Snowball"}]}');

-- 6) Parent/child for jsonb_agg / jsonb_object_agg incl. an empty parent and a NULL value. Fits: M3 JSON aggregation, LEFT JOIN NULLs.
CREATE TABLE departments (id serial PRIMARY KEY, department_name varchar(255) NOT NULL);
CREATE TABLE dept_employees (id serial PRIMARY KEY, name varchar(100) NOT NULL, salary decimal(10,2),
                             department_id int NOT NULL REFERENCES departments(id) ON DELETE CASCADE);
INSERT INTO departments (department_name) VALUES ('Engineering'), ('Sales'), ('IT');
INSERT INTO dept_employees (name, salary, department_id) VALUES
  ('John Doe',60000,1),('Jane Smith',65000,1),('Alice Johnson',55000,1),('Bob Brown',70000,2),('Alex Miller',NULL,2);

-- 7) Key/value attributes for jsonb_each / jsonb_object_keys (links page). Fits: M3 LATERAL + SRFs.
CREATE TABLE links (id serial PRIMARY KEY, href text NOT NULL, attributes jsonb);
INSERT INTO links (href, attributes) VALUES
  ('https://example.com','{"rel":"stylesheet","type":"text/css","media":"screen"}'),
  ('https://example.org','{"rel":"icon","type":"image/x-icon"}'),
  ('https://example.net','{"rel":"alternate","type":"application/rss+xml","title":"RSS Feed"}');

-- 8) Boolean aggregates with NULLs (bool_and / bool_or pages). Fits: M3 aggregate NULL semantics, three-valued logic.
CREATE TABLE teams (team_id serial PRIMARY KEY, team_name varchar(100) NOT NULL);
CREATE TABLE projects (project_id serial PRIMARY KEY, name varchar(255) NOT NULL, active bool,
                       team_id int NOT NULL REFERENCES teams(team_id));
INSERT INTO teams (team_name) VALUES ('Team A'), ('Team B'), ('Team C');
INSERT INTO projects (name, active, team_id) VALUES
  ('Intranet', false, 1), ('AI Chatbot', true, 1), ('Robot', true, 2), ('RPA', true, 2),
  ('Data Analytics', true, 3), ('BI', NULL, 3);

-- 9) NULL-concatenation demo (concat page). Fits: M3 NULL handling in expressions.
CREATE TABLE contacts (id serial PRIMARY KEY, name varchar(255) NOT NULL, email varchar(255) NOT NULL, phone varchar(15));
INSERT INTO contacts (name, email, phone) VALUES
  ('John Doe','john.doe@example.com','123-456-7890'), ('Jane Smith','jane.smith@example.com',NULL),
  ('Bob Johnson','bob.johnson@example.com','555-1234'), ('Alice Brown','alice.brown@example.com',NULL),
  ('Charlie Davis','charlie.davis@example.com','987-654-3210');

-- 10) Time-series events for DATE_BIN / DATE_TRUNC (Neon references `events` without defining it). Fits: M3 time bucketing.
CREATE TABLE events (id serial PRIMARY KEY, event_time timestamp NOT NULL, kind text NOT NULL);
INSERT INTO events (event_time, kind)
SELECT TIMESTAMP '2024-06-15 08:00' + (g * interval '97 seconds'), (ARRAY['click','view','buy'])[1 + g % 3]
FROM generate_series(0, 149) g;   -- 150 rows spanning ~4 hours

-- 11) Numeric scale clean-up (trim_scale / scale pages). Fits: M2 numeric storage, M3 UPDATE ... RETURNING.
CREATE TABLE product_prices (product_id serial PRIMARY KEY, product_name varchar(100) NOT NULL, price numeric NOT NULL);
INSERT INTO product_prices (product_name, price) VALUES
  ('T-Shirt',10.123),('Jeans',20.5678),('Sneakers',30.45),('Backpack',40.12345),('Watch',50.6789),
  ('Sunglasses',60.1),('Headphones',70.23456),('Smartphone',80.123),('Laptop',90.5),('Camera',100.1234),
  ('Tablet',449.00),('Smartwatch',299.00),('Wireless Speaker',79.9900);
```

## Discrepancies and version notes

Neon errors / misleading statements (correct per PG18 docs):
- JSON path page lists `[start: end]` slices and `[?(expression)]` filters: that is Goessner JSONPath syntax, not SQL/JSON.
  PG uses `[start to end]` (also `last`) and `? (expr)` after the accessor. Its own working examples use the PG syntax.
- `jsonb_path_query` page: "If the path_expression does not locate any element ... returns NULL." It is set-returning
  and returns zero rows (the example output silently drops the non-matching product).
- `jsonb_typeof` list omits `boolean`.
- `jsonb_strip_nulls` page text claims "the entire extras object" was removed; its output shows extras kept with
  `fingerprint_reader`. PG18 adds an optional `strip_in_arrays boolean DEFAULT false` parameter to
  `json[b]_strip_nulls` (PG18 feature; Neon predates it).
- `jsonb_set` nested example text says "path 0, 2" for `'{2,0}'` (typo).
- `row_to_json` returns `json`, not jsonb; Neon is correct but its index page lists it under jsonb creation.
- `to_jsonb(NULL::text)` shown as `null`: per PG, to_jsonb is strict and returns SQL NULL; Neon's null-display
  convention hides the difference. Verify in PGlite (`SELECT to_jsonb(NULL::text) IS NULL`).
- `jsonb_agg_strict` / `jsonb_object_agg_strict` (and `_unique`) are PG16+; not mentioned as version-specific.
- Window overview: WINDOW-clause example has a trailing comma before FROM (syntax error).
- PERCENT_RANK page: range stated as `0 < x <= 1`, contradicted by "first value always 0"; correct `0 <= x <= 1`.
- Many window/rank/ntile/cume_dist outputs are images (absent in text); expected results in this file are computed.
- AVG/SUM/COUNT pages are fine; MAX page says MAX can be used in WHERE: only via a subquery.
- String summary table: `LTRIM('00123')` gives `'123'` is wrong (default trims spaces; result `00123`); `SUBSTRING('ABC',1,1)` result has a stray quote.
- SUBSTRING page: "If start_position equals zero, the substring starts at the first character ... can be only
  positive": PG accepts 0 and negatives as virtual positions before the string (`substring('PostgreSQL', 0, 3)` is 'Po').
- SPLIT_PART page: "position must be a positive integer": negative positions count from the end since PG14.
- TO_NUMBER table: `D` described as "Sign anchored to a number" (it is the locale decimal point); `RN` "does not work
  for the Roman numeric string": PG18 added RN support to `to_number()` (PG18 feature; verify on PGlite 18).
- TO_CHAR table: `I` described as "Abbreviated lowercase month name" (it is the last digit of the ISO year), `YYY`
  described as ISO year, `mon` described as capitalized, HH range "0-12" (01-12), MS range "000-9999" (000-999).
- DIV page: claims `/` returns floating point. Integer / integer truncates in PG.
- RANDOM page: "deterministic pseudo-random number generator by default" is misleading; it is seeded randomly per
  session unless `setseed()` is called. PG17 added `random(min, max)` and PG17/18 other random_* helpers.
- FACTORIAL: postfix `!` / prefix `!!` operators were removed in PG14 (Neon does not mention them; fine).
- GCD page recursive CTE swaps column order between anchor and recursive term (wrong results). LCM CTE assumes
  contiguous ids.
- WIDTH_BUCKET: upper bound exclusive, so a value equal to the upper bound already gets count+1 (page says "greater than").
- EXTRACT page: says returns double precision; since PG14 EXTRACT returns numeric (date_part still double precision).
  EXTRACT table says ISOYEAR is "week number of year" (it is the ISO 8601 week-numbering year).
- DATE_PART page omits week/quarter/millennium from its field list but uses them.
- AT TIME ZONE page: "always returns TIMESTAMP WITH TIME ZONE": false for timestamptz input (returns timestamp), as
  its own example 2 shows. Text offsets like '-08:00' are POSIX sign (UTC+8), as its own example 4 shows.
- ISFINITE: "PostgreSQL doesn't support infinity intervals": outdated, PG17+ supports `'infinity'::interval`
  (`isfinite(interval 'infinity')` is false on PG18).
- TO_DATE page: error shows `LINE 1: SELECT '2017/02/30'::date;` (copy/paste artifact).
- MAKE_DATE page text says it generates 2024-03-25 while the SQL uses 2023; generate_series comment says 2024, SQL 2023.
- MIN_SCALE syntax typo `min_sacle(n)`.

Vendor-specific / environment:
- Every page carries the same Lakebase/Databricks/Neon marketing paragraph (ignored). No cloud-console steps in this slice.
- Many examples assume the dvdrental sample DB (`film`, `payment`, `customer`, `rental`, `actor`) which is not in PGlite;
  lessons must use the self-contained schemas above or a trimmed dvdrental subset.
- Neon outputs use psql null display `null` and several in `\x` expanded mode; outputs with `-07`/`-08` offsets assume
  TimeZone America/Los_Angeles (set `SET TimeZone = 'America/Los_Angeles'` to reproduce).
- No PG19 material in this slice.

## Lesson ideas

- [M3] "Rows collapse vs rows stay" animation: same 11 products, three panes: `AVG(price)` (1 row), `GROUP BY group_name`
  (3 rows), `AVG(price) OVER (PARTITION BY group_name)` (11 rows, each with its group avg 500/850/350 attached).
- [M3] Frame visualizer: pick a row in the Laptop partition; highlight the frame for default `RANGE UNBOUNDED PRECEDING
  AND CURRENT ROW`, then `ROWS`, then `UNBOUNDED FOLLOWING`; show LAST_VALUE / NTH_VALUE results updating. Make the
  Lenovo/Sony 700 tie the hero case (RANGE includes peers, ROWS does not).
- [M3] Rank-ties slider: let the learner edit prices in the Laptop group and watch ROW_NUMBER / RANK / DENSE_RANK /
  PERCENT_RANK / CUME_DIST columns change side by side.
- [M3] Logical evaluation-order pipeline: FROM/JOIN, WHERE, GROUP BY, HAVING, window, DISTINCT, ORDER BY, LIMIT as
  stations; drop the ROW_NUMBER+DISTINCT query in and show why duplicates survive; show why `WHERE rank = 1` is illegal.
- [M3] Exercise set from Neon patterns: top-N per group (DENSE_RANK in CTE), YoY delta (LAG), trend label (SIGN + LAG),
  nth highest (DENSE_RANK = 3), pagination (ROW_NUMBER BETWEEN 6 AND 10 vs keyset), quartiles (NTILE(4)).
- [M2, M3] "Quotes tell you the type" JSON drill: show `->` vs `->>` outputs side by side; then the NULL quartet:
  missing key (SQL NULL), JSON null value (`'null'::jsonb`), `jsonb_typeof` of each, `IS NULL` of each.
- [M3] JSONPath explorer: a tree view of the person document; typing `$.pets[*] ? (@.species == "Cat")` highlights
  matched nodes; toggle `lax`/`strict` to show empty result vs `ERROR 2203A`; compare query / query_array /
  query_first / exists outputs in one grid (rows dropped vs [] vs NULL vs false).
- [M3] jsonb_set vs jsonb_insert diff viewer: same document, same path, show before/after for both functions and for
  `create_missing=false` / `insert_after=true`; include the "cannot replace existing key" error card.
- [M4] GIN payoff demo on the scaled catalog table: `EXPLAIN ANALYZE SELECT ... WHERE data @> '{"category":"Toys"}'`
  before/after `CREATE INDEX ON catalog USING gin (data)` and `jsonb_path_ops`; then show that
  `WHERE data->>'category' = 'Toys'` does NOT use the GIN index but an expression B-tree would.
- [M5, M2] "jsonb_set rewrites the whole row": after an UPDATE with jsonb_set on a large doc, inspect `ctid` change and
  (with pageinspect) the new tuple version; ties JSON modification to MVCC/TOAST.
- [M3] JSON API response builder: `jsonb_agg(jsonb_build_object(...))` per department with LEFT JOIN, showing the
  `[null]` bug, `jsonb_agg_strict` giving `[]`, and the FILTER + COALESCE idiom; then shred it back with
  `jsonb_populate_recordset` / `jsonb_to_recordset` to prove the round trip.
- [M3, M5] "Which now()?" timeline: a transaction bar with three statements and sleeps; plot now(),
  statement_timestamp(), clock_timestamp() for each call. PGlite snippet: `BEGIN; SELECT now(), statement_timestamp(),
  clock_timestamp(); SELECT pg_sleep(0.5); SELECT now(), statement_timestamp(), clock_timestamp(); COMMIT;`
- [M3] Time-zone converter widget: a wall-clock timestamp, a zone dropdown and the AT TIME ZONE result type badge
  (timestamp vs timestamptz); include the '-08:00' POSIX trap and 'PST' vs 'America/Los_Angeles' across a DST date.
- [M2] Interval anatomy: show an interval as three boxes (months | days | microseconds); `SUM(interval)` piling into
  the microseconds box, then justify_hours / justify_days / justify_interval moving units between boxes.
- [M3] Bucketing compare: DATE_TRUNC('hour') vs DATE_BIN('15 minutes', ..., origin) vs WIDTH_BUCKET on epoch over the
  events table; slider for origin offset.
- [M3] Aggregate NULL truth table playground on t1 (10, NULL, 30): COUNT(*), COUNT(amount), SUM, AVG, SUM/COUNT(*),
  plus the empty-set row (`WHERE false`) to show SUM/AVG/MIN give NULL and COUNT gives 0.
- [M3, M4] Text clean-up lab: messy titles table; apply TRIM/INITCAP/REGEXP_REPLACE in an UPDATE ... RETURNING; then a
  case-insensitive lookup with `lower(col) = ...` and an expression index; show `EXPLAIN` before/after.
- [M6] User-defined aggregate teaser: `CREATE AGGREGATE gcd_agg(bigint) (SFUNC = gcd, STYPE = bigint)`; animate the
  state value flowing row by row (30, 15, 15, 15, 15).
- [M4] Type-resolution mini-lesson from the math pages: `round(2.5)` vs `round(2.5::float8)`, `10/3` vs `10.0/3` vs
  `DIV(10.0,3)`, `LOG(2,8)` printing 16 decimals, `EXP('10')` working via unknown-literal coercion but `EXP(text_col)` failing.
