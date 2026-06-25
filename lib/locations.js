export const knownLocations = [
  { name: 'Nairobi, Kenya', county: 'Nairobi', lat: '-1.286389', lon: '36.817223' },
  { name: 'Bomet, Kenya', county: 'Bomet', lat: '-0.781290', lon: '35.341560' },
  { name: 'Kisumu, Kenya', county: 'Kisumu', lat: '-0.091702', lon: '34.767956' },
  { name: 'Eldoret, Kenya', county: 'Uasin Gishu', lat: '0.514277', lon: '35.269779' },
  { name: 'Nakuru, Kenya', county: 'Nakuru', lat: '-0.303099', lon: '36.080025' },
  { name: 'Mombasa, Kenya', county: 'Mombasa', lat: '-4.043477', lon: '39.668206' },
  { name: 'Machakos, Kenya', county: 'Machakos', lat: '-1.517684', lon: '37.263414' },
  { name: 'Nyeri, Kenya', county: 'Nyeri', lat: '-0.420130', lon: '36.947590' },
  { name: 'Meru, Kenya', county: 'Meru', lat: '0.046260', lon: '37.655870' },
  { name: 'Kitale, Kenya', county: 'Trans Nzoia', lat: '1.015720', lon: '35.006220' }
];

export function resolveKnownLocation(input) {
  const normalized = normalizeLocation(input);
  if (!normalized) return null;

  return (
    knownLocations.find((location) => normalizeLocation(location.name) === normalized) ||
    knownLocations.find((location) => normalizeLocation(location.name).startsWith(normalized)) ||
    knownLocations.find((location) => normalizeLocation(location.county) === normalized) ||
    null
  );
}

function normalizeLocation(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
