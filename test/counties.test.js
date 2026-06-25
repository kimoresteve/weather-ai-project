import assert from 'node:assert/strict';
import test from 'node:test';
import { kenyaCounties } from '../lib/counties.js';

test('includes all 47 Kenya counties', () => {
  assert.equal(kenyaCounties.length, 47);
  assert.equal(new Set(kenyaCounties).size, 47);
});

test('includes counties used by saved demo locations', () => {
  for (const county of ['Nairobi', 'Bomet', 'Kisumu', 'Uasin Gishu', 'Trans Nzoia']) {
    assert.equal(kenyaCounties.includes(county), true);
  }
});
