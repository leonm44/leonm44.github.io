export const url = (path = '') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

export const pct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(digits)}%`;

export const num = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined
    ? '—'
    : v.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const eur = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `€${num(v)}`);

export const tone = (v: number | null | undefined) =>
  v === null || v === undefined ? 'flat' : v > 0 ? 'up' : v < 0 ? 'down' : 'flat';

export const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
