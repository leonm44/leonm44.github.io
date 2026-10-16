// Daily data pipeline: downloads two years of daily OHLCV bars for each ETF,
// validates them, computes indicators and writes src/data/market.json.
// Runs in GitHub Actions after the Euronext close (see .github/workflows).
//
// Primary source: Euronext's official historical price download.
// Fallback: Yahoo Finance's unofficial chart endpoint.
// If a series fails on both, the script exits with an error and nothing is
// published: GitHub Pages keeps serving the previous version of the site.

import { ETFS } from '../src/data/etfs.mjs';
import { writeMarket } from './lib/write-market.mjs';
import { fromEuronext, fromYahoo, clean } from './lib/sources.mjs';

const SOURCES = [
  ['Euronext', fromEuronext],
  ['Yahoo Finance', fromYahoo],
];

const series = {};
const used = new Set();
const errors = [];

for (const etf of ETFS) {
  const tried = [];
  for (const [name, fetcher] of SOURCES) {
    try {
      const bars = clean(await fetcher(etf), `${etf.ticker} (${name})`);
      series[etf.id] = bars;
      used.add(name);
      console.log(`ok   ${etf.ticker.padEnd(5)} ${name.padEnd(13)} ${bars.length} bars, last ${bars.at(-1).d} close ${bars.at(-1).c}`);
      break;
    } catch (e) {
      tried.push(`${name}: ${e.message}`);
      console.warn(`warn ${etf.ticker.padEnd(5)} ${e.message}`);
    }
  }
  if (!series[etf.id]) errors.push(`${etf.ticker}: ${tried.join(' | ')}`);
}

if (errors.length) {
  console.error(`\nFAILED for ${errors.length} product(s); market.json not written:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

await writeMarket(series, { source: `${[...used].join(' + ')} (daily bars, Euronext Paris, EUR)` });
console.log('market.json written');
