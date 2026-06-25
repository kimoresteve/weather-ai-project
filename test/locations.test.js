import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveKnownLocation } from '../lib/locations.js';

test('resolves a friendly location name to coordinates', () => {
  const location = resolveKnownLocation('Bomet, Kenya');

  assert.equal(location.county, 'Bomet');
  assert.equal(location.lat, '-0.781290');
  assert.equal(location.lon, '35.341560');
});

test('resolves county-only input for quick demos', () => {
  const location = resolveKnownLocation('kisumu');

  assert.equal(location.name, 'Kisumu, Kenya');
});
