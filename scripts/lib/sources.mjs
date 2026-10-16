// Price sources. Each returns raw bars [{d,o,h,l,c,v}] (any order); validation
// and cleaning happen in clean() so both sources go through the same checks.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

/* ------------------------------------------------------------------ */
/* Euronext (official exchange data, CSV download used by live.euronext.com) */
/* ------------------------------------------------------------------ */

const iso = (dt) => dt.toISOString().slice(0, 10);

export function euronextUrl(isin, mic, years = 2) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCFullYear(end.getUTCFullYear() - years);
  start.setUTCDate(start.getUTCDate() - 7);
  const q = new URLSearchParams({
    format: 'csv',
    decimal_separator: '.',
    date_form: 'd/m/Y',
    op: '',
    adjusted: '',
    base100: '',
    startdate: iso(start),
    enddate: iso(end),
  });
  return `https://live.euronext.com/en/ajax/AwlHistoricalPrice/getFullDownloadAjax/${isin}-${mic}?${q}`;
}

/** Parses Euronext's CSV: Date;Open;High;Low;Last;Close;Number of Shares;... */
export function parseEuronextCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const h = lines.findIndex((l) => l.startsWith('Date;'));
  if (h < 0) throw new Error('unexpected CSV format (no "Date;" header)');
  const num = (s) => {
    const v = parseFloat(String(s ?? '').replace(/"/g, '').replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  };
  const bars = [];
  for (const line of lines.slice(h + 1)) {
    const f = line.split(';');
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f[0]?.replace(/"/g, ''));
    if (!m) continue;
    const c = num(f[5]) ?? num(f[4]);
    if (c === null) continue;
    const o = num(f[1]) ?? c;
    bars.push({ d: `${m[3]}-${m[2]}-${m[1]}`, o, h: num(f[2]) ?? Math.max(o, c), l: num(f[3]) ?? Math.min(o, c), c, v: num(f[6]) ?? 0 });
  }
  return bars;
}

export async function fromEuronext(etf) {
  const res = await fetch(euronextUrl(etf.isin, etf.mic), { headers: { 'User-Agent': UA, Accept: 'text/csv,*/*' } });
  if (!res.ok) throw new Error(`Euronext HTTP ${res.status}`);
  return parseEuronextCsv(await res.text());
}

/* ------------------------------------------------------------------ */
/* Yahoo Finance (fallback, unofficial chart endpoint)                 */
/* ------------------------------------------------------------------ */

export async function fromYahoo(etf) {
  let lastErr;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(etf.yahoo)}?range=2y&interval=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
      const r = (await res.json())?.chart?.result?.[0];
      if (!r) throw new Error('Yahoo empty result');
      if (r.meta.currency !== 'EUR') throw new Error(`Yahoo currency ${r.meta.currency}`);
      const q = r.indicators.quote[0];
      return r.timestamp
        .map((t, i) => ({ d: new Date(t * 1000).toISOString().slice(0, 10), o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] ?? 0 }))
        .filter((b) => b.c > 0);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/* ------------------------------------------------------------------ */
/* Cleaning and validation, shared by all sources                       */
/* ------------------------------------------------------------------ */

export const MIN_BARS = 260; // > 1 year: needed for SMA 200 and 1Y performance

export function clean(raw, label) {
  const r4 = (x) => +x.toFixed(4);
  const byDate = new Map();
  for (const b of raw) {
    if (![b.o, b.h, b.l, b.c].every((x) => x > 0)) continue;
    byDate.set(b.d, { d: b.d, o: r4(b.o), h: r4(Math.max(b.h, b.o, b.c)), l: r4(Math.min(b.l, b.o, b.c)), c: r4(b.c), v: Math.round(b.v || 0) });
  }
  const bars = [...byDate.values()].sort((a, b) => a.d.localeCompare(b.d));
  for (let i = 1; i < bars.length; i++) {
    const jump = Math.abs(bars[i].c / bars[i - 1].c - 1);
    if (jump > 0.25) throw new Error(`${label}: suspicious ${(jump * 100).toFixed(0)}% move on ${bars[i].d}`);
  }
  if (bars.length < MIN_BARS) throw new Error(`${label}: only ${bars.length} bars (need ${MIN_BARS})`);
  return bars;
}
