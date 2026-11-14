# PostGIS 3.6 research notes (for module e4)

Runtime: PGlite 0.5.16 + `@electric-sql/pglite-postgis` 0.2.16 → `POSTGIS="3.6.2"`, `GEOS="3.14.0"`, `PROJ="9.7.0 NETWORK_ENABLED=OFF"`,
`spatial_ref_sys` = 8500 rows. Boot about 4 s. Tags: **[DOC]** official manual page, **[RUN]** verified by running SQL in PGlite.

## Sources read (2026-11-14)
| URL | Contributed |
|---|---|
| https://postgis.net/docs/manual-3.6/using_postgis_dbmanagement.html | geometry vs geography, typmods, spatial_ref_sys, geometry_columns, WKT/WKB/EWKT, validity, spatial index types (GiST, BRIN, SP-GiST) |
| https://postgis.net/docs/manual-3.6/using_postgis_query.html | DE-9IM, named predicates, index-aware function list, ST_Distance not indexed, worked SQL examples |
| https://postgis.net/docs/manual-3.6/performance_tips.html | TOAST/large geometries, cached bbox column, CLUSTER needs NOT NULL, ST_Force2D |
| https://postgis.net/docs/manual-3.6/reference.html | operator section anchors (bbox + distance operators) |
| https://postgis.net/docs/manual-3.6/geometry_overlaps.html | `&&` |
| https://postgis.net/docs/manual-3.6/ST_Geometry_Contain.html | `~` |
| https://postgis.net/docs/manual-3.6/ST_Geometry_Contained.html | `@` |
| https://postgis.net/docs/manual-3.6/geometry_distance_knn.html | `<->` |
| https://postgis.net/docs/manual-3.6/geometry_distance_box.html | `<#>` |
| https://postgis.net/docs/manual-3.6/ST_DWithin.html, ST_Distance.html, ST_Intersects.html, ST_Contains.html | predicates and measurement |
| https://postgis.net/docs/manual-3.6/ST_MakePoint.html, ST_Transform.html | construction, reprojection |
| https://postgis.net/docs/manual-3.6/ST_Buffer.html, ST_Simplify.html, ST_AsGeoJSON.html | everyday ops |
| https://postgis.net/docs/manual-3.6/ST_ClusterDBSCAN.html, ST_ClusterKMeans.html | clustering |

## Data management [DOC]
- `geometry` is **planar** (Cartesian math). `geography` is on the **spheroid** (great-circle arcs); fewer functions; measurements in **metres**.
- geometry default SRID **0** (unknown/local Cartesian); geography default SRID **4326**. Geography accepts only lon/lat SRSs
  ("Only lon/lat coordinate systems are supported in geography").
- Choose geometry + suitable projection for data in a small area; geography for global/continental lon/lat data.
- Typmods: `geometry(LINESTRING,3005)`, `geography(POINT,4326)`; suffixes Z, M, ZM. Typmod columns register correctly in
  `geometry_columns` (a **view** over catalogs: f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, type).
- `spatial_ref_sys`: srid (PK), auth_name, auth_srid, srtext (WKT), proj4text. PROJ lookup uses auth_name/auth_srid first, then srtext, then proj4text.
- Formats: WKT (`ST_AsText`/`ST_GeomFromText`), WKB (`ST_AsBinary`), EWKT/EWKB add `SRID=n;` and Z/M. Canonical text output of a geometry is **HEXEWKB**.
- Geodetic coordinates are **longitude, latitude** (x, y); examples write `POINT(-110 30)`.
- Validity: polygon rings simple, non-crossing, holes inside shell, interior connected. "By default, PostGIS does not check for validity when loading geometry"; add `CHECK (ST_IsValid(geom))`.
  Functions: ST_IsSimple, ST_IsValid, ST_IsValidDetail/Reason, ST_MakeValid.

## Spatial indexes [DOC]
- Indexes store **bounding boxes** only: index = primary filter, exact predicate = secondary filter.
- **GiST** (default, R-tree-like) `USING GIST (geom)` → 2D; `gist_geometry_ops_nd` for n-D.
- **BRIN**: lossy, "only appropriate for … spatially sorted, with infrequent or no update" data; 2D operators `&&`, `~`, `@`; no KNN;
  default pages_per_range 128; new rows need VACUUM or `brin_summarize_new_values`.
- **SP-GiST**: space partitioning; 2D operators include `&&`, `@>`, `<@`, `~=`, `<<`, `>>`…; no KNN in the manual's list.
- An operator or index-aware function must be in WHERE/ON. Index-aware: ST_Contains, ST_ContainsProperly, ST_CoveredBy, ST_Covers,
  ST_Crosses, ST_Intersects, ST_Overlaps, ST_Touches, ST_Within, ST_3DIntersects, ST_DWithin, ST_DFullyWithin, ST_3DDWithin, ST_3DDFullyWithin.
- "Functions such as ST_Distance do not use indexes". ST_DWithin uses `&&` on an **expanded** bbox of the query geometry.
- Named predicates add the bbox test automatically; `_ST_Contains` etc. skip it.

## Operators [DOC]
- `&&`: 2D bboxes intersect; uses indexes; geography overload since 1.5.
- `~`: bbox of A contains bbox of B. `@`: bbox of A contained by bbox of B. Both index-aware.
- `<->`: 2D distance (geometry: SRID units; geography: metres on a **sphere**); index-assisted **only in ORDER BY** and only when one side is a constant
  (or a LATERAL outer parameter [RUN]). True KNN since PostGIS 2.2 / PG 9.5.
- `<#>`: distance between **bounding boxes**; approximate ordering; index only in ORDER BY with a constant.

## Functions [DOC]
- ST_MakePoint(x, y[, z[, m]]): no SRID (0); X = longitude. ST_Point(x, y, srid) sets it in one call.
- ST_Transform(g, srid) reprojects; input must have an SRID. ST_SetSRID only relabels, coordinates unchanged.
- ST_Distance(geometry): min 2D Cartesian distance in SRID units (degrees for 4326). geography: metres, `use_spheroid = true` default; false = faster sphere.
  Manual example: 3857 distance is inflated (167.44 vs 123.80 m true in Massachusetts).
- ST_DWithin(geom, geom, dist SRID units) / (geog, geog, metres, use_spheroid = true); includes index bbox test.
- ST_Intersects: any shared point; geography version on sphere with 0.00001 m tolerance; geometry via GEOS.
- ST_Contains(A,B): no point of B outside A and interiors intersect → polygon does **not** contain a point on its boundary; ST_Covers does. ST_Contains(A,B) = ST_Within(B,A).
- ST_Buffer: SRID units / metres for geography; 8 segments per quarter circle default; for proximity tests ST_DWithin is more efficient.
- ST_Simplify: Douglas-Peucker, tolerance in SRID units, may return invalid output; ST_SimplifyPreserveTopology keeps validity; ST_CoverageSimplify keeps shared edges.
- ST_AsGeoJSON(geom, maxdecimaldigits=9, options=8) or (record, …, id_column); RFC 7946 requires WGS84 → transform to 4326 first.
- ST_ClusterDBSCAN(geom, eps, minpoints) window function; core = ≥ minpoints within eps (incl. itself); border; noise → NULL; border assignment
  arbitrary when it touches two clusters (ORDER BY in window for repeatability).
- ST_ClusterKMeans(geom, k[, max_radius]) window function; centroid distance in 2D; max_radius since 3.2 may create more than k clusters.

## Performance tips [DOC]
- Large TOASTed geometries can make the planner pick seq scans; check with EXPLAIN ANALYZE; workaround cached `ST_Envelope` bbox column.
- CLUSTER on a GiST index needs `NOT NULL` geometry. Avoid needless ST_Force2D work by dropping extra dimensions once.

## Verified numbers [RUN]
- London (-0.1276 51.5072) – Paris (2.3522 48.8566): geometry 4326 = **3.6298** (degrees); geography spheroid **343.9 km**, sphere 343.5 km;
  3857 metres **537.3 km** (×1.56); EPSG:3035 (LAEA Europe) 344.3 km; lat/lon swapped 402.7 km (wrong points).
- London–New York: 74.66°, 5585.3 km spheroid, 5570.2 sphere, 8406.5 in 3857. Oslo–Helsinki: 14.19°, 789.6 km, 3857 1580.2 km (×2.0), 3035 790.6.
  Quito–Bogotá: 6.58°, 729.0 km, 3857 732.5 km (near equator), UTM 18N 729.1.
- 1°×1° cell area (geography / 3857), km²: lat 0: 12309/12393; 30: 10642/14382; 45: 8686/17681; 50: 7892/19483; 60: 6123/25168; 70: 4158/37131.
  1° of longitude: 111.3 km at the equator, 71.7 at 50°, 55.8 at 60°; 1° of latitude ≈ 110.6–111.6 km.
- Antimeridian: POINT(179.5 0)↔POINT(-179.5 0): geometry 359 (degrees), geography 111 319 m.
- `'SRID=4326;POINT(200 100)'::geography` is silently normalised to POINT(-160 80).
- typmod errors: "Geometry SRID (3857) does not match column SRID (4326)", "Geometry type (LineString) does not match column type (Point)";
  an SRID-0 point inserted into geometry(Point,4326) is accepted and gets SRID 4326.
- Bow-tie polygon: ST_IsValid false, reason `Self-intersection[1 1]`, ST_Area 0; ST_MakeValid → MULTIPOLYGON of two triangles.
- 20 000 points table (places): heap 171 pages (about 1.37 MB), GiST 864 kB, SP-GiST 968 kB, BRIN (pages_per_range 4) 24 kB.
- KNN `ORDER BY geom <-> point LIMIT 5`: Index Scan, Buffers 10. `<#>` also index-ordered.
- `ST_DWithin(geom::geography, …, 500)`: **Seq Scan**, 19 995 rows removed, 171 buffers. With `((geom::geography))` expression index:
  Bitmap Index Scan, `Index Cond: geom::geography && _st_expand(...)`, 14 buffers. `ST_DWithin(geom, …, 0.005)`: index cond `geom && st_expand(...)`.
- `ST_Distance(...) < 500`: Seq Scan always.
- KNN in degrees mis-ranks at lat 51.5: geometry 6th nearest = id 9976 (652.2 m), true 6th by geography = id 11179 (524.5 m).
- Geography KNN without a geography index: Seq Scan + Sort; with it: Index Scan.
- KNN against a joined column (`p.geom <-> r.geom` with r from FROM) is a Seq Scan + Sort; with CROSS JOIN LATERAL the inner Index Scan runs per outer row (Index Searches: 50).
- BRIN on unsorted points: lossy heap blocks 171 of 171 (19 981 rows removed by recheck); on a table built `ORDER BY geom`: 16 blocks.
- ST_HexagonGrid(1500, envelope 12×11 km in 27700) → 33 hexes of 5.85 km² each.
