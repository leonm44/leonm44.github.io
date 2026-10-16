import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sma, ema, rsi, macd, maxDrawdown } from './lib/indicators.mjs';
import { detectPattern } from './lib/analyze.mjs';

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('SMA', () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test('EMA is seeded with the SMA and flat on a constant series', () => {
  const e = ema([2, 4, 6, 8], 3);
  assert.deepEqual(e.slice(0, 3), [null, null, 4]);
  close(e[3], 0.5 * 8 + 0.5 * 4); // alpha = 2/(3+1) = 0.5
  assert.ok(ema(Array(40).fill(10), 12).slice(11).every((v) => v === 10));
});

test("RSI matches Wilder's worked example (StockCharts reference values)", () => {
  const closes = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28,
    46.0, 46.03, 46.41, 46.22,
  ];
  const r = rsi(closes, 14);
  // StockCharts' spreadsheet rounds the intermediate averages to 2 decimals,
  // hence a tolerance of 0.1 point (exact first value: 70.46).
  close(r[14], 70.53, 0.1);
  close(r[15], 66.32, 0.1);
  close(r[16], 66.55, 0.1);
  close(r[17], 69.41, 0.1);
  close(r[18], 66.36, 0.1);
});

test('MACD is zero on a constant series', () => {
  const { line, signal, hist } = macd(Array(60).fill(100));
  assert.equal(line.at(-1), 0);
  assert.equal(signal.at(-1), 0);
  assert.equal(hist.at(-1), 0);
  assert.equal(line[24], null); // undefined before the slow EMA exists
});

test('Max drawdown', () => {
  close(maxDrawdown([100, 120, 90, 130, 117]), -0.25, 1e-9);
});

test('Bullish engulfing detection', () => {
  const p = detectPattern([
    { o: 10, h: 10.2, l: 9.4, c: 9.5 },
    { o: 9.4, h: 10.4, l: 9.3, c: 10.3 },
  ]);
  assert.equal(p.id, 'bullish-engulfing');
});

import { parseEuronextCsv, clean } from './lib/sources.mjs';

test('Euronext CSV parser (real format, extra trailing column, d/m/Y dates)', () => {
  const csv = [
    '"Historical Data"',
    '"From 2026-10-01 to 2026-10-16"',
    'LU1681043599',
    'Date;Open;High;Low;Last;Close;"Number of Shares";"Number of Trades";Turnover',
    '16/10/2026;711.97;712.93;709.00;709.55;709.55;13463;629;9580622;711.6261',
    '15/10/2026;706.65;711.94;705.03;710.53;710.53;10005;1135;7083013;707.94736',
  ].join('\n');
  const bars = parseEuronextCsv(csv);
  assert.equal(bars.length, 2);
  assert.deepEqual(bars[0], { d: '2026-10-16', o: 711.97, h: 712.93, l: 709, c: 709.55, v: 13463 });
});

test('clean() sorts, de-duplicates and rejects bad jumps', () => {
  const mk = (i, c) => ({ d: `2025-01-${String(i).padStart(2, '0')}`, o: c, h: c, l: c, c, v: 1 });
  assert.throws(() => clean([mk(2, 100), mk(1, 100), mk(3, 150)], 'X'), /suspicious/);
});

test('Performance is not double-rounded (S&P 500 3M case: +4.6455% must display +4.6%)', () => {
  const p = 137.41 / 131.31 - 1;
  assert.equal(+p.toFixed(6), 0.046455);
  assert.equal((+p.toFixed(6) * 100).toFixed(1), '4.6');
});

import { closeMonthsAgo } from './lib/analyze.mjs';

test('closeMonthsAgo uses calendar dates and falls back to the previous session', () => {
  const bars = ['2026-07-16', '2026-07-17', '2026-09-15', '2026-09-16', '2026-10-15', '2026-10-16'].map((d, i) => ({ d, c: 100 + i }));
  assert.equal(closeMonthsAgo(bars, 1).d, '2026-09-16');
  assert.equal(closeMonthsAgo(bars, 3).d, '2026-07-16');
  const eom = [{ d: '2026-02-27', c: 1 }, { d: '2026-03-02', c: 2 }, { d: '2026-03-31', c: 3 }];
  assert.equal(closeMonthsAgo(eom, 1).d, '2026-02-27'); // 31 Mar -> 28 Feb (Sat) -> 27 Feb
});
