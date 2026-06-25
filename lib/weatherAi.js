export const WEATHER_AI_BASE_URL = process.env.WEATHER_AI_BASE_URL || 'https://api.weather-ai.co';

export function hasWeatherAiKey() {
  return Boolean(process.env.WEATHER_AI_API_KEY);
}

export async function weatherAiFetch(path, init = {}) {
  if (!process.env.WEATHER_AI_API_KEY) {
    throw new Error('WEATHER_AI_API_KEY is not configured');
  }

  const response = await fetch(`${WEATHER_AI_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.WEATHER_AI_API_KEY}`,
      ...(init.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || payload?.error || 'WeatherAI request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function demoWeather() {
  return {
    source: 'demo',
    location: { name: 'Demo farm plot', lat: -1.286389, lon: 36.817223 },
    current: {
      temperature: 29,
      condition: 'Partly cloudy',
      wind_speed: 18,
      humidity: 63
    },
    daily: [
      { date: 'Today', precipitation_probability: 42, temperature_max: 30, temperature_min: 19 },
      { date: 'Tomorrow', precipitation_probability: 22, temperature_max: 32, temperature_min: 18 },
      { date: 'Day 3', precipitation_probability: 68, temperature_max: 28, temperature_min: 17 }
    ],
    ai_summary: 'Warm conditions with mixed rainfall odds. Protect new seedlings from afternoon heat and keep irrigation flexible.'
  };
}

export function demoTreeAnalysis() {
  return {
    source: 'demo',
    analysis_id: 'demo-tree-analysis',
    total_tree_count: 43,
    tree_density_per_acre: 28,
    confidence_score: 86,
    canopy_coverage_pct: 31,
    tree_health: {
      healthy: 34,
      needs_care: 7,
      needs_replacement: 2
    },
    tree_species_guess: ['grevillea', 'mango', 'acacia'],
    observations: [
      'Tree distribution is strong near the upper boundary.',
      'Several young trees appear exposed to direct afternoon sun.'
    ],
    recommendations: [
      'Add mulch rings around young trees.',
      'Replace missing trees near the lower contour.',
      'Use mixed species to improve drought resilience.'
    ]
  };
}
