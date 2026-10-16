# Roadmap

## Done (v1)
- Five pages: Dashboard, Core, Satellite, Candlesticks 101, Methodology
- Daily data pipeline with validation, indicators computed and unit-tested in-house
- SVG candlestick charts with SMA 20/50/200, RSI 14, MACD 12/26/9
- Rule-based automatic summaries and last-candle pattern detection
- 1-year correlation matrix
- GitHub Actions workflow: test, fetch, build, deploy to GitHub Pages

## Next
- [ ] Publish the repository `leonm44.github.io` and enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
- [ ] Check the first real-data run (tickers, EUR prices, no gaps)
- [ ] About section: LinkedIn link and/or CV in PDF
- [ ] Keep a history of daily data in the repository to remove the dependency on a single fetch

## Ideas
- Period selector on charts (3M / 6M / 1Y)
- Benchmark comparison chart (all six rebased to 100)
- Simple core/satellite portfolio simulator (weights → historical return and volatility)
- Social preview image (Open Graph)
