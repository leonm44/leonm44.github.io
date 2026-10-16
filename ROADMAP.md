# Roadmap

## Done (v1)
- Five pages: Dashboard, Core, Satellite, Candlesticks 101, Methodology, plus a Legal notice page (footer)
- Daily data pipeline from Euronext (Yahoo Finance fallback) with validation; indicators computed and unit-tested in-house
- SVG candlestick charts with SMA 20/50/200, RSI 14, MACD 12/26/9
- Rule-based automatic summaries and last-candle pattern detection
- 1-year correlation matrix; clickable world map for the core ETFs
- Calendar-based performance windows, with reference dates shown
- Self-hosted fonts: no cookies, no tracking, no third-party requests
- GitHub Actions workflow: test, fetch, build, deploy to GitHub Pages
- Site live at https://leonm44.github.io

## Next
- [ ] **Bug report link** — "Report a bug" link in the footer pointing to the repository's GitHub Issues
      (https://github.com/leonm44/leonm44.github.io/issues/new), with an issue template (page, browser, what happened)
- [ ] **Logo** — design a proper logo (SVG) for the header, favicon and social preview image
- [ ] **New hero title** — replace "Understand the markets one candle at a time." with a stronger headline (shortlist to propose)
- [ ] **News section** — market analysis written by the author, published as Markdown files (one file per note,
      Astro content collection), newest first, each note dated and signed; the automatic data stays separate from the
      author's opinion. Every note carries the "not investment advice" disclaimer and stays educational (no buy/sell calls)
- [ ] **Personal watchlist page** — the visitor picks 3 ETFs and gets a unique code (no account, no sign-up).
      Static-site design: the code itself encodes the choice (e.g. `leonm44.github.io/my#k7f2`), so nothing is stored
      on a server and no personal data is collected. Entering the code or opening the link restores the page.
      Open question: limit the choice to the 6 tracked ETFs, or extend the data pipeline to a wider list
- [ ] About section: LinkedIn link and/or CV in PDF
- [ ] Keep-alive for the scheduled workflow (GitHub pauses scheduled jobs after 60 days without activity)
- [ ] Keep a history of daily data in the repository to remove the dependency on a single fetch
- [ ] "Download the data" button (raw daily prices as CSV) so anyone can check the figures

## Ideas
- Period selector on charts (3M / 6M / 1Y)
- Benchmark comparison chart (all six rebased to 100)
- Simple core/satellite portfolio simulator (weights → historical return and volatility)
- "Index vs ETF price" explainer (why the S&P 500 is ~7,000 points but the ETF share is ~€137)
- Social preview image (Open Graph)
