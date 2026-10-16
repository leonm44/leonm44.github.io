// Daily data pipeline: downloads two years of daily OHLCV bars for each ETF,
// cleans them, computes indicators and writes src/data/market.json.
// Runs in GitHub Actions after the Euronext close (see .github/workflows).
//
// Source: Yahoo Finance chart endpoint. It is free but unofficial and
// undocumented, so the script validates everything it receives and fails
// loudly rather than publishing bad numbers: if the build fails, GitHub Pages
// simply keeps serving the previous version of the site.

import { ETFS } from '../src/data/etfs.mjs';
import { writeMarket } from './lib/write-market.mjs';

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const RANGE = '2y';
const MIN_BARS = 260; // need > 1 year for 200-day average + 1Y performance

async function fetchYahoo(symbol) {
  let lastErr;
  for (const host of HOSTS) {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${RANGE}&interval=1d&events=div%2Csplit`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (leon-market-compass data pipeline)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const r = json?.chart?.result?.[0];
      if (!r) throw new Error(json?.chart?.error?.description || 'empty result');
      return r;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`${symbol}: ${lastErr?.message}`);
}

function toBars(result, symbol) {
  const { currency } = result.meta;
  if (currency !== 'EUR') throw new Error(`${symbol}: expected EUR, got ${currency}`);
  const q = result.indicators.quote[0];
  const bars = [];
  result.timestamp.forEach((t, i) => {
    const [o, h, l, c, v] = [q.open[i], q.high[i], q.low[i], q.close[i], q.volume[i]];
    if ([o, h, l, c].some((x) => x === null || x === undefined || !(x > 0))) return; // holiday / missing
    const d = new Date(t * 1000).toISOString().slice(0, 10);
    bars.push({
      d,
      o: +o.toFixed(4),
      h: +Math.max(h, o, c).toFixed(4),
      l: +Math.min(l, o, c).toFixed(4),
      c: +c.toFixed(4),
      v: v ?? 0,
    });
  });
  // De-duplicate dates (the live session can appear twice), keep the last.
  const byDate = new Map(bars.map((b) => [b.d, b]));
  const clean = [...byDate.values()].sort((a, b) => a.d.localeCompare(b.d));

  // Sanity check: a >25% daily jump on a broad ETF almost always means bad data.
  for (let i = 1; i < clean.length; i++) {
    const jump = Math.abs(clean[i].c / clean[i - 1].c - 1);
    if (jump > 0.25) throw new Error(`${symbol}: suspicious ${(jump * 100).toFixed(0)}% move on ${clean[i].d}`);
  }
  if (clean.length < MIN_BARS) throw new Error(`${symbol}: only ${clean.length} bars`);
  return clean;
}

const series = {};
const errors = [];
for (const etf of ETFS) {
  try {
    series[etf.id] = toBars(await fetchYahoo(etf.yahoo), etf.yahoo);
    const b = series[etf.id];
    console.log(`ok  ${etf.yahoo.padEnd(8)} ${b.length} bars, last ${b.at(-1).d} close ${b.at(-1).c}`);
  } catch (e) {
    errors.push(e.message);
    console.error(`ERR ${e.message}`);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} series failed; not writing market.json.`);
  process.exit(1);
}

await writeMarket(series, { source: 'Yahoo Finance (daily bars, Euronext Paris, EUR)' });
console.log('market.json written');
