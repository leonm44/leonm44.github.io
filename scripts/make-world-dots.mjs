// One-off generator for the dotted world map on the dashboard.
// Samples a regular lon/lat grid, keeps the points that fall on land
// (Natural Earth 1:50m via world-atlas) and tags each point with the indices
// it belongs to. Output is committed (src/data/world-dots.json), so the site
// build does not depend on these packages.
//   npm run data:map

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const require = createRequire(import.meta.url);
const topo = JSON.parse(await readFile(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const countries = feature(topo, topo.objects.countries).features;

// ISO 3166-1 numeric codes.
const STOXX600 = ['040', '056', '208', '246', '250', '276', '372', '380', '442', '528', '578', '616', '620', '724', '752', '756', '826'];
const MSCI_WORLD = [
  '840', '124', // North America
  '040', '056', '208', '246', '250', '276', '372', '376', '380', '528', '578', '620', '724', '752', '756', '826', // Europe & Middle East
  '036', '344', '392', '554', '702', // Pacific
];
const SP500 = ['840'];

const STEP = 2.6; // degrees between dots
const LAT_MAX = 78;
const LAT_MIN = -56;

const dots = [];
for (let lat = LAT_MAX; lat >= LAT_MIN; lat -= STEP) {
  // stagger every other row for a nicer texture
  const row = Math.round((LAT_MAX - lat) / STEP);
  for (let lon = -180 + (row % 2 ? STEP / 2 : 0); lon < 180; lon += STEP) {
    const c = countries.find((f) => geoContains(f, [lon, lat]));
    if (!c) continue;
    const id = String(c.id).padStart(3, '0');
    dots.push(tag(lon, lat, id));
  }
}

// Small markets the grid misses entirely.
for (const [lon, lat, id] of [
  [114.17, 22.3, '344'], // Hong Kong
  [103.82, 1.35, '702'], // Singapore
  [6.13, 49.61, '442'], // Luxembourg
  [35.0, 31.5, '376'], // Israel
]) {
  if (!dots.some((d) => Math.abs(d.lon - lon) < STEP * 0.6 && Math.abs(d.lat - lat) < STEP * 0.6)) dots.push(tag(lon, lat, id));
}

function tag(lon, lat, id) {
  // European countries' overseas territories (French Guiana, Svalbard...) are not
  // part of the indices' home markets: keep them neutral on the map.
  const inEurope = lon > -30 && lon < 45 && lat > 34 && lat < 72;
  if (!inEurope && STOXX600.includes(id)) id = 'overseas';
  return {
    lon: +lon.toFixed(2),
    lat: +lat.toFixed(2),
    w: MSCI_WORLD.includes(id) ? 1 : 0,
    s: SP500.includes(id) ? 1 : 0,
    x: STOXX600.includes(id) ? 1 : 0,
  };
}

await writeFile(new URL('../src/data/world-dots.json', import.meta.url), JSON.stringify({ step: STEP, latMax: LAT_MAX, latMin: LAT_MIN, dots }));
console.log(`${dots.length} dots (${dots.filter((d) => d.w).length} MSCI World, ${dots.filter((d) => d.s).length} S&P 500, ${dots.filter((d) => d.x).length} STOXX 600)`);
