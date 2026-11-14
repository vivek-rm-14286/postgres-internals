import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Tile } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the same two cities on three "rulers". The graticule morphs between the lon/lat plane
 * (what geometry in SRID 4326 measures on) and Web Mercator (SRID 3857). Geography mode draws the
 * great-circle arc. Every distance and area below was measured with PostGIS 3.6.2 / PROJ 9.7.
 * ---------------------------------------------------------------------------------------------- */

const CITIES: Record<string, [number, number]> = {
  London: [-0.1276, 51.5072], Paris: [2.3522, 48.8566], 'New York': [-74.006, 40.7128],
  Oslo: [10.7522, 59.9139], Helsinki: [24.9384, 60.1699], Quito: [-78.4678, -0.1807], 'Bogotá': [-74.0721, 4.711],
}
interface Pair { a: string; b: string; deg: number; km: number; sphere: number; merc: number; local?: [string, number]; swapped: number }
const PAIRS: Pair[] = [
  { a: 'London', b: 'Paris', deg: 3.6298, km: 343.9, sphere: 343.5, merc: 537.3, local: ['3035 (LAEA Europe)', 344.3], swapped: 402.7 },
  { a: 'Oslo', b: 'Helsinki', deg: 14.1885, km: 789.6, sphere: 786.7, merc: 1580.2, local: ['3035 (LAEA Europe)', 790.6], swapped: 1570.4 },
  { a: 'Quito', b: 'Bogotá', deg: 6.5765, km: 729.0, sphere: 730.9, merc: 732.5, local: ['32618 (UTM 18N)', 729.1], swapped: 507.1 },
  { a: 'London', b: 'New York', deg: 74.6628, km: 5585.3, sphere: 5570.2, merc: 8406.5, swapped: 8234.4 },
]
// 1° × 1° cell starting at each latitude: geography area and Web Mercator area (km²), one degree of longitude (km)
const CELLS: [number, number, number, number][] = [[0, 12309, 12393, 111.3], [30, 10642, 14382, 96.5], [45, 8686, 17681, 78.8], [60, 6123, 25168, 55.8], [70, 4158, 37131, 38.2]]

type Mode = 'geom' | 'merc' | 'geog'
const W = 560, H = 340
const LON0 = -100, LON1 = 65, LAT0 = -20, LAT1 = 72
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const proj = (m: Mode, lon: number, lat: number): [number, number] => {
  const x = ((lon - LON0) / (LON1 - LON0)) * W
  const la = Math.max(LAT0, Math.min(LAT1, lat))
  const y = m === 'merc' ? ((merc(LAT1) - merc(la)) / (merc(LAT1) - merc(LAT0))) * H : ((LAT1 - la) / (LAT1 - LAT0)) * H
  return [x, y]
}
const path = (m: Mode, pts: [number, number][]) => pts.map(([lo, la], i) => `${i ? 'L' : 'M'}${proj(m, lo, la).map((v) => v.toFixed(1)).join(' ')}`).join(' ')
const range = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))

/** Great-circle points between two lon/lat positions (spherical interpolation). */
function arc(a: [number, number], b: [number, number], n = 40): [number, number][] {
  const v = ([lo, la]: [number, number]) => { const l = (lo * Math.PI) / 180, p = (la * Math.PI) / 180; return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)] }
  const A = v(a), B = v(b)
  const om = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))
  return range(0, 1, n).map((t) => {
    const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om)
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2]
    return [(Math.atan2(y, x) * 180) / Math.PI, (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI]
  })
}
const line = (a: [number, number], b: [number, number]) => range(0, 1, 40).map((t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as [number, number])

function CoordViz() {
  const [mode, setMode] = useState<Mode>('geom')
  const [pi, setPi] = useState(0)
  const [swap, setSwap] = useState(false)
  const [cell, setCell] = useState(3)
  const pair = PAIRS[pi]
  const plane: Mode = mode === 'merc' ? 'merc' : 'geom'
  const at = (n: string): [number, number] => { const [lo, la] = CITIES[n]; return swap ? [la, lo] : [lo, la] }
  const A = at(pair.a), B = at(pair.b)
  const route = mode === 'geog' && !swap ? arc(A, B) : line(A, B)
  const offMap = (p: [number, number]) => p[0] < LON0 || p[0] > LON1 || p[1] < LAT0 || p[1] > LAT1
  const reading = swap
    ? { v: pair.swapped.toFixed(1), unit: 'km, between the wrong places', t: 'dead' as const }
    : mode === 'geom' ? { v: pair.deg.toFixed(4), unit: 'degrees (not km!)', t: 'dead' as const }
      : mode === 'merc' ? { v: pair.merc.toFixed(1), unit: `km, ×${(pair.merc / pair.km).toFixed(2)} too long`, t: 'new' as const }
        : { v: pair.km.toFixed(1), unit: 'km on the spheroid', t: 'ok' as const }
  const sql = mode === 'geog'
    ? `ST_Distance(a::geography, b::geography)`
    : mode === 'merc' ? `ST_Distance(ST_Transform(a, 3857), ST_Transform(b, 3857))` : `ST_Distance(a, b)  -- geometry(Point, 4326)`
  const [clat, carea, cmerc, cdeg] = CELLS[cell]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Measure with" value={mode} onChange={setMode}
          options={[['geom', 'geometry 4326'], ['merc', 'Web Mercator 3857'], ['geog', 'geography']]} />
        <button type="button" data-testid="viz-next" onClick={() => setPi((p) => (p + 1) % PAIRS.length)}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Next city pair</button>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={swap} onChange={(e) => setSwap(e.target.checked)} className="accent-[var(--accent)]" /> write (lat, lon) by mistake
        </label>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-bg p-1">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Graticule with two cities and the measured route">
            {range(-10, 70, 9).map((la) => (
              <g key={`la${la}`}>
                <motion.path initial={false} animate={{ d: path(plane, range(LON0, LON1, 12).map((lo) => [lo, la])) }} transition={{ duration: 0.7 }}
                  fill="none" stroke={la === 0 ? 'var(--muted)' : 'var(--border)'} strokeWidth={la === 0 ? 1 : 0.7} />
                <motion.text initial={false} animate={{ y: proj(plane, 0, la)[1] + 11 }} transition={{ duration: 0.7 }} x={3} fontSize={12} fill="var(--muted)" fontFamily="var(--font-mono)">{la}°</motion.text>
              </g>
            ))}
            {range(-100, 60, 9).map((lo) => (
              <g key={`lo${lo}`}>
                <motion.path initial={false} animate={{ d: path(plane, range(LAT0, LAT1, 16).map((la) => [lo, la])) }} transition={{ duration: 0.7 }}
                  fill="none" stroke={lo === 0 ? 'var(--muted)' : 'var(--border)'} strokeWidth={lo === 0 ? 1 : 0.7} />
                {lo > -100 && <text x={proj(plane, lo, 0)[0] + 2} y={H - 4} fontSize={12} fill="var(--muted)" fontFamily="var(--font-mono)">{lo}°</text>}
              </g>
            ))}
            {/* one 1° × 1° cell, drawn 10× larger so it stays visible */}
            <motion.path initial={false} animate={{ d: path(plane, [[-40, clat], [-30, clat], [-30, Math.min(LAT1, clat + 10)], [-40, Math.min(LAT1, clat + 10)], [-40, clat]]) }}
              transition={{ duration: 0.6 }} fill={toneBg('pointer', 22)} stroke="var(--c-pointer)" strokeWidth={1.2} />
            <motion.path key={`${pi}-${swap}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1, d: path(plane, route) }} transition={{ duration: 0.8 }}
              fill="none" stroke={tone(reading.t)} strokeWidth={2.4} strokeLinecap="round" />
            {[pair.a, pair.b].map((n, k) => {
              const p = k ? B : A
              const [x, y] = proj(plane, Math.max(LON0, Math.min(LON1, p[0])), p[1])
              return (
                <motion.g key={n} initial={false} animate={{ x, y }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
                  <circle r={5.5} fill={toneBg(swap ? 'dead' : 'accent', 55)} stroke={swap ? 'var(--c-dead)' : 'var(--accent)'} strokeWidth={1.6} />
                  <text x={(k && x < W - 90) || (!k && x < 90) ? 8 : -8} y={k ? 14 : -8} textAnchor={(k && x < W - 90) || (!k && x < 90) ? 'start' : 'end'} fontSize={14} fontWeight={600} fill="var(--text)">{n}{offMap(p) ? ' (off the map)' : ''}</text>
                </motion.g>
              )
            })}
          </svg>
        </div>

        <div className="grid content-start gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Tile label={`${pair.a} → ${pair.b}`} value={reading.v} t={reading.t} sub={reading.unit} />
            <Panel title="The SQL behind it"><code className="font-mono text-[11.5px] break-words">{swap ? `ST_Point(${CITIES[pair.a][1]}, ${CITIES[pair.a][0]}, 4326)  -- lat first: wrong` : sql}</code></Panel>
          </div>
          <Panel title="Every ruler, same pair">
            <table className="w-full font-mono text-[12px]">
              <tbody>
                {([['geometry 4326', `${pair.deg.toFixed(4)}°`, 'geom'], ['Web Mercator 3857', `${pair.merc.toFixed(1)} km`, 'merc'], ['geography (spheroid)', `${pair.km.toFixed(1)} km`, 'geog'],
                  ['geography (sphere)', `${pair.sphere.toFixed(1)} km`, ''], ...(pair.local ? [[`local SRID ${pair.local[0]}`, `${pair.local[1].toFixed(1)} km`, '']] : [])] as string[][]).map(([k, v, m]) => (
                  <tr key={k} className="border-b border-line last:border-0" style={m === mode && !swap ? { background: toneBg('accent', 14) } : undefined}>
                    <td className="py-1 pr-2 font-sans text-muted">{k}</td><td className="py-1 text-right font-semibold tabular-nums">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>

      <Panel title="The shaded cell: 1° × 1° starting at latitude">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Cell latitude" value={String(cell)} onChange={(v) => setCell(+v)} options={CELLS.map((c, i) => [String(i), `${c[0]}°`] as [string, string])} />
          <span className="text-xs text-muted">The drawn cell is 10° wide so you can see it; the numbers are for 1°.</span>
        </div>
        <div className="mt-2 grid gap-1.5">
          {([['geography', carea, 'ok'], ['3857 metres', cmerc, 'new']] as [string, number, 'ok' | 'new'][]).map(([k, v, t]) => (
            <div key={k} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-xs">
              <span className="font-mono text-muted">{k}</span>
              <div className="h-4 overflow-hidden rounded bg-surface-2">
                <motion.div className="h-full rounded" initial={false} animate={{ width: `${(100 * v) / 37131}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  style={{ background: toneBg(t, 55), borderRight: `2px solid ${tone(t)}` }} />
              </div>
              <span className="w-24 text-right font-mono font-semibold tabular-nums">{v.toLocaleString('en-US')} km²</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted"><Md>{`geometry 4326 says **1** (square degree) at every latitude. One degree of longitude is **${cdeg} km** here, one degree of latitude stays about 111 km. Mercator stretches both axes by 1/cos(latitude), so areas grow by its square.`}</Md></p>
      </Panel>
      <Legend items={[['ok', 'true distance (geography)'], ['new', 'Mercator: inflated'], ['dead', 'wrong unit or wrong place'], ['pointer', '1° × 1° cell']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const CITY_SQL = Object.entries(CITIES).map(([n, [lo, la]]) => `('${n === 'Bogotá' ? 'Bogota' : n}', ST_Point(${lo}, ${la}, 4326))`).join(',\n  ')

export const lesson: Lesson = {
  slug: 'spatial-basics',
  module: 'e4',
  order: 1,
  title: 'Geometry, geography and coordinate systems',
  tldr: [
    'PostGIS adds two spatial types to PostgreSQL: **geometry**, measured on a flat plane in the units of its coordinate system (its **SRID**), and **geography**, measured on the curved Earth in metres.',
    'A coordinate means nothing without its SRID, so picking the right type and coordinate system up front is what makes distances, areas and joins come out right.',
  ],
  visualizer: {
    title: 'One pair of cities, three rulers',
    caption: 'Switch the ruler and watch the grid morph from longitude/latitude to Web Mercator. **Next city pair** moves north and south; the checkbox shows what swapped coordinates do.',
    Component: CoordViz,
  },
  playground: {
    extensions: ['postgis'],
    setup: `
-- seven city centres typed in as points (longitude first!)
CREATE TABLE cities (
  name text PRIMARY KEY,
  geom geometry(Point, 4326) NOT NULL
);
INSERT INTO cities VALUES
  ${CITY_SQL};

-- runs a statement and returns its error text instead of failing
CREATE FUNCTION try_sql(stmt text) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE stmt;
  RETURN 'OK';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END $fn$;`,
    presets: [
      { label: 'Make a point', sql: `SELECT ST_AsText(geom)  AS wkt,
       ST_AsEWKT(geom)  AS ewkt,
       ST_SRID(geom)    AS srid,
       geom::text       AS hexewkb,
       ST_AsGeoJSON(geom) AS geojson,
       ST_SRID(ST_MakePoint(-0.1276, 51.5072)) AS makepoint_srid
FROM cities WHERE name = 'London';`,
        note: 'The same point in four encodings. The default text output is **HEXEWKB**. `ST_MakePoint` alone has SRID **0** (unknown); `ST_Point(x, y, 4326)` sets it in one call.' },
      { label: 'Coordinate systems', sql: `SELECT count(*) AS srids FROM spatial_ref_sys;

SELECT srid, auth_name, auth_srid, left(srtext, 48) AS definition
FROM spatial_ref_sys
WHERE srid IN (4326, 3857, 3035, 27700, 32618)
ORDER BY srid;`,
        note: '**8500** coordinate systems ship in `spatial_ref_sys`. 4326 is longitude/latitude on WGS 84, 3857 is Web Mercator, and 3035, 27700 and 32618 are local projections in metres.' },
      { label: 'Three rulers', sql: `SELECT ST_Distance(a.geom, b.geom)                         AS geometry_degrees,
       ST_Distance(a.geom::geography, b.geom::geography) / 1000 AS geography_km,
       ST_Length(ST_MakeLine(a.geom, b.geom)::geography) / 1000 AS line_length_km,
       ST_Distance(ST_Transform(a.geom, 3857), ST_Transform(b.geom, 3857)) / 1000 AS mercator_km,
       ST_Distance(ST_Transform(a.geom, 3035), ST_Transform(b.geom, 3035)) / 1000 AS laea_europe_km
FROM cities a, cities b
WHERE a.name = 'London' AND b.name = 'Paris';`,
        note: 'geometry in 4326 returns **3.63 degrees**. geography returns **343.9 km**. Web Mercator says 537 km, about 56% too long at this latitude. The local equal-area projection 3035 is within 0.5 km. `ST_Length` of the line between the two cities gives the same 343.9 km; `ST_Area` does the same job for polygons. For a local SRID, look up your country\'s grid or UTM zone in `spatial_ref_sys`.' },
      { label: 'Swap lat and lon', sql: `SELECT ST_AsText(ST_Point(51.5072, -0.1276, 4326)) AS swapped_london,
       ST_Distance(ST_Point(51.5072, -0.1276, 4326)::geography,
                   ST_Point(48.8566, 2.3522, 4326)::geography) / 1000 AS swapped_km,
       ST_AsText('SRID=4326;POINT(200 100)'::geography) AS out_of_range;`,
        note: 'Latitude first puts "London" in the Indian Ocean, and the distance comes out as **402.7 km**, with no error. Out-of-range geography input is silently wrapped to `POINT(-160 80)`.' },
      { label: 'Area by latitude', sql: `SELECT lat,
       ST_Area(cell)                                   AS square_degrees,
       round((ST_Area(cell::geography) / 1e6)::numeric) AS km2_true,
       round((ST_Area(ST_Transform(cell, 3857)) / 1e6)::numeric) AS km2_mercator
FROM unnest(ARRAY[0, 30, 45, 60, 70]) AS lat,
     LATERAL (SELECT ST_MakeEnvelope(0, lat, 1, lat + 1, 4326)) AS c(cell);`,
        note: 'A 1° × 1° cell is **1 square degree** everywhere, but its true area falls from 12 309 km² at the equator to 6 123 km² at 60°. Mercator grows it to 25 168 km².' },
      { label: 'Typmods guard the column', sql: `SELECT f_table_name, f_geometry_column, coord_dimension, srid, type
FROM geometry_columns;

SELECT s AS statement, try_sql(s) AS result FROM (VALUES
  ($$INSERT INTO cities VALUES ('X', 'SRID=3857;POINT(1 2)')$$),
  ($$INSERT INTO cities VALUES ('Y', 'SRID=4326;LINESTRING(0 0, 1 1)')$$),
  ($$INSERT INTO cities VALUES ('Z', ST_Transform(ST_Point(530043, 180358, 27700), 4326))$$)
) v(s);

-- tidy up, so the table keeps its seven cities
DELETE FROM cities WHERE name = 'Z';`,
        note: '`geometry(Point, 4326)` rejects a wrong SRID and a wrong shape. A point that really is in 27700 must be **transformed**, not relabelled; the third insert works and lands on London.' },
      { label: 'The antimeridian', sql: `SELECT ST_Distance('SRID=4326;POINT(179.5 0)'::geometry,
                   'SRID=4326;POINT(-179.5 0)'::geometry)   AS geometry_degrees,
       ST_Distance('SRID=4326;POINT(179.5 0)'::geography,
                   'SRID=4326;POINT(-179.5 0)'::geography) / 1000 AS geography_km;`,
        note: 'Two points 1° apart across the date line. The plane thinks they are **359 degrees** apart; geography knows the Earth is round and says **111 km**.' },
    ],
  },
  production: {
    title: 'A delivery app that measured in the wrong units',
    context: 'A delivery app stored courier and customer positions as `geometry(Point, 4326)` and charged a fee per kilometre. To get metres, a developer transformed both points to Web Mercator (3857) and called `ST_Distance`.',
    problem: 'Web Mercator stretches lengths by about 1/cos(latitude). At 51.5° N every distance came out about **1.6×** too long, so customers were overcharged. Moving the code to `ST_Distance(geom, geom)` in 4326 made it worse: the result was in **degrees**.',
    solution: 'Measure with **geography**, which works on the spheroid in metres. Store a geography column, or cast at query time. For heavy analysis in one city, transform once to a local projected SRID in metres.',
    sql: `ALTER TABLE deliveries
  ADD COLUMN route_geog geography(LineString, 4326)
  GENERATED ALWAYS AS (ST_MakeLine(pickup, dropoff)::geography) STORED;

SELECT id, ST_Length(route_geog) / 1000 AS km FROM deliveries;
-- for one city, a local metric projection is just as good:
SELECT ST_Distance(ST_Transform(pickup, 27700), ST_Transform(dropoff, 27700)) FROM deliveries;`,
    outcome: 'For London–Paris the three answers are 537.3 km (3857), 3.63 (degrees) and 343.9 km (geography). The fee now uses the 343.9 km kind of number, and the local projection agrees to within half a kilometre.',
  },
  pitfalls: [
    { title: 'Latitude written first',
      symptom: 'Points show up in the ocean or on the wrong continent, and distances are plausible but wrong. No error is raised.',
      cause: 'PostGIS coordinates are **x, y**, which for geodetic data means **longitude, latitude**. Many web APIs and spreadsheets write latitude first.',
      fix: 'Always pass longitude first to `ST_Point`/`ST_MakePoint`. Add a check constraint for your region to catch swaps.',
      sql: `ALTER TABLE shops ADD CONSTRAINT in_europe
  CHECK (ST_X(geom) BETWEEN -25 AND 45 AND ST_Y(geom) BETWEEN 34 AND 72);` },
    { title: 'Reading degrees as metres',
      symptom: '`ST_Distance` returns 0.0038 for two shops 266 m apart, or `ST_DWithin(geom, pt, 500)` matches the whole country.',
      cause: 'geometry in SRID 4326 measures on the lon/lat plane, so its unit is the **degree**. A degree of longitude is 111 km at the equator and 72 km at 50° N.',
      fix: 'Cast to geography for metres, or transform to a projected SRID whose unit is metres.',
      sql: `SELECT ST_DWithin(a.geom::geography, b.geom::geography, 500) FROM cities a, cities b;` },
    { title: 'ST_SetSRID where ST_Transform was needed',
      symptom: 'Points land within metres of 0° N 0° E (or of a national grid\'s origin), or `ST_Transform` fails with an invalid-coordinate error.',
      cause: '`ST_SetSRID` only **relabels** coordinates. `ST_Transform` **recomputes** them into another system. Labelling metres as 4326 makes impossible degrees; labelling degrees as a metre-based SRID puts every point a few metres from that system\'s origin.',
      fix: 'Set the SRID the data was really produced in, then transform.',
      sql: `SELECT ST_AsText(ST_Transform(ST_SetSRID(ST_MakePoint(530043, 180358), 27700), 4326));` },
    { title: 'Measuring in Web Mercator',
      symptom: 'Lengths and areas from tiles or map exports are 1.5–4× too large in northern cities.',
      cause: '3857 is made for drawing tiles, not for measuring. Its scale grows with latitude.',
      fix: 'Keep 3857 for display. Measure with geography or with a local equal-area or conformal projection.' },
  ],
  pointers: [
    '**geometry**: planar, units of its SRID, the richest function set. **geography**: spheroid, metres, the right default for lon/lat data spread over a wide area.',
    'Coordinates are **(x, y) = (longitude, latitude)**. `ST_Point(lon, lat, 4326)` builds a point with its SRID in one call.',
    '`ST_Transform` changes coordinates; `ST_SetSRID` only changes the label.',
    'Use typmods such as `geometry(Point, 4326)` so the column rejects the wrong SRID or shape; a typmod is one more column rule next to those in [Constraints and defaults](/f3/constraints-defaults).',
    'Next: how a spatial index answers "what is near here" in [Spatial indexes](/e4/spatial-indexes).',
  ],
  sources: ['using_postgis_dbmanagement.html', 'ST_Distance.html', 'ST_Transform.html', 'ST_MakePoint.html', 'ST_AsGeoJSON.html'],
}
