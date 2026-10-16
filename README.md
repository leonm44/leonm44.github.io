# Leon Market Compass

A small, fully static website that follows six euro-listed ETFs (three core, three satellite), draws their daily candlestick charts and explains the classic technical indicators in plain English.

Live site: https://leonm44.github.io

## What it shows

| Page | Content |
|---|---|
| Dashboard | Six cards with sparkline, 1M / YTD / 1Y performance, trend and RSI; comparison table |
| Core | MSCI World, S&P 500, STOXX Europe 600: candlestick charts with SMA 20/50/200, RSI and MACD, key numbers, automatic reading |
| Satellite | Emerging Asia, Emerging Latin America, Gold, plus a 1-year correlation matrix of the six |
| Candlesticks 101 | Anatomy of a candle, six classic patterns, interactive chart on real data |
| Methodology | Data source, pipeline, every formula, summary rules, limits |

## How it works

```
GitHub Actions (weekdays, after Euronext close)
  └─ scripts/fetch-data.mjs   download 2 years of daily OHLCV (Yahoo Finance), validate
       └─ scripts/lib/analyze.mjs      performance, risk, indicators, pattern, text summary
            └─ src/data/market.json
                 └─ astro build → static HTML + SVG charts → GitHub Pages
```

- Indicators (SMA, EMA, RSI Wilder, MACD, volatility, drawdown, correlation) are implemented from scratch in `scripts/lib/indicators.mjs` and unit-tested (`npm test`), including against Wilder's published RSI example.
- Charts are server-rendered SVG: no charting library, almost no client-side JavaScript.
- If a data series fails validation the job stops, so the last good version of the site stays online.

## Run locally

```bash
npm install
npm run data:sample   # simulated data, offline (a banner flags it on every page)
# or: npm run data:fetch   # real data, needs internet access to Yahoo Finance
npm run dev           # http://localhost:4321
```

## Stack

Astro (static output), plain CSS, Node 22 scripts, GitHub Actions, GitHub Pages.

## Disclaimer

Educational project. Nothing on this site is investment advice.
