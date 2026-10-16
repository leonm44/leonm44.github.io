// Turns a raw daily OHLCV series into everything the site displays:
// performance, risk, indicators, a detected candlestick pattern and a short
// rule-based summary written in plain English.

import { sma, rsi, macd, volatility, maxDrawdown } from './indicators.mjs';

const CHART_BARS = 130; // ~6 months of sessions shown in candlestick charts
const SPARK_BARS = 252; // ~1 year for sparklines

const pct = (a, b) => (a && b ? a / b - 1 : null);
const round = (v, d = 4) => (v === null || v === undefined || Number.isNaN(v) ? null : +v.toFixed(d));

/** Close `n` sessions ago (n = 0 is the last close). */
function closeAgo(bars, n) {
  const i = bars.length - 1 - n;
  return i >= 0 ? bars[i].c : null;
}

/**
 * Close on the last session on or before the same calendar day `months` earlier
 * (e.g. 16 Oct -> 16 Sep for 1M). Standard convention used by fund factsheets,
 * and robust to missing or extra rows in the source file.
 */
export function closeMonthsAgo(bars, months) {
  const last = new Date(`${bars.at(-1).d}T00:00:00Z`);
  const target = new Date(last);
  target.setUTCMonth(target.getUTCMonth() - months);
  // 31 Mar - 1M must give 28/29 Feb, not 3 Mar
  if (target.getUTCDate() !== last.getUTCDate()) target.setUTCDate(0);
  const t = target.toISOString().slice(0, 10);
  for (let i = bars.length - 1; i >= 0; i--) if (bars[i].d <= t) return { d: bars[i].d, c: bars[i].c };
  return null;
}

/** Last close of the previous calendar year, for YTD. */
function lastCloseBeforeYear(bars, year) {
  for (let i = bars.length - 1; i >= 0; i--) {
    if (Number(bars[i].d.slice(0, 4)) < year) return bars[i].c;
  }
  return null;
}

/** Classic single and two-candle patterns, checked on the last session. */
export function detectPattern(bars) {
  if (bars.length < 2) return null;
  const cur = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const body = Math.abs(cur.c - cur.o);
  const range = cur.h - cur.l || 1e-9;
  const upper = cur.h - Math.max(cur.o, cur.c);
  const lower = Math.min(cur.o, cur.c) - cur.l;
  const prevBull = prev.c > prev.o;
  const curBull = cur.c > cur.o;

  if (!prevBull && curBull && cur.o <= prev.c && cur.c >= prev.o)
    return { id: 'bullish-engulfing', name: 'Bullish engulfing' };
  if (prevBull && !curBull && cur.o >= prev.c && cur.c <= prev.o)
    return { id: 'bearish-engulfing', name: 'Bearish engulfing' };
  if (body / range < 0.1) return { id: 'doji', name: 'Doji' };
  if (lower >= 2 * body && upper <= body * 0.5) return { id: 'hammer', name: 'Hammer-shaped candle' };
  if (upper >= 2 * body && lower <= body * 0.5) return { id: 'shooting-star', name: 'Shooting-star-shaped candle' };
  if (body / range > 0.8) return { id: curBull ? 'marubozu-bull' : 'marubozu-bear', name: curBull ? 'Strong bullish candle' : 'Strong bearish candle' };
  return null;
}

function trendLabel(close, s50, s200) {
  if (s50 === null || s200 === null) return 'n/a';
  if (close > s50 && s50 > s200) return 'Uptrend';
  if (close < s50 && s50 < s200) return 'Downtrend';
  return 'Mixed';
}

function rsiZone(v) {
  if (v === null) return 'n/a';
  if (v >= 70) return 'Overbought';
  if (v <= 30) return 'Oversold';
  return 'Neutral';
}

/** Detect a 50/200 cross in the last `lookback` sessions. */
function recentCross(s50, s200, lookback = 20) {
  for (let i = s50.length - 1; i > s50.length - 1 - lookback && i > 0; i--) {
    if ([s50[i], s200[i], s50[i - 1], s200[i - 1]].some((v) => v === null)) break;
    const now = s50[i] - s200[i];
    const before = s50[i - 1] - s200[i - 1];
    if (now > 0 && before <= 0) return { type: 'golden', sessionsAgo: s50.length - 1 - i };
    if (now < 0 && before >= 0) return { type: 'death', sessionsAgo: s50.length - 1 - i };
  }
  return null;
}

const fmtPct = (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;

function buildSummary(m) {
  const s = [];
  if (m.trend === 'Uptrend')
    s.push('The price trades above its 50-day average, which is itself above the 200-day average: the classic definition of an uptrend.');
  else if (m.trend === 'Downtrend')
    s.push('The price trades below its 50-day average, which is itself below the 200-day average: the classic definition of a downtrend.');
  else if (m.trend === 'Mixed')
    s.push('The price and its 50- and 200-day averages are not aligned: no clear trend, the market is hesitating or turning.');

  if (m.cross)
    s.push(
      m.cross.type === 'golden'
        ? `A "golden cross" (50-day average crossing above the 200-day) happened ${m.cross.sessionsAgo} session(s) ago.`
        : `A "death cross" (50-day average crossing below the 200-day) happened ${m.cross.sessionsAgo} session(s) ago.`,
    );

  if (m.rsi !== null) {
    const r = m.rsi.toFixed(0);
    if (m.rsiZone === 'Overbought') s.push(`RSI at ${r}: the recent rise has been fast, often followed by a pause.`);
    else if (m.rsiZone === 'Oversold') s.push(`RSI at ${r}: the recent fall has been steep, selling pressure may be running out.`);
    else s.push(`RSI at ${r}: momentum is neither stretched up nor down.`);
  }

  if (m.macdHist !== null)
    s.push(
      m.macdHist > 0
        ? 'MACD is above its signal line: short-term momentum is improving.'
        : 'MACD is below its signal line: short-term momentum is fading.',
    );

  if (m.perf.y1 !== null && m.vol !== null)
    s.push(`Over one year: ${fmtPct(m.perf.y1)}, with an annualised volatility of ${(m.vol * 100).toFixed(0)}%.`);

  return s;
}

export function analyze(bars) {
  const closes = bars.map((b) => b.c);
  const n = bars.length;
  const last = bars[n - 1];
  const year = Number(last.d.slice(0, 4));

  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const s200 = sma(closes, 200);
  const r = rsi(closes, 14);
  const m = macd(closes);

  const b1 = closeMonthsAgo(bars, 1);
  const b3 = closeMonthsAgo(bars, 3);
  const b12 = closeMonthsAgo(bars, 12);
  const perf = {
    d1: pct(last.c, closeAgo(bars, 1)),
    m1: pct(last.c, b1?.c),
    m3: pct(last.c, b3?.c),
    ytd: pct(last.c, lastCloseBeforeYear(bars, year)),
    y1: pct(last.c, b12?.c),
  };

  const metrics = {
    asOf: last.d,
    last: last.c,
    perf,
    vol: volatility(closes, 63),
    mdd1y: maxDrawdown(closes.slice(-252)),
    high52: Math.max(...bars.slice(-252).map((b) => b.h)),
    low52: Math.min(...bars.slice(-252).map((b) => b.l)),
    sma50: s50[n - 1],
    sma200: s200[n - 1],
    rsi: r[n - 1],
    macd: m.line[n - 1],
    macdSignal: m.signal[n - 1],
    macdHist: m.hist[n - 1],
  };
  metrics.trend = trendLabel(last.c, metrics.sma50, metrics.sma200);
  metrics.rsiZone = rsiZone(metrics.rsi);
  metrics.cross = recentCross(s50, s200);
  metrics.pattern = detectPattern(bars);
  metrics.summary = buildSummary(metrics);

  const from = Math.max(0, n - CHART_BARS);
  const chart = bars.slice(from).map((b, k) => {
    const i = from + k;
    return {
      ...b,
      s20: round(s20[i]),
      s50: round(s50[i]),
      s200: round(s200[i]),
      rsi: round(r[i], 2),
      macd: round(m.line[i]),
      sig: round(m.signal[i]),
      hist: round(m.hist[i]),
    };
  });

  const spark = bars.slice(-SPARK_BARS).map((b) => b.c);

  // Round scalar metrics for a compact JSON file. Keep 6 decimals: rounding to
  // 4 then displaying with 1 decimal in % caused double-rounding errors
  // (e.g. +4.6455% stored as 0.0465 and shown as +4.7%).
  for (const k of ['vol', 'mdd1y', 'sma50', 'sma200', 'rsi', 'macd', 'macdSignal', 'macdHist']) metrics[k] = round(metrics[k], 6);
  for (const k of Object.keys(perf)) perf[k] = round(perf[k], 6);

  metrics.perfBase = { m1: b1?.d ?? null, m3: b3?.d ?? null, y1: b12?.d ?? null };
  return { ...metrics, chart, spark };
}
