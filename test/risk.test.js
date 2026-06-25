import assert from 'node:assert/strict';
import test from 'node:test';
import { buildActionPlan, calculateResilienceScore } from '../lib/risk.js';

test('calculates a stronger score for healthy canopy and moderate weather', () => {
  const score = calculateResilienceScore({
    weather: {
      current: { temperature: 27, wind_speed: 10 },
      daily: [{ precipitation_probability: 45 }]
    },
    tree: {
      tree_density_per_acre: 40,
      canopy_coverage_pct: 45,
      confidence_score: 92,
      tree_health: { needs_care: 1, needs_replacement: 0 }
    }
  });

  assert.equal(score >= 80, true);
});

test('recommends water retention when rain probability is low', () => {
  const plan = buildActionPlan({
    score: 52,
    weather: {
      current: { temperature: 35, wind_speed: 9 },
      daily: [{ date: '2026-06-25', precipitation_probability: 12 }]
    },
    tree: {
      tree_density_per_acre: 14,
      canopy_coverage_pct: 18
    }
  });

  assert.equal(plan.some((item) => item.toLowerCase().includes('water retention')), true);
  assert.equal(plan.length > 1, true);
});

test('changes field work for a rainy hourly forecast', () => {
  const plan = buildActionPlan({
    score: 70,
    weather: {
      current: { temperature: 22, wind_speed: 7 },
      daily: [{ date: '2026-06-25', precipitation_probability: 93, precipitation_sum: 1.5 }],
      hourly: [
        { time: '2026-06-25T07:00', precipitation_probability: 0, wind_speed: 7, uv_index: 0 },
        { time: '2026-06-25T08:00', precipitation_probability: 10, wind_speed: 7, uv_index: 1 },
        { time: '2026-06-25T12:00', precipitation_probability: 76, wind_speed: 7, wind_gust: 17, uv_index: 4 },
        { time: '2026-06-25T13:00', precipitation_probability: 87, wind_speed: 7, wind_gust: 18, uv_index: 3 }
      ]
    },
    tree: {
      tree_density_per_acre: 35,
      canopy_coverage_pct: 40,
      tree_health: { needs_care: 2, needs_replacement: 1 }
    }
  });

  assert.equal(plan.some((item) => item.includes('12:00')), true);
  assert.equal(plan.some((item) => item.toLowerCase().includes('drainage')), true);
  assert.equal(plan.some((item) => item.includes('07:00')), true);
});
