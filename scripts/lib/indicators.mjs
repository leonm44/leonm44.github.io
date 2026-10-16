// Technical indicators, written from scratch (no library) so every formula is
// visible and testable. Inputs are plain arrays of numbers; outputs are arrays
// of the same length, with `null` where the indicator is not yet defined.

/** Simple moving average over `period` values. */
export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential moving average, alpha = 2 / (period + 1),
 * seeded with the SMA of the first `period` values (standard convention).
 * `null` entries at the start of `values` are skipped (useful for MACD signal).
 */
export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const alpha = 2 / (period + 1);
  const start = values.findIndex((v) => v !== null && v !== undefined);
  if (start < 0 || values.length - start < period) return out;
  let prev = 0;
  for (let i = start; i < start + period; i++) prev += values[i];
  prev /= period;
  out[start + period - 1] = prev;
  for (let i = start + period; i < values.length; i++) {
    prev = alpha * values[i] + (1 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

/**
 * Relative Strength Index with Wilder's smoothing (J. Welles Wilder, 1978).
 * RS = average gain / average loss over `period`, RSI = 100 - 100 / (1 + RS).
 */
export function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = toRsi(gain, loss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = toRsi(gain, loss);
  }
  return out;
}

function toRsi(gain, loss) {
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

/** MACD (Gerald Appel): EMA(fast) - EMA(slow), signal = EMA(signal) of MACD. */
export function macd(closes, fast = 12, slow = 26, signal = 9) {
  const f = ema(closes, fast);
  const s = ema(closes, slow);
  const line = closes.map((_, i) => (f[i] === null || s[i] === null ? null : f[i] - s[i]));
  const sig = ema(line, signal);
  const hist = line.map((v, i) => (v === null || sig[i] === null ? null : v - sig[i]));
  return { line, signal: sig, hist };
}

/** Annualised volatility of daily log returns over the last `window` sessions. */
export function volatility(closes, window = 63) {
  if (closes.length <= window) return null;
  const rets = [];
  for (let i = closes.length - window; i < closes.length; i++) {
    rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

/** Maximum drawdown (as a negative fraction) over the given closes. */
export function maxDrawdown(closes) {
  let peak = -Infinity;
  let mdd = 0;
  for (const c of closes) {
    peak = Math.max(peak, c);
    mdd = Math.min(mdd, c / peak - 1);
  }
  return mdd;
}
