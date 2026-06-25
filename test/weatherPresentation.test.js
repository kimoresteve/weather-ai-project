import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTodayAdvice, conditionLabel, findWeatherWindows, formatDayLabel } from '../lib/weatherPresentation.js';

test('maps common WeatherAI condition codes to readable labels', () => {
  assert.equal(conditionLabel('51'), 'Light drizzle');
  assert.equal(conditionLabel(3), 'Overcast');
});

test('formats a stable day label from an ISO date', () => {
  assert.equal(formatDayLabel('2026-06-25'), 'Thu 25');
});

test('finds practical work and avoid windows from hourly forecast', () => {
  const hourly = [
    { time: '2026-06-25T07:00', precipitation_probability: 0, wind_speed: 7, uv_index: 0 },
    { time: '2026-06-25T08:00', precipitation_probability: 10, wind_speed: 7, uv_index: 1 },
    { time: '2026-06-25T12:00', precipitation_probability: 76, wind_speed: 7, wind_gust: 17, uv_index: 4 },
    { time: '2026-06-25T13:00', precipitation_probability: 87, wind_speed: 7, wind_gust: 18, uv_index: 3 }
  ];

  assert.deepEqual(findWeatherWindows(hourly), {
    best: '07:00–09:00',
    avoid: '12:00–14:00'
  });
});

test('builds a practical rain advice sentence', () => {
  const advice = buildTodayAdvice({
    daily: [{ precipitation_probability: 93, precipitation_sum: 1.5 }],
    hourly: [
      { time: '2026-06-25T12:00', precipitation_probability: 76 },
      { time: '2026-06-25T13:00', precipitation_probability: 87 }
    ]
  });

  assert.match(advice, /Rain is likely today/);
  assert.match(advice, /12:00/);
});
