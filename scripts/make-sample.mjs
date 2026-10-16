// Generates SIMULATED price series (seeded geometric Brownian motion) so the
// site can be built and previewed offline. The resulting market.json is
// flagged `sample: true` and every page shows a visible "sample data" banner.
// Production builds always use scripts/fetch-data.mjs instead.

import { ETFS } from '../src/data/etfs.mjs';
import { writeMarket } from './lib/write-market.mjs';

// Rough, plausible drift / volatility / starting level per product (annualised).
// rho = loading on a shared "equity market" shock, so the simulated
// correlation matrix looks plausible.
const PARAMS = {
  'msci-world': { s0: 600, mu: 0.09, sigma: 0.14, rho: 0.95 },
  sp500: { s0: 115, mu: 0.1, sigma: 0.17, rho: 0.9 },
  'stoxx-600': { s0: 270, mu: 0.07, sigma: 0.15, rho: 0.75 },
  'em-asia': { s0: 48, mu: 0.06, sigma: 0.2, rho: 0.6 },
  'em-latam': { s0: 20, mu: 0.05, sigma: 0.26, rho: 0.5 },
  gold: { s0: 110, mu: 0.12, sigma: 0.16, rho: 0.1 },
};

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function tradingDays(count) {
  const days = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (days.length < count) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days.reverse();
}

const DAYS = tradingDays(510);
const marketRand = mulberry32(42);
const MARKET = DAYS.map(() => gaussian(marketRand));
const series = {};
ETFS.forEach((etf, k) => {
  const { s0, mu, sigma, rho } = PARAMS[etf.id];
  const rand = mulberry32(1234 + k * 97);
  const dt = 1 / 252;
  let prev = s0;
  series[etf.id] = DAYS.map((d, t) => {
    const z = rho * MARKET[t] + Math.sqrt(1 - rho ** 2) * gaussian(rand);
    const o = prev * (1 + gaussian(rand) * sigma * Math.sqrt(dt) * 0.25);
    const c = o * Math.exp((mu - sigma ** 2 / 2) * dt + sigma * Math.sqrt(dt) * z);
    const wick = sigma * Math.sqrt(dt) * 0.6;
    const h = Math.max(o, c) * (1 + Math.abs(gaussian(rand)) * wick);
    const l = Math.min(o, c) * (1 - Math.abs(gaussian(rand)) * wick);
    prev = c;
    const r4 = (x) => +x.toFixed(4);
    return { d, o: r4(o), h: r4(h), l: r4(l), c: r4(c), v: Math.round(5000 + rand() * 40000) };
  });
});

await writeMarket(series, { source: 'Simulated sample data (offline preview)', sample: true });
console.log('Sample market.json written (simulated data).');
