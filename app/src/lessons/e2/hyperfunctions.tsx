import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Code, EditionTag, Msg, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: four Toolkit hyperfunctions simulated on the playground's own data.
 *  - time_weight: LOCF / linear area under 8 irregular samples (08:00–08:58), average() per 30-min bucket,
 *    interpolated_average() with prev/next summaries, and rollup() across buckets.
 *  - candlestick_agg: 8 ticks build two 1-minute candles, then rollup() into one 2-minute candle.
 *  - uddsketch: three hourly sketches with max_error 0.05 (gamma = 1.05/0.95, key = ceil(log_gamma x),
 *    estimate = gamma^(key-1) * (1 + alpha), rank floor(n*q)+1, exactly as the Toolkit's udd-sketch crate);
 *    rollup() adds bucket counts.
 *  - counter_agg: a counter with two resets; a decrease means "reset to zero", so the increase is the new value.
 * Every number shown is also produced by the playground presets.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'tw' | 'ohlc' | 'pct' | 'ctr'
const STEPS: Record<Mode, number> = { tw: 11, ohlc: 9, pct: 6, ctr: 11 }
const f = (n: number | null, d = 3) => (n === null || !Number.isFinite(n) ? 'NULL' : n.toFixed(d))
const hm = (min: number, base = 8) => `${String(base + Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

/* ---------- time_weight ---------- */
const TW: { t: number; v: number }[] = [
  { t: 0, v: 20 }, { t: 15, v: 22 }, { t: 25, v: 21 }, { t: 32, v: 35 }, { t: 33, v: 34 }, { t: 34, v: 22 }, { t: 50, v: 23 }, { t: 58, v: 24 },
]
type Method = 'locf' | 'linear'
interface Seg { x1: number; y1: number; x2: number; y2: number; t: Tone; counted: boolean; b: 0 | 1 | 2 }
const segArea = (s: Seg, m: Method) => (s.x2 - s.x1) * (m === 'locf' ? s.y1 : (s.y1 + s.y2) / 2)
const segsBetween = (pts: { t: number; v: number }[], t: Tone, b: 0 | 1 | 2): Seg[] =>
  pts.slice(1).map((p, i) => ({ x1: pts[i].t, y1: pts[i].v, x2: p.t, y2: p.v, t, counted: true, b }))
const B1 = TW.filter((p) => p.t < 30), B2 = TW.filter((p) => p.t >= 30)
const at30 = (m: Method) => (m === 'locf' ? 21 : 21 + ((35 - 21) * (30 - 25)) / (32 - 25)) // value carried / interpolated to 08:30

function twView(step: number, m: Method) {
  if (step < 8) return { segs: segsBetween(TW.slice(0, step + 1), 'tuple', 0), shown: step + 1 }
  if (step === 8) return {
    shown: 8,
    segs: [...segsBetween(B1, 'tuple', 1), { x1: 25, y1: 21, x2: 32, y2: 35, t: 'dead' as Tone, counted: false, b: 0 as const }, ...segsBetween(B2, 'header', 2)],
  }
  if (step === 9) {
    const v30 = at30(m)
    const s1 = [...segsBetween(B1, 'tuple', 1), { x1: 25, y1: 21, x2: 30, y2: v30, t: 'tuple' as Tone, counted: true, b: 1 as const }]
    const s2 = [{ x1: 30, y1: v30, x2: 32, y2: 35, t: 'header' as Tone, counted: true, b: 2 as const }, ...segsBetween(B2, 'header', 2)]
    if (m === 'locf') s2.push({ x1: 58, y1: 24, x2: 60, y2: 24, t: 'header', counted: true, b: 2 })
    return { shown: 8, segs: [...s1, ...s2] }
  }
  return { shown: 8, segs: segsBetween(TW, 'ok', 0) }
}
const span = (segs: Seg[]) => (segs.length ? segs[segs.length - 1].x2 - segs[0].x1 : 0)
const avgOf = (segs: Seg[], m: Method) => (span(segs) > 0 ? segs.reduce((a, s) => a + segArea(s, m), 0) / span(segs) : null)

function TimeWeight({ step }: { step: number }) {
  const [m, setM] = useState<Method>('locf')
  const view = twView(step, m)
  const X = (t: number) => 60 + t * 9.3, Y = (v: number) => 196 - (v - 15) * 6.6, BASE = Y(15)
  const counted = (step === 10 ? twView(8, m) : view).segs.filter((s) => s.counted) // rollup step: show the bucket values it replaces
  const b1 = counted.filter((s) => s.b === 1), b2 = counted.filter((s) => s.b === 2)
  const pts = TW.slice(0, view.shown)
  const naive = pts.reduce((a, p) => a + p.v, 0) / pts.length
  const whole = avgOf(segsBetween(TW, 'ok', 0), m)
  const a1 = avgOf(b1, m), a2 = avgOf(b2, m)
  const meanOfBuckets = a1 !== null && a2 !== null ? (a1 + a2) / 2 : null
  const fn = m === 'locf' ? "'LOCF'" : "'linear'"
  const msgs = [
    'One reading, **20** at 08:00. `avg()` is 20, but `average(time_weight(...))` is **NULL**: a single point covers no time.',
    'The sensor reports every 15 minutes. Each value now weighs as much as the **time it lasted**.',
    'A reading after 10 minutes. The shaded area is the **integral**: value × minutes.',
    'A spike: the sensor reports **35** at 08:32, the moment the value jumps.',
    'It keeps reporting while the value moves. Three readings in three minutes.',
    'Back to 22 at 08:34. `avg()` already gives the 2-minute spike **2 of 6** votes.',
    'Quiet again: one reading at 08:50 for the next 16 minutes.',
    `All 8 readings. \`avg()\` = **${f(naive)}**, the ${m === 'locf' ? 'LOCF' : 'linear'} time-weighted average = **${f(whole)}**. The spike holds 2 of 8 samples but only 2 of 58 minutes.`,
    `Bucket by 30 minutes. \`average()\` only integrates between each bucket's **first and last point**: 08:25 → 08:32 (red) belongs to neither bucket.`,
    `\`interpolated_average(tws, bucket, '30 min', LAG(tws), LEAD(tws))\` fills the edges: the value at 08:30 is **${f(at30(m), 0)}**, ${m === 'locf' ? 'carried over from the previous bucket' : 'interpolated between 08:25 and 08:32'}, and ${m === 'locf' ? 'with LOCF and no next bucket the last value is carried to 09:00' : 'with linear and no next bucket the interval ends at the last point'}.`,
    `\`rollup(tws)\` merges the two summaries and adds the area between them. Rolled up: **${f(whole)}**. Averaging the two bucket averages gives ${f(meanOfBuckets)}.`,
  ]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Interpolation method" value={m} onChange={setM} options={[['locf', "'LOCF'"], ['linear', "'linear'"]]} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {step < 8 ? <>
          <Stat label="avg() of samples" value={f(naive)} t="dead" />
          <Stat label="average(time_weight)" value={f(avgOf(view.segs, m))} t="ok" />
          <Stat label="integral (value·min)" value={f(view.segs.reduce((a, s) => a + segArea(s, m), 0), 1)} />
          <Stat label="samples" value={view.shown} />
        </> : <>
          <Stat label="08:00 bucket" value={f(a1)} t="tuple" />
          <Stat label="08:30 bucket" value={f(a2)} t="header" />
          <Stat label="avg of bucket values" value={f(meanOfBuckets)} t="dead" />
          <Stat label="rollup → average" value={f(whole)} t="ok" />
        </>}
      </div>
      <Msg id={`tw${step}${m}`}><Md>{msgs[step]}</Md></Msg>
      <Legend items={[['tuple', step >= 8 ? '08:00 bucket' : 'area counted'], ['header', '08:30 bucket'], ['dead', 'not counted'], ['ok', 'rolled up'], ['accent', 'sample']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 230" className="w-full min-w-[540px]" role="img" aria-label="Area under an irregular series of temperature readings">
          {[20, 25, 30, 35].map((v) => (
            <g key={v}>
              <line x1={56} x2={624} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={50} y={Y(v) + 3} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{v}</text>
            </g>
          ))}
          {[0, 15, 30, 45, 60].map((t) => (
            <text key={t} x={X(t)} y={216} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{hm(t)}</text>
          ))}
          <line x1={56} x2={624} y1={BASE} y2={BASE} stroke="var(--muted)" />
          {view.segs.map((s, i) => {
            const xm = m === 'locf' ? s.x2 : (s.x1 + s.x2) / 2, ym = m === 'locf' ? s.y1 : (s.y1 + s.y2) / 2
            const d = `M ${X(s.x1)} ${BASE} L ${X(s.x1)} ${Y(s.y1)} L ${X(xm)} ${Y(ym)} L ${X(s.x2)} ${m === 'locf' ? Y(s.y1) : Y(s.y2)} L ${X(s.x2)} ${BASE} Z`
            return (
              <motion.path key={`${step >= 8 ? step : 0}-${i}`} initial={{ opacity: 0 }} animate={{ d, opacity: 1, fill: s.counted ? toneBg(s.t, 30) : toneBg('dead', 10) }}
                transition={{ type: 'spring', stiffness: 170, damping: 22 }}
                stroke={tone(s.t)} strokeWidth={s.counted ? 1.2 : 1.5} strokeDasharray={s.counted ? undefined : '4 3'} />
            )
          })}
          {step >= 8 && step <= 9 && <line x1={X(30)} x2={X(30)} y1={20} y2={BASE} stroke={tone('pointer')} strokeWidth={1.5} strokeDasharray="5 3" />}
          {step >= 8 && step <= 9 && <text x={X(30)} y={16} textAnchor="middle" fontSize={10} fill={tone('pointer')} fontFamily="var(--font-mono)">bucket edge 08:30</text>}
          {pts.map((p, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${X(p.t)}px ${Y(p.v)}px` }}>
              <circle cx={X(p.t)} cy={Y(p.v)} r={4} fill={tone('accent')} />
              <text x={X(p.t) + (p.t === 33 ? 0 : p.t === 32 ? -8 : 7)} y={Y(p.v) - 7} textAnchor={p.t === 32 ? 'end' : 'start'} fontSize={10} fill="var(--text)" fontFamily="var(--font-mono)">{p.v}</text>
            </motion.g>
          ))}
          {step < 8 && <motion.line initial={false} animate={{ y1: Y(naive), y2: Y(naive) }} x1={56} x2={624} stroke={tone('dead')} strokeWidth={1.5} strokeDasharray="6 3" />}
          {step < 8 && <motion.text initial={false} animate={{ y: Y(naive) - 4 }} x={64} textAnchor="start" fontSize={10} fill={tone('dead')} fontFamily="var(--font-mono)">avg() {f(naive, 2)}</motion.text>}
        </svg>
      </div>
      <Panel title="Toolkit SQL being simulated">
        <Code>{step < 8 ? `SELECT avg(val)                             AS naive,
       average(time_weight(${fn}, ts, val))   AS time_weighted,
       integral(time_weight(${fn}, ts, val), 'minute')
FROM readings WHERE sensor_id = 1;` : step === 8 ? `SELECT time_bucket('30 min', ts) AS bucket,
       average(time_weight(${fn}, ts, val))
FROM readings GROUP BY bucket;` : step === 9 ? `SELECT bucket, interpolated_average(tws, bucket, '30 min',
         LAG(tws)  OVER (ORDER BY bucket),
         LEAD(tws) OVER (ORDER BY bucket))
FROM (SELECT time_bucket('30 min', ts) AS bucket,
             time_weight(${fn}, ts, val) AS tws
      FROM readings GROUP BY bucket) t;` : `SELECT average(rollup(tws)) FROM readings_30m;   -- summaries stored per bucket`}</Code>
        <p className="mt-2"><EditionTag ed="community" /></p>
      </Panel>
    </div>
  )
}

/* ---------- candlestick_agg ---------- */
const TICKS: { s: number; p: number; v: number }[] = [
  { s: 5, p: 100.0, v: 10 }, { s: 12, p: 101.5, v: 5 }, { s: 31, p: 99.2, v: 20 }, { s: 48, p: 100.4, v: 8 },
  { s: 63, p: 100.6, v: 12 }, { s: 80, p: 102.3, v: 6 }, { s: 99, p: 101.1, v: 15 }, { s: 115, p: 101.8, v: 9 },
]
interface Candle { open: number; openS: number; high: number; low: number; close: number; closeS: number; volume: number; pv: number }
function candleOf(ts: typeof TICKS): Candle | null {
  if (!ts.length) return null
  return {
    open: ts[0].p, openS: ts[0].s, close: ts[ts.length - 1].p, closeS: ts[ts.length - 1].s,
    high: Math.max(...ts.map((t) => t.p)), low: Math.min(...ts.map((t) => t.p)),
    volume: ts.reduce((a, t) => a + t.v, 0), pv: ts.reduce((a, t) => a + t.p * t.v, 0),
  }
}
const rollupCandles = (a: Candle, b: Candle): Candle => ({
  open: a.openS <= b.openS ? a.open : b.open, openS: Math.min(a.openS, b.openS),
  close: a.closeS >= b.closeS ? a.close : b.close, closeS: Math.max(a.closeS, b.closeS),
  high: Math.max(a.high, b.high), low: Math.min(a.low, b.low), volume: a.volume + b.volume, pv: a.pv + b.pv,
})

function Candlestick({ step }: { step: number }) {
  const shown = TICKS.slice(0, Math.min(step + 1, 8))
  const c1 = candleOf(shown.filter((t) => t.s < 60)), c2 = candleOf(shown.filter((t) => t.s >= 60))
  const roll = step === 8 && c1 && c2 ? rollupCandles(c1, c2) : null
  const cur = roll ?? (shown[shown.length - 1].s >= 60 ? c2 : c1)!
  const last = shown[shown.length - 1]
  const X = (s: number) => 56 + s * 2.85, Y = (p: number) => 200 - (p - 98.6) * 46
  const msgs = [
    'The first tick at 14:30:05 opens the candle: **open = high = low = close = 100.0**.',
    'A higher price: **high** moves to 101.5 and **close** follows the latest tick.',
    'A lower price with the largest volume: **low** = 99.2. VWAP leans toward it because 20 shares traded there.',
    'The last tick of the minute sets **close** = 100.4. Minute one: 43 shares, VWAP 99.8767.',
    'A new `time_bucket`, a new aggregate: the 14:31 candle opens at 100.6.',
    '102.3 is the new high of the second candle.',
    'Close moves to 101.1. `high_time()` remembers when 102.3 traded.',
    'Minute two is complete: open 100.6, high 102.3, low 100.6, close 101.8, 42 shares, VWAP 101.2786.',
    '`rollup()` merges the two candles: open from the earliest open, close from the latest close, max of highs, min of lows, summed volume and summed price × volume. VWAP **100.5694**, while averaging the two VWAPs gives 100.5777.',
  ]
  const drawCandle = (c: Candle, x: number, w: number, key: string, t?: Tone) => {
    const up = c.close >= c.open, tt: Tone = t ?? (up ? 'ok' : 'dead')
    const vw = c.pv / c.volume
    return (
      <motion.g key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.line initial={false} animate={{ y1: Y(c.high), y2: Y(c.low) }} x1={x} x2={x} stroke={tone(tt)} strokeWidth={2} />
        <motion.rect initial={false} animate={{ y: Y(Math.max(c.open, c.close)), height: Math.max(2, Math.abs(Y(c.open) - Y(c.close))) }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }} x={x - w / 2} width={w} rx={2} fill={toneBg(tt, 40)} stroke={tone(tt)} strokeWidth={1.5} />
        <motion.line initial={false} animate={{ y1: Y(vw), y2: Y(vw) }} x1={x - w / 2 - 5} x2={x + w / 2 + 5} stroke={tone('accent')} strokeWidth={2} strokeDasharray="3 2" />
      </motion.g>
    )
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="open()" value={cur.open.toFixed(1)} />
        <Stat label="high()" value={cur.high.toFixed(1)} t="ok" />
        <Stat label="low()" value={cur.low.toFixed(1)} t="dead" />
        <Stat label="close()" value={cur.close.toFixed(1)} />
        <Stat label="volume()" value={cur.volume} />
        <Stat label="vwap()" value={(cur.pv / cur.volume).toFixed(4)} t="accent" />
      </div>
      <Msg id={`oh${step}`}><Md>{msgs[step]}</Md></Msg>
      <Legend items={[['ok', 'close ≥ open'], ['dead', 'close < open'], ['accent', 'VWAP'], ['header', 'rolled-up candle']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 230" className="w-full min-w-[540px]" role="img" aria-label="Ticks building one-minute candles">
          {[99, 100, 101, 102].map((p) => (
            <g key={p}>
              <line x1={52} x2={630} y1={Y(p)} y2={Y(p)} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={46} y={Y(p) + 3} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{p}</text>
            </g>
          ))}
          <line x1={X(60)} x2={X(60)} y1={18} y2={206} stroke={tone('pointer')} strokeDasharray="5 3" />
          {[[0, '14:30:00'], [60, '14:31:00'], [120, '14:32:00']].map(([s, l]) => (
            <text key={l} x={X(+s)} y={220} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{l}</text>
          ))}
          <text x={X(30)} y={14} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">ticks (dot size = volume)</text>
          {shown.map((t, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${X(t.s)}px ${Y(t.p)}px` }}>
              <circle cx={X(t.s)} cy={Y(t.p)} r={2.5 + Math.sqrt(t.v) * 1.3} fill={toneBg('accent', t === last && step < 8 ? 70 : 30)} stroke={tone('accent')} />
              <text x={X(t.s)} y={Y(t.p) - 9 - Math.sqrt(t.v)} textAnchor="middle" fontSize={9.5} fill="var(--text)" fontFamily="var(--font-mono)">{t.p.toFixed(1)}×{t.v}</text>
            </motion.g>
          ))}
          <line x1={408} x2={408} y1={18} y2={206} stroke="var(--border)" />
          {[[460, '14:30'], [520, '14:31'], [596, 'rollup 2 min']].map(([x, l]) => (
            <text key={l} x={+x} y={220} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{l}</text>
          ))}
          <text x={520} y={14} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">candles</text>
          {c1 && drawCandle(c1, 460, 22, 'c1')}
          {c2 && drawCandle(c2, 520, 22, 'c2')}
          <AnimatePresence>{roll && drawCandle(roll, 596, 30, 'roll', 'header')}</AnimatePresence>
        </svg>
      </div>
      <Panel title="Toolkit SQL being simulated">
        <Code>{step < 8 ? `SELECT time_bucket('1 minute', ts) AS minute,
       open(c), high(c), low(c), close(c), volume(c), vwap(c)
FROM (SELECT ts, candlestick_agg(ts, price, volume) AS c
      FROM ticks WHERE symbol = 'ACME'
      GROUP BY time_bucket('1 minute', ts)) t;` : `-- candles_1m stores candlestick_agg(ts, price, volume) per minute
SELECT time_bucket('2 minutes', minute) AS bucket,
       open(rollup(c)), high(rollup(c)), low(rollup(c)),
       close(rollup(c)), volume(rollup(c)), vwap(rollup(c))
FROM candles_1m GROUP BY bucket;`}</Code>
        <p className="mt-2"><EditionTag ed="community" /></p>
      </Panel>
    </div>
  )
}

/* ---------- uddsketch ---------- */
const ALPHA = 0.05, GAMMA = (1 + ALPHA) / (1 - ALPHA)
const keyOf = (x: number) => Math.ceil(Math.log(x) / Math.log(GAMMA))
const valOf = (k: number) => Math.pow(GAMMA, k - 1) * (1 + ALPHA)
const HOURS: { label: string; vals: number[] }[] = [
  { label: '10:00', vals: Array.from({ length: 400 }, (_, i) => 20 + ((i * 37) % 41)) },
  { label: '11:00', vals: Array.from({ length: 20 }, (_, i) => 200 + ((i * 53) % 700)) },
  { label: '12:00', vals: Array.from({ length: 200 }, (_, i) => 25 + ((i * 29) % 56)) },
]
type Sketch = Map<number, number>
const sketchOf = (vals: number[]): Sketch => { const m: Sketch = new Map(); vals.forEach((v) => m.set(keyOf(v), (m.get(keyOf(v)) ?? 0) + 1)); return m }
const merge = (ss: Sketch[]): Sketch => { const m: Sketch = new Map(); ss.forEach((s) => s.forEach((n, k) => m.set(k, (m.get(k) ?? 0) + n))); return m }
/** bucket key holding the floor(n*q)+1-th value, as the Toolkit's estimate_quantile walks it */
function approxKey(s: Sketch, q: number) {
  const keys = [...s.keys()].sort((a, b) => a - b), n = [...s.values()].reduce((a, b) => a + b, 0)
  let remaining = Math.floor(n * q) + 1
  if (remaining >= n) return keys[keys.length - 1]
  for (const k of keys) { const c = s.get(k)!; if (remaining <= c) return k; remaining -= c }
  return keys[keys.length - 1]
}
const approxPct = (s: Sketch, q: number) => valOf(approxKey(s, q))
function percentileCont(vals: number[], q: number) {
  const s = vals.slice().sort((a, b) => a - b), pos = q * (s.length - 1), lo = Math.floor(pos)
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo)
}
const SK = HOURS.map((h) => sketchOf(h.vals))
const MERGED = merge(SK)
const ALL = HOURS.flatMap((h) => h.vals)
const KMIN = Math.min(...MERGED.keys()), KMAX = Math.max(...MERGED.keys())
const RANKED = ALL.slice().sort((a, b) => a - b)[Math.floor(ALL.length * 0.95)] // the floor(n*q)+1-th value

function Percentiles({ step }: { step: number }) {
  const X = (k: number) => 82 + ((k - KMIN) / (KMAX - KMIN + 1)) * 540
  const BW = 540 / (KMAX - KMIN + 1)
  const posOf = (x: number) => X(Math.log(x) / Math.log(GAMMA)) + BW // bucket k spans X(k)..X(k)+BW for (γ^(k-1), γ^k]
  const maxC = Math.max(...MERGED.values())
  const H = (c: number) => (34 * Math.log(1 + c)) / Math.log(1 + maxC)
  const est = SK.map((s) => approxPct(s, 0.95))
  const avgEst = (est[0] + est[1] + est[2]) / 3
  const mergedP95 = approxPct(MERGED, 0.95), exact = percentileCont(ALL, 0.95)
  const rows: { label: string; s: Sketch; show: boolean; t: Tone; p95: number; k: number }[] = [
    ...HOURS.map((h, i) => ({ label: h.label, s: SK[i], show: step >= i, t: 'tuple' as Tone, p95: est[i], k: approxKey(SK[i], 0.95) })),
    { label: 'rollup', s: MERGED, show: step >= 4, t: 'ok', p95: mergedP95, k: approxKey(MERGED, 0.95) },
  ]
  const msgs = [
    `10:00, a quiet hour: **400** requests of 20–60 ms. In this model of a UddSketch, each value lands in bucket ⌈log_γ x⌉ with γ = 1.05/0.95. The sketch keeps **${SK[0].size} bucket counts**, not 400 values.`,
    `11:00, an incident: only **20** requests, all 200–899 ms. Its p95 estimate is ${est[1].toFixed(1)} ms.`,
    `12:00, a busy hour: **200** requests of 25–80 ms, ${SK[2].size} buckets.`,
    `Averaging the three hourly p95s gives **${avgEst.toFixed(1)} ms**. The incident hour weighs as much as the other two, although it served 3% of the requests.`,
    `\`rollup()\` adds the counts bucket by bucket. The merged sketch has ${MERGED.size} buckets and the **same keys** it would have had from raw data, so its p95 is **${mergedP95.toFixed(2)} ms**.`,
    `The exact p95 over all 620 values is **${exact.toFixed(2)} ms**. The sketch is within ${(Math.abs(mergedP95 - RANKED) / RANKED * 100).toFixed(1)}% of the 590th smallest value (${RANKED}), inside the 5% bound that \`error()\` reports.`,
  ]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="avg of hourly p95" value={step >= 3 ? `${avgEst.toFixed(1)}` : '–'} t="dead" sub="ms, wrong" />
        <Stat label="rollup → p95" value={step >= 4 ? mergedP95.toFixed(2) : '–'} t="ok" sub="ms" />
        <Stat label="exact percentile_cont" value={step >= 5 ? exact.toFixed(2) : '–'} sub="ms" />
        <Stat label="stored per hour" value={`${SK[0].size} / ${SK[1].size} / ${SK[2].size}`} sub="bucket counts" />
      </div>
      <Msg id={`pc${step}`}><Md>{msgs[step]}</Md></Msg>
      <Legend items={[['tuple', 'hourly sketch'], ['ok', 'merged sketch'], ['dead', 'p95 estimate'], ['accent', 'exact p95']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 262" className="w-full min-w-[560px]" role="img" aria-label="Log-bucket sketches per hour and their merge">
          {rows.map((r, ri) => {
            const base = 50 + ri * 52
            return (
              <g key={r.label}>
                <text x={6} y={base - 8} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{r.label}</text>
                <line x1={80} x2={626} y1={base} y2={base} stroke="var(--border)" />
                {r.show && [...r.s.entries()].map(([k, c]) => (
                  <motion.rect key={k} initial={{ height: 0, y: base }} animate={{ height: H(c), y: base - H(c) }} transition={{ type: 'spring', stiffness: 180, damping: 20, delay: ri === 3 ? 0.15 : 0 }}
                    x={X(k) + 0.6} width={BW - 1.2} rx={1} fill={toneBg(r.t, 45)} stroke={tone(r.t)} strokeWidth={0.6} />
                ))}
                {r.show && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <line x1={X(r.k) + BW / 2} x2={X(r.k) + BW / 2} y1={base - 40} y2={base + 2} stroke={tone('dead')} strokeWidth={1.5} />
                    <text x={X(r.k) + BW / 2 + (X(r.k) > 520 ? -4 : 4)} textAnchor={X(r.k) > 520 ? 'end' : 'start'} y={base - 32} fontSize={9.5} fill={tone('dead')} fontFamily="var(--font-mono)">p95 ≈ {r.p95.toFixed(1)}</text>
                  </motion.g>
                )}
                {ri === 3 && step >= 5 && (
                  <motion.line initial={{ opacity: 0 }} animate={{ opacity: 1 }} x1={posOf(exact)} x2={posOf(exact)}
                    y1={base - 40} y2={base + 2} stroke={tone('accent')} strokeWidth={1.5} strokeDasharray="3 2" />
                )}
              </g>
            )
          })}
          {[20, 50, 100, 200, 500, 900].map((ms) => (
            <g key={ms}>
              <line x1={posOf(ms)} x2={posOf(ms)} y1={210} y2={214} stroke="var(--muted)" />
              <text x={posOf(ms)} y={226} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{ms} ms</text>
            </g>
          ))}
          <text x={82} y={248} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">log-spaced buckets, each ±5% wide · bar height = log(count) · {MERGED.size} merged buckets for 620 values</text>
          {step === 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <line x1={posOf(avgEst)} x2={posOf(avgEst)} y1={10} y2={206} stroke={tone('dead')} strokeWidth={2} strokeDasharray="6 3" />
              <text x={posOf(avgEst) - 4} y={18} textAnchor="end" fontSize={10} fill={tone('dead')} fontFamily="var(--font-mono)">avg of p95s {avgEst.toFixed(1)}</text>
            </motion.g>
          )}
        </svg>
      </div>
      <Panel title="Toolkit SQL being simulated">
        <Code>{step < 3 ? `CREATE MATERIALIZED VIEW latency_hourly WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) AS hour,
       uddsketch(200, 0.05, ms) AS sketch     -- percentile_agg(ms) = uddsketch(200, 0.001, ms)
FROM requests GROUP BY hour;` : step === 3 ? `-- wrong: a percentile of percentiles
SELECT avg(approx_percentile(0.95, sketch)) FROM latency_hourly;` : `SELECT approx_percentile(0.95, rollup(sketch))      AS p95,
       approx_percentile_rank(100, rollup(sketch)) AS share_under_100ms,
       error(rollup(sketch))                        AS max_rel_error
FROM latency_hourly;`}</Code>
        <p className="mt-2"><EditionTag ed="community" /></p>
      </Panel>
    </div>
  )
}

/* ---------- counter_agg ---------- */
const CT: { t: number; v: number }[] = [
  { t: 0, v: 100 }, { t: 10, v: 160 }, { t: 20, v: 230 }, { t: 25, v: 15 }, { t: 30, v: 40 }, { t: 40, v: 110 }, { t: 50, v: 30 }, { t: 58, v: 70 },
]
const inc = CT.map((p, i) => (i === 0 ? 0 : p.v < CT[i - 1].v ? p.v : p.v - CT[i - 1].v))
const adj = CT.map((_, i) => CT[0].v + inc.slice(0, i + 1).reduce((a, b) => a + b, 0))

function Counter({ step }: { step: number }) {
  const shown = CT.slice(0, Math.min(step + 1, 8))
  const X = (t: number) => 60 + t * 9.3, Y = (v: number) => 196 - v * 0.42
  const resets = shown.filter((p, i) => i > 0 && p.v < shown[i - 1].v).length
  const corrected = step >= 8
  const delta = adj[shown.length - 1] - CT[0].v
  const naive = shown[shown.length - 1].v - shown[0].v
  const b1 = inc.slice(1, 4).reduce((a, b) => a + b, 0), b2 = inc.slice(5, 8).reduce((a, b) => a + b, 0)
  const msgs = [
    'The first scrape: the counter reads **100** requests since the process started.',
    '160: 60 more requests.',
    '230: 70 more.',
    'The service restarted. The counter **dropped to 15**. A decrease means a reset to zero, so the increase is 15, not −215.',
    '40: 25 more since the last scrape.',
    '110: 70 more.',
    'A second restart: **30**. Another reset.',
    `All scrapes. last − first = **${naive}** and max − min = ${Math.max(...CT.map((p) => p.v)) - Math.min(...CT.map((p) => p.v))}: both wrong.`,
    '`counter_agg` adds the value before each reset back in. The corrected series ends at **410**, so `delta()` = **310** and `rate()` = 310 / 3480 s = **0.0891/s**.',
    `Per 30-minute bucket: \`delta()\` = **${b1}** and **${b2}**. Their sum is ${b1 + b2}: the 25 requests between 09:25 and 09:30 fall between two summaries.`,
    '`delta(rollup(cs))` joins the buckets: the last point of one and the first of the next restore the missing **25**. Total **310** again.',
  ]
  const path = (vals: number[]) => vals.slice(0, shown.length).map((v, i) => `${i ? 'L' : 'M'} ${X(CT[i].t)} ${Y(v)}`).join(' ')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="last − first (raw)" value={naive} t="dead" />
        <Stat label="delta()" value={corrected ? delta : '–'} t="ok" />
        <Stat label="num_resets()" value={resets} t={resets ? 'new' : undefined} />
        <Stat label={step >= 9 ? 'sum of bucket deltas' : 'rate() per s'} value={step >= 9 ? b1 + b2 : corrected ? (delta / 3480).toFixed(4) : '–'} t={step >= 9 ? 'dead' : undefined} />
      </div>
      <Msg id={`ct${step}`}><Md>{msgs[step]}</Md></Msg>
      <Legend items={[['muted', 'raw counter'], ['new', 'reset detected'], ['ok', 'reset-corrected'], ['dead', 'lost between buckets'], ['tuple', 'bucket delta']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 230" className="w-full min-w-[540px]" role="img" aria-label="A counter with resets and its corrected series">
          {[0, 100, 200, 300, 400].map((v) => (
            <g key={v}>
              <line x1={56} x2={624} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={50} y={Y(v) + 3} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{v}</text>
            </g>
          ))}
          {[0, 15, 30, 45, 60].map((t) => (
            <text key={t} x={X(t)} y={216} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{hm(t, 9)}</text>
          ))}
          {step >= 9 && <>
            <line x1={X(30)} x2={X(30)} y1={14} y2={198} stroke={tone('pointer')} strokeDasharray="5 3" />
            <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={X(25)} y={14} width={X(30) - X(25)} height={184} fill={toneBg(step === 9 ? 'dead' : 'ok', 18)} />
            <text x={X(27.5)} y={12} textAnchor="middle" fontSize={9.5} fill={tone(step === 9 ? 'dead' : 'ok')} fontFamily="var(--font-mono)">{step === 9 ? '+25 lost' : '+25 restored'}</text>
            <text x={X(12.5)} y={26} textAnchor="middle" fontSize={10} fill={tone('tuple')} fontFamily="var(--font-mono)">09:00 bucket: delta {b1}</text>
            <text x={X(45)} y={26} textAnchor="middle" fontSize={10} fill={tone('tuple')} fontFamily="var(--font-mono)">09:30 bucket: delta {b2}</text>
          </>}
          <motion.path initial={false} animate={{ d: path(CT.map((p) => p.v)) }} fill="none" stroke="var(--muted)" strokeWidth={1.5} />
          {corrected && <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} d={path(adj)} fill="none" stroke={tone('ok')} strokeWidth={2.5} />}
          {corrected && adj.map((v, i) => v !== CT[i].v && (
            <text key={i} x={X(CT[i].t)} y={Y(v) - 7} textAnchor="middle" fontSize={9.5} fill={tone('ok')} fontFamily="var(--font-mono)">{v}</text>
          ))}
          {shown.map((p, i) => {
            const reset = i > 0 && p.v < CT[i - 1].v
            return (
              <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${X(p.t)}px ${Y(p.v)}px` }}>
                <circle cx={X(p.t)} cy={Y(p.v)} r={reset ? 5.5 : 4} fill={reset ? tone('new') : 'var(--muted)'} />
                <text x={X(p.t) + 7} y={Y(p.v) + 13} fontSize={9.5} fill="var(--text)" fontFamily="var(--font-mono)">{p.v}</text>
                {reset && <text x={X(p.t)} y={Y(p.v) + 26} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={tone('new')} fontFamily="var(--font-mono)">reset</text>}
              </motion.g>
            )
          })}
        </svg>
      </div>
      <Panel title="Toolkit SQL being simulated">
        <Code>{step < 9 ? `SELECT delta(cs), rate(cs), num_resets(cs),
       extrapolated_rate(with_bounds(cs, tstzrange('2026-11-02 09:00', '2026-11-02 10:00')), 'prometheus')
FROM (SELECT counter_agg(ts, total) AS cs FROM scrapes) t;` : step === 9 ? `SELECT time_bucket('30 min', ts) AS bucket, delta(counter_agg(ts, total))
FROM scrapes GROUP BY bucket;          -- 145 and 140` : `SELECT delta(rollup(cs))               -- 310
FROM (SELECT time_bucket('30 min', ts) AS bucket, counter_agg(ts, total) AS cs
      FROM scrapes GROUP BY bucket) t;`}</Code>
        <p className="mt-2"><EditionTag ed="community" /></p>
      </Panel>
    </div>
  )
}

/* ---------- shell ---------- */
const MODES: [Mode, string][] = [['tw', 'time_weight'], ['ohlc', 'candlestick'], ['pct', 'percentiles'], ['ctr', 'counter_agg']]

function HyperViz() {
  const [mode, setMode] = useState<Mode>('tw')
  const [steps, setSteps] = useState<Record<Mode, number>>({ tw: 0, ohlc: 0, pct: 0, ctr: 0 })
  const step = steps[mode]
  const go = (d: number) => setSteps((s) => ({ ...s, [mode]: Math.max(0, Math.min(STEPS[mode] - 1, s[mode] + d)) }))
  const body: Record<Mode, ReactNode> = {
    tw: <TimeWeight step={step} />, ohlc: <Candlestick step={step} />, pct: <Percentiles step={step} />, ctr: <Counter step={step} />,
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Hyperfunction" value={mode} onChange={setMode} options={MODES} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => go(-1)} disabled={step === 0}>Back</Btn>
        <Btn primary testid="viz-next" onClick={() => (step === STEPS[mode] - 1 ? setSteps((s) => ({ ...s, [mode]: 0 })) : go(1))}>
          {step === STEPS[mode] - 1 ? 'Start over' : 'Next step'}
        </Btn>
        <span className="font-mono text-xs text-muted">step {step + 1} / {STEPS[mode]}</span>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: STEPS[mode] }, (_, i) => (
            <motion.span key={i} animate={{ background: i <= step ? tone('accent') : 'var(--border)' }} className="h-1.5 w-3 rounded-full" />
          ))}
        </div>
      </div>
      {body[mode]}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'hyperfunctions',
  module: 'e2',
  order: 7,
  title: 'Hyperfunctions: time-weighted averages, candlesticks, percentiles and counters',
  tldr: [
    '**Hyperfunctions** from the TimescaleDB Toolkit extension (`timescaledb_toolkit`) are aggregates for time-series questions that plain `avg`, `percentile_cont` and `max - min` get wrong or cannot combine across buckets: time-weighted averages, OHLC candles, approximate percentiles and counters with resets.',
    'Each one builds a small **summary** that accessors read and `rollup()` merges, so a continuous aggregate can store it per bucket and still give correct answers for any larger time range.',
  ],
  visualizer: {
    title: 'Four hyperfunctions, step by step',
    caption: 'Pick a hyperfunction and step through it. Switch **LOCF / linear** for time-weighted averages, watch ticks become candles, merge hourly sketches, and correct a counter that resets. Each summary is a model computed in the page; the Toolkit itself does not run here.',
    Component: HyperViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- a temperature sensor that reports every 15 min, or at once when the value jumps
CREATE TABLE readings (sensor_id int, ts timestamptz, val double precision);
INSERT INTO readings VALUES
  (1, '2026-11-02 08:00+00', 20), (1, '2026-11-02 08:15+00', 22),
  (1, '2026-11-02 08:25+00', 21), (1, '2026-11-02 08:32+00', 35),
  (1, '2026-11-02 08:33+00', 34), (1, '2026-11-02 08:34+00', 22),
  (1, '2026-11-02 08:50+00', 23), (1, '2026-11-02 08:58+00', 24);

-- trades: price and volume per tick
CREATE TABLE ticks (ts timestamptz, symbol text, price double precision, volume double precision);
INSERT INTO ticks VALUES
  ('2026-11-02 14:30:05+00', 'ACME', 100.0, 10), ('2026-11-02 14:30:12+00', 'ACME', 101.5, 5),
  ('2026-11-02 14:30:31+00', 'ACME',  99.2, 20), ('2026-11-02 14:30:48+00', 'ACME', 100.4, 8),
  ('2026-11-02 14:31:03+00', 'ACME', 100.6, 12), ('2026-11-02 14:31:20+00', 'ACME', 102.3, 6),
  ('2026-11-02 14:31:39+00', 'ACME', 101.1, 15), ('2026-11-02 14:31:55+00', 'ACME', 101.8, 9);

-- request latencies: a quiet hour, a short incident with few slow requests, a busy hour
CREATE TABLE requests (ts timestamptz, ms double precision);
INSERT INTO requests SELECT '2026-11-02 10:00+00'::timestamptz + i * interval '9 s',   20 + (i * 37) % 41  FROM generate_series(0, 399) i;
INSERT INTO requests SELECT '2026-11-02 11:00+00'::timestamptz + i * interval '180 s', 200 + (i * 53) % 700 FROM generate_series(0, 19) i;
INSERT INTO requests SELECT '2026-11-02 12:00+00'::timestamptz + i * interval '18 s',  25 + (i * 29) % 56  FROM generate_series(0, 199) i;

-- a monotonic request counter scraped from a service that restarts twice
CREATE TABLE scrapes (ts timestamptz, total double precision);
INSERT INTO scrapes VALUES
  ('2026-11-02 09:00+00', 100), ('2026-11-02 09:10+00', 160),
  ('2026-11-02 09:20+00', 230), ('2026-11-02 09:25+00',  15),
  ('2026-11-02 09:30+00',  40), ('2026-11-02 09:40+00', 110),
  ('2026-11-02 09:50+00',  30), ('2026-11-02 09:58+00',  70);`,
    presets: [
      { label: 'avg() vs a time-weighted average', sql: `-- each reading lasts until the next one: lead() gives the end of its interval
SELECT ts, val, lead(ts) OVER w - ts AS lasts,
       val * extract(epoch FROM lead(ts) OVER w - ts) / 60 AS locf_area
FROM readings WHERE sensor_id = 1 WINDOW w AS (ORDER BY ts);

WITH s AS (
  SELECT ts, val, lead(ts) OVER w AS next_ts, lead(val) OVER w AS next_val
  FROM readings WHERE sensor_id = 1 WINDOW w AS (ORDER BY ts)
)
SELECT round(avg(val)::numeric, 3) AS naive_avg,
       sum(val * extract(epoch FROM next_ts - ts)) / 60 AS locf_integral_min,
       round((sum(val * extract(epoch FROM next_ts - ts))
              / extract(epoch FROM max(ts) - min(ts)))::numeric, 3) AS locf_avg,
       round((sum((val + next_val) / 2 * extract(epoch FROM next_ts - ts))
              / extract(epoch FROM max(ts) - min(ts)))::numeric, 3) AS linear_avg
FROM s;`,
        note: '`avg()` says **25.125** because the 2-minute spike holds 2 of 8 samples. Weighting by duration gives **21.931** (LOCF, a step curve) or **23.043** (linear, straight lines between samples). The last reading has no duration, as in `time_weight`.' },
      { label: 'Buckets: average vs interpolated', sql: `WITH b AS (
  SELECT generate_series(timestamptz '2026-11-02 08:00+00', '2026-11-02 08:30+00', interval '30 min') AS start
), inside AS (
  SELECT b.start, r.ts, r.val FROM b JOIN readings r ON r.ts >= b.start AND r.ts < b.start + interval '30 min'
), seg AS (
  SELECT start, ts, val, lead(ts) OVER (PARTITION BY start ORDER BY ts) AS next_ts FROM inside
), plain AS (    -- like average(): only between the first and last point in the bucket
  SELECT start, sum(val * extract(epoch FROM next_ts - ts)) / extract(epoch FROM max(ts) - min(ts)) AS avg_in_bucket
  FROM seg GROUP BY start
), edges AS (    -- like interpolated_average() with LOCF: carry the previous value to the bucket start
  SELECT start, ts, val FROM inside
  UNION ALL
  SELECT b.start, b.start, (SELECT val FROM readings WHERE ts < b.start ORDER BY ts DESC LIMIT 1)
  FROM b WHERE NOT EXISTS (SELECT 1 FROM readings WHERE ts = b.start)
          AND EXISTS (SELECT 1 FROM readings WHERE ts < b.start)
), seg2 AS (     -- ... and the last value to the bucket end
  SELECT start, ts, val, coalesce(lead(ts) OVER (PARTITION BY start ORDER BY ts), start + interval '30 min') AS next_ts FROM edges
)
SELECT p.start, round(p.avg_in_bucket::numeric, 3) AS average,
       round((sum(s.val * extract(epoch FROM s.next_ts - s.ts)) / 1800)::numeric, 3) AS interpolated_average
FROM plain p JOIN seg2 s USING (start)
GROUP BY p.start, p.avg_in_bucket ORDER BY 1;`,
        note: 'Per bucket: **20.8 / 23.269** using only points inside each bucket, and **20.833 / 23.167** once the edges are filled from the neighbouring bucket (21 from 08:25 to 08:30 in the first, 21 from 08:30 to 08:32 and 24 from 08:58 to 09:00 in the second).' },
      { label: 'Roll up time-weight summaries', sql: `-- the per-bucket state time_weight keeps: first and last point plus the area
CREATE TABLE tw_30m AS
WITH s AS (
  SELECT date_bin('30 min', ts, timestamptz '2026-11-02') AS bucket, ts, val,
         lead(ts) OVER (PARTITION BY date_bin('30 min', ts, timestamptz '2026-11-02') ORDER BY ts) AS next_ts
  FROM readings WHERE sensor_id = 1
)
SELECT bucket, min(ts) AS first_ts, max(ts) AS last_ts,
       (array_agg(val ORDER BY ts DESC))[1] AS last_val,
       sum(val * extract(epoch FROM next_ts - ts)) AS area_s
FROM s GROUP BY bucket;
SELECT * FROM tw_30m ORDER BY bucket;

-- rollup: add the area between one summary's last point and the next summary's first point
WITH g AS (SELECT *, lead(first_ts) OVER (ORDER BY bucket) AS next_first FROM tw_30m)
SELECT round(avg(area_s / extract(epoch FROM last_ts - first_ts))::numeric, 3) AS avg_of_bucket_averages,
       round(((sum(area_s) + sum(coalesce(last_val * extract(epoch FROM next_first - last_ts), 0)))
              / extract(epoch FROM max(last_ts) - min(first_ts)))::numeric, 3) AS rolled_up
FROM g;`,
        note: 'Averaging the bucket averages gives **22.035**. Merging the summaries, including the 21 × 7 minutes between 08:25 and 08:32, gives **21.931**: the same as the whole-hour query in the first preset.' },
      { label: 'OHLC candles and their rollup', sql: `SELECT date_trunc('minute', ts) AS minute,
       (array_agg(price ORDER BY ts))[1]      AS open,
       max(price) AS high, min(price) AS low,
       (array_agg(price ORDER BY ts DESC))[1] AS close,
       sum(volume) AS volume,
       round((sum(price * volume) / sum(volume))::numeric, 4) AS vwap
FROM ticks GROUP BY 1 ORDER BY 1;

-- the same open with DISTINCT ON
SELECT DISTINCT ON (date_trunc('minute', ts)) date_trunc('minute', ts) AS minute, ts AS open_ts, price AS open
FROM ticks ORDER BY date_trunc('minute', ts), ts;

-- a candle you can merge must keep the open and close times and sum(price * volume)
CREATE TABLE candle_1m AS
SELECT date_trunc('minute', ts) AS minute,
       min(ts) AS open_ts, (array_agg(price ORDER BY ts))[1] AS open,
       max(price) AS high, min(price) AS low,
       max(ts) AS close_ts, (array_agg(price ORDER BY ts DESC))[1] AS close,
       sum(volume) AS volume, sum(price * volume) AS pv
FROM ticks GROUP BY 1;
SELECT (array_agg(open ORDER BY open_ts))[1] AS open, max(high) AS high, min(low) AS low,
       (array_agg(close ORDER BY close_ts DESC))[1] AS close, sum(volume) AS volume,
       round((sum(pv) / sum(volume))::numeric, 4) AS vwap,
       round(avg(pv / volume)::numeric, 4) AS avg_of_vwaps
FROM candle_1m;`,
        note: 'Two candles: VWAP **99.8767** and **101.2786**. Merged: open 100, high 102.3, low 99.2, close 101.8, volume 85, VWAP **100.5694**. The average of the two VWAPs (100.5777) is wrong because the minutes traded different volumes.' },
      { label: 'Exact percentiles do not combine', sql: `SELECT date_trunc('hour', ts) AS hour, count(*) AS n,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY ms) AS p95
FROM requests GROUP BY 1 ORDER BY 1;

WITH h AS (SELECT date_trunc('hour', ts) AS hour,
                  percentile_cont(0.95) WITHIN GROUP (ORDER BY ms) AS p95
           FROM requests GROUP BY 1)
SELECT round(avg(p95)::numeric, 2) AS avg_of_hourly_p95,
       (SELECT round(percentile_cont(0.95) WITHIN GROUP (ORDER BY ms)::numeric, 2) FROM requests) AS true_p95
FROM h;

-- the exact answer for a larger range needs every raw value again
CREATE TABLE raw_hourly AS SELECT date_trunc('hour', ts) AS hour, array_agg(ms) AS vals FROM requests GROUP BY 1;
SELECT sum(cardinality(vals)) AS values_kept,
       (SELECT round(percentile_cont(0.95) WITHIN GROUP (ORDER BY v)::numeric, 2)
        FROM raw_hourly, unnest(vals) v) AS p95_from_all_values
FROM raw_hourly;`,
        note: 'Hourly p95: **58**, **838.65** and **78** ms. Their average is **324.88 ms**, but the true p95 is **77.05 ms**: the incident hour served 20 of 620 requests. The only exact fix is to keep and re-sort all **620** values.' },
      { label: 'A mergeable log-bucket sketch', sql: `-- UddSketch idea with max_error 0.05: bucket = ceil(log_gamma(x)), gamma = 1.05 / 0.95
CREATE TABLE sketch_hourly AS
SELECT date_trunc('hour', ts) AS hour, ceil(ln(ms) / ln(1.05 / 0.95))::int AS bucket, count(*) AS n
FROM requests GROUP BY 1, 2;
SELECT hour, count(*) AS buckets, sum(n) AS values_summarised FROM sketch_hourly GROUP BY 1 ORDER BY 1;

-- rollup = add counts per bucket; estimate = gamma^(bucket-1) * 1.05 at rank floor(n*q)+1
WITH merged AS (SELECT bucket, sum(n) AS n FROM sketch_hourly GROUP BY bucket),
     c AS (SELECT bucket, sum(n) OVER (ORDER BY bucket) AS cum, sum(n) OVER () AS total FROM merged)
SELECT q, (SELECT round((power(1.05 / 0.95, bucket - 1) * 1.05)::numeric, 3)
           FROM c WHERE cum >= floor(total * q) + 1 ORDER BY bucket LIMIT 1) AS approx,
       (SELECT round(percentile_cont(q) WITHIN GROUP (ORDER BY ms)::numeric, 3) FROM requests) AS exact
FROM unnest(array[0.5, 0.95, 0.99]) q;`,
        note: '12, 15 and 12 bucket counts replace 400, 20 and 200 values. Merged by summing counts, the sketch says p95 ≈ **77.663** ms (exact 77.05) and p99 ≈ **574.815** (exact 560.93), each within 5% of a real value.' },
      { label: 'Counter resets with lag() and CASE', sql: `SELECT max(total) - min(total) AS max_minus_min,
       (array_agg(total ORDER BY ts DESC))[1] - (array_agg(total ORDER BY ts))[1] AS last_minus_first
FROM scrapes;

-- a decrease means the counter restarted from zero: the increase is the new value itself
WITH d AS (SELECT ts, total, lag(total) OVER (ORDER BY ts) AS prev FROM scrapes)
SELECT ts, total, prev,
       CASE WHEN prev IS NULL THEN 0 WHEN total < prev THEN total ELSE total - prev END AS increase,
       total < prev AS reset
FROM d ORDER BY ts;

WITH d AS (SELECT ts, total, lag(total) OVER (ORDER BY ts) AS prev FROM scrapes),
     i AS (SELECT ts, CASE WHEN prev IS NULL THEN 0 WHEN total < prev THEN total ELSE total - prev END AS inc,
                  total < prev AS r FROM d)
SELECT sum(inc) AS delta, count(*) FILTER (WHERE r) AS num_resets,
       round((sum(inc) / extract(epoch FROM max(ts) - min(ts)))::numeric, 4) AS rate_per_s
FROM i;

-- per bucket, lag() cannot see the previous bucket: the increase across the edge is lost
WITH d AS (SELECT date_bin('30 min', ts, timestamptz '2026-11-02') AS b, ts, total,
                  lag(total) OVER (PARTITION BY date_bin('30 min', ts, timestamptz '2026-11-02') ORDER BY ts) AS prev
           FROM scrapes)
SELECT b, sum(CASE WHEN prev IS NULL THEN 0 WHEN total < prev THEN total ELSE total - prev END) AS bucket_delta
FROM d GROUP BY b ORDER BY b;`,
        note: 'Raw arithmetic gives **−30** or **215**. Reset-aware: **310** requests, **2** resets, **0.0891** per second. Bucketed deltas are 145 + 140 = 285: the 25 between 09:25 and 09:30 need the neighbouring bucket, which is what `rollup()` keeps.' },
    ],
  },
  production: {
    title: 'Latency and traffic dashboards that stay correct at every zoom level',
    context: 'An API platform team stores one row per request and one counter scrape per service every 15 seconds, on TimescaleDB with the Toolkit. Dashboards show p95 latency and request rate per hour, per day and per week.',
    problem: 'The hourly continuous aggregate stored `percentile_cont(0.95)` and `max(total) - min(total)`. Daily and weekly panels averaged the hourly p95s and summed the hourly deltas. After a short incident the daily p95 was several times too high, and every deploy, which restarts the counters, made that hour\'s traffic wrong.',
    solution: 'Store **summaries**, not final numbers: `percentile_agg` for latency, `counter_agg` for traffic and `stats_agg` for mean and spread. Build the daily aggregate on top of the hourly one with `rollup()`, and call accessors only at query time. Only stable functions go into the aggregates, never `toolkit_experimental` ones.',
    sql: `CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;   -- 1.27.0; trusted since 1.23

CREATE MATERIALIZED VIEW api_hourly WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) AS bucket, service,
       percentile_agg(latency_ms) AS latency,      -- uddsketch(200, 0.001, latency_ms)
       stats_agg(latency_ms)      AS latency_stats
FROM requests GROUP BY bucket, service;

CREATE MATERIALIZED VIEW traffic_hourly WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) AS bucket, service,
       counter_agg(ts, requests_total) AS cs
FROM scrapes GROUP BY bucket, service;

-- daily on top of hourly: merge summaries, never average results
CREATE MATERIALIZED VIEW api_daily WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', bucket) AS day, service,
       rollup(latency) AS latency, rollup(latency_stats) AS latency_stats
FROM api_hourly GROUP BY day, service;

SELECT day, service,
       approx_percentile(0.95, latency)      AS p95_ms,
       approx_percentile_rank(250, latency)  AS share_under_250ms,
       average(latency_stats), stddev(latency_stats)
FROM api_daily WHERE day >= now() - INTERVAL '7 days';

SELECT service, delta(rollup(cs)) AS requests, num_resets(rollup(cs)) AS restarts
FROM traffic_hourly WHERE bucket >= now() - INTERVAL '1 day' GROUP BY service;`,
    outcome: 'On the playground\'s three hours of traffic, the old method reports a p95 of 324.88 ms against a true 77.05 ms. A merged sketch with a 5% error bound gives 77.66 ms. Each hourly sketch is bounded at 200 buckets however many requests it summarizes, and the counter delta stays correct across restarts.',
  },
  pitfalls: [
    { title: 'Averaging irregular samples',
      symptom: 'Average temperature, power or queue depth jumps whenever something changes quickly, and disagrees with energy or cost totals.',
      cause: 'Devices that report on change send many samples during transients and few while stable. `avg()` weighs each sample equally, so short spikes dominate.',
      fix: 'Weight by duration: `time_weight` with `LOCF` for report-on-change devices, `linear` for sampled signals. Use `interpolated_average` with `LAG`/`LEAD` for exact bucket edges. Natively, compute interval areas with `lead()`.',
      sql: `SELECT time_bucket('1 hour', ts) AS hour,
       average(time_weight('LOCF', ts, val)) AS twa
FROM readings GROUP BY hour;` },
    { title: 'Averaging percentiles across buckets',
      symptom: 'A daily or weekly p95 is far higher or lower than the same percentile computed on raw data.',
      cause: 'A percentile of percentiles is not a percentile: hours with few requests weigh as much as busy ones. Exact `percentile_cont` has no partial form, so it cannot be merged at all.',
      fix: 'Store `percentile_agg` (or `uddsketch`/`tdigest`) per bucket and query `approx_percentile(p, rollup(sketch))`. All sketches you roll up must share `size` and `max_error`, and a mismatch is not always detected.',
      sql: `SELECT approx_percentile(0.95, rollup(latency)) AS p95
FROM api_hourly WHERE bucket >= now() - INTERVAL '1 day';` },
    { title: 'Ignoring counter resets',
      symptom: 'Request or byte totals go negative or drop to a fraction after deploys, and summed hourly deltas are below the real total.',
      cause: 'A restarted process starts its counter at zero. `max - min` and `last - first` treat that as a loss. Per-bucket deltas also miss the increase between the last point of one bucket and the first of the next.',
      fix: 'Use `counter_agg`: `delta`, `rate` and `num_resets` account for resets. Combine buckets with `delta(rollup(cs))`, or `interpolated_delta(cs, bucket, interval, LAG(cs), LEAD(cs))` per bucket. For Prometheus-style rates, set bounds and call `extrapolated_rate(cs, \'prometheus\')`.',
      sql: `SELECT bucket, delta(cs), num_resets(cs),
       interpolated_delta(cs, bucket, '1 hour',
         LAG(cs) OVER (ORDER BY bucket), LEAD(cs) OVER (ORDER BY bucket))
FROM traffic_hourly WHERE service = 'api';` },
    { title: 'Experimental functions change between versions',
      symptom: 'After `ALTER EXTENSION timescaledb_toolkit UPDATE` (or an automatic upgrade on a managed service), a view or continuous aggregate is gone, or a query fails with a missing function.',
      cause: 'Functions in the `toolkit_experimental` schema can change in any release, and extension updates **drop every object that depends on them**. Real examples: `ohlc` was replaced by `candlestick_agg`, `state_agg` was renamed `compact_state_agg` while `timeline_agg` took the name `state_agg`, and the state accessors swapped their first two arguments.',
      fix: 'Keep stable functions in caggs and views. Before an upgrade, list the dependent objects and save their definitions.',
      sql: `-- views and caggs whose definition calls a toolkit_experimental function
SELECT DISTINCT r.ev_class::regclass AS dependent_view, p.proname
FROM pg_depend d
JOIN pg_rewrite r ON d.classid = 'pg_rewrite'::regclass AND r.oid = d.objid
JOIN pg_proc p    ON d.refclassid = 'pg_proc'::regclass AND p.oid = d.refobjid
WHERE p.pronamespace = 'toolkit_experimental'::regnamespace;` },
  ],
  pointers: [
    '**Two-step aggregation**: an aggregate builds a summary, accessors (`average`, `vwap`, `approx_percentile`, `delta`) read it, and `rollup()` merges summaries. Store summaries in [continuous aggregates](/e2/continuous-aggregates).',
    '`time_weight(\'LOCF\' | \'linear\', ts, v)`: the area under the curve divided by elapsed time. One point gives NULL; `interpolated_average` fills bucket edges from neighbours.',
    '`candlestick_agg(ts, price, volume)`: open/close by time, high/low, volume and VWAP = Σ(price·volume) / Σvolume, all mergeable.',
    'UddSketch buckets values at ⌈log_γ x⌉, so merging adds counts and keeps a relative error bound (0.001 for `percentile_agg`, which grows if 200 buckets overflow). Never average percentiles. `counter_agg` treats any drop as a reset to zero.',
    '`timescaledb_toolkit` 1.27.0 supports PostgreSQL 16–18 under the Timescale License. It comes with Tiger Cloud and the `timescaledb-ha` image; self-hosted servers install it from packages (apt, yum, brew) or from source. Neon does not offer it.',
  ],
  sources: ['functions-window.html', 'functions-aggregate.html', 'xaggr.html', 'sql-select.html', 'functions-math.html',
    'github.com/timescale/timescaledb-toolkit', 'github.com/timescale/timescaledb-toolkit/blob/main/CHANGELOG.md',
    'tigerdata.com/docs/learn/hyperfunctions/about-hyperfunctions', 'tigerdata.com/docs/reference/toolkit',
    'tigerdata.com/docs/deploy/self-hosted/tooling/install-toolkit'],
}
