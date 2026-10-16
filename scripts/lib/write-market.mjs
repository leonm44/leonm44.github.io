import { mkdir, writeFile } from 'node:fs/promises';
import { analyze } from './analyze.mjs';

/**
 * Pearson correlation of daily returns over the last `window` common dates.
 * Returns are aligned on dates so a holiday on one series does not shift the others.
 */
export function correlationMatrix(seriesById, window = 252) {
  const ids = Object.keys(seriesById);
  const maps = ids.map((id) => new Map(seriesById[id].map((b) => [b.d, b.c])));
  const common = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d))).sort().slice(-(window + 1));
  const rets = maps.map((m) => common.slice(1).map((d, i) => Math.log(m.get(d) / m.get(common[i]))));
  const corr = (a, b) => {
    const n = a.length;
    const ma = a.reduce((s, v) => s + v, 0) / n;
    const mb = b.reduce((s, v) => s + v, 0) / n;
    let cov = 0, va = 0, vb = 0;
    for (let i = 0; i < n; i++) {
      cov += (a[i] - ma) * (b[i] - mb);
      va += (a[i] - ma) ** 2;
      vb += (b[i] - mb) ** 2;
    }
    return cov / Math.sqrt(va * vb);
  };
  return {
    ids,
    sessions: common.length - 1,
    matrix: rets.map((a) => rets.map((b) => +corr(a, b).toFixed(3))),
  };
}

export const OUT =new URL('../../src/data/market.json', import.meta.url);

/** seriesById: { [etfId]: [{d,o,h,l,c,v}] } sorted by date ascending. */
export async function writeMarket(seriesById, { source, sample = false }) {
  const etfs = {};
  for (const [id, bars] of Object.entries(seriesById)) etfs[id] = analyze(bars);
  const payload = {
    generatedAt: new Date().toISOString(),
    source,
    sample,
    etfs,
    correlation: correlationMatrix(seriesById, 252),
  };
  await mkdir(new URL('.', OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
  return payload;
}
