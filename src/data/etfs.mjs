// Single source of truth for the tracked universe.
// All products: Amundi, listed on Euronext Paris, quoted in EUR, accumulating.
// The pipeline fetches `isin`-`mic` from Euronext, with `yahoo` as fallback symbol.

export const ETFS = [
  {
    id: 'msci-world',
    sleeve: 'core',
    ticker: 'CW8',
    yahoo: 'CW8.PA',
    isin: 'LU1681043599',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi MSCI World Swap UCITS ETF EUR Acc',
    short: 'MSCI World',
    index: 'MSCI World',
    region: 'Developed markets, 23 countries',
    kind: 'ETF',
    replication: 'Synthetic (swap)',
    blurb:
      'More than 1,300 large and mid-cap companies across 23 developed countries. The default "one-fund" building block: roughly 70% US, then Japan, the UK and Europe.',
  },
  {
    id: 'sp500',
    sleeve: 'core',
    ticker: '500',
    yahoo: '500.PA',
    isin: 'LU1681048804',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi S&P 500 Swap UCITS ETF EUR Acc',
    short: 'S&P 500',
    index: 'S&P 500',
    region: 'United States, 500 large caps',
    kind: 'ETF',
    replication: 'Synthetic (swap)',
    blurb:
      'The 500 largest US companies, weighted by market value. Heavily tilted towards technology; for a euro investor, returns also move with the EUR/USD exchange rate.',
  },
  {
    id: 'stoxx-600',
    sleeve: 'core',
    ticker: 'MEUD',
    yahoo: 'MEUD.PA',
    isin: 'LU0908500753',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi Core STOXX Europe 600 UCITS ETF Acc',
    short: 'STOXX Europe 600',
    index: 'STOXX Europe 600',
    region: 'Europe, 17 countries incl. UK and Switzerland',
    kind: 'ETF',
    replication: 'Physical',
    blurb:
      '600 companies from 17 European countries, eurozone or not. More financials, industrials and healthcare than the US market, and no currency risk for a euro investor on the eurozone part.',
  },
  {
    id: 'em-asia',
    sleeve: 'satellite',
    ticker: 'AASI',
    yahoo: 'AASI.PA',
    isin: 'LU1681044480',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi MSCI EM Asia UCITS ETF EUR Acc',
    short: 'Emerging Asia',
    index: 'MSCI Emerging Markets Asia',
    region: 'China, Taiwan, India, Korea and 4 others',
    kind: 'ETF',
    replication: 'Synthetic (swap)',
    blurb:
      'Large and mid caps from eight emerging Asian economies. Dominated by China, Taiwan (semiconductors), India and South Korea: higher growth potential, higher volatility.',
  },
  {
    id: 'em-latam',
    sleeve: 'satellite',
    ticker: 'ALAT',
    yahoo: 'ALAT.PA',
    isin: 'LU1681045024',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi MSCI EM Latin America UCITS ETF EUR Acc',
    short: 'Emerging Latin America',
    index: 'MSCI Emerging Markets Latin America',
    region: 'Brazil, Mexico, Chile, Colombia, Peru',
    kind: 'ETF',
    replication: 'Synthetic (swap)',
    blurb:
      'Five Latin American markets, led by Brazil and Mexico. Strongly linked to commodities, banks and local currencies: a classic high-beta satellite.',
  },
  {
    id: 'gold',
    sleeve: 'satellite',
    ticker: 'GOLD',
    yahoo: 'GOLD.PA',
    isin: 'FR0013416716',
    mic: 'XPAR', // Euronext Paris
    name: 'Amundi Physical Gold ETC',
    short: 'Gold',
    index: 'LBMA Gold Price',
    region: 'Physical gold held in a vault',
    kind: 'ETC',
    replication: 'Physical (allocated bars)',
    blurb:
      'Not a fund but an ETC: a debt security backed by physical gold bars. No earnings, no dividends; holds value when confidence in currencies or equities falls.',
  },
];

export const SLEEVES = {
  core: {
    title: 'Core',
    tagline: 'The foundation: broad, cheap, long-term.',
  },
  satellite: {
    title: 'Satellite',
    tagline: 'Smaller positions for diversification or a specific view.',
  },
};

export const byId = Object.fromEntries(ETFS.map((e) => [e.id, e]));
