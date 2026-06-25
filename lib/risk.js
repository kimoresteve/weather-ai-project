import { findWeatherWindows, formatDayLabel } from './weatherPresentation.js';

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
}

export function calculateResilienceScore({ weather = {}, tree = {} } = {}) {
  const temperature = numberFrom(weather, ['current.temperature', 'temperature', 'temp']);
  const rainChance = numberFrom(weather, ['daily.0.precipitation_probability', 'forecast.0.precipitation_probability', 'rain_probability']);
  const wind = numberFrom(weather, ['current.wind_speed', 'wind_speed', 'wind']);
  const treeDensity = numberFrom(tree, ['tree_density_per_acre', 'density']);
  const canopy = numberFrom(tree, ['canopy_coverage_pct', 'canopy']);
  const confidence = numberFrom(tree, ['confidence_score', 'confidence']);
  const needsCare = tree?.tree_health?.needs_care ?? 0;
  const needsReplacement = tree?.tree_health?.needs_replacement ?? 0;

  let score = 74;

  if (temperature > 32) score -= (temperature - 32) * 2.2;
  if (temperature < 12 && temperature > 0) score -= (12 - temperature) * 1.8;
  if (rainChance > 70) score -= 8;
  if (rainChance < 25) score -= 10;
  if (wind > 28) score -= 10;

  score += Math.min(treeDensity, 80) * 0.18;
  score += Math.min(canopy, 70) * 0.18;
  score += Math.min(confidence, 100) * 0.06;
  score -= needsCare * 2.5;
  score -= needsReplacement * 4;

  return Math.round(clamp(score));
}

export function buildActionPlan({ score, weather = {}, tree = {} } = {}) {
  const recommendations = [];
  const rainChance = numberFrom(weather, ['daily.0.precipitation_probability', 'forecast.0.precipitation_probability', 'rain_probability']);
  const rainAmount = numberFrom(weather, ['daily.0.precipitation_sum']);
  const temperature = numberFrom(weather, ['current.temperature', 'temperature', 'temp']);
  const wind = numberFrom(weather, ['current.wind_speed', 'wind_speed', 'wind']);
  const treeDensity = numberFrom(tree, ['tree_density_per_acre', 'density']);
  const canopy = numberFrom(tree, ['canopy_coverage_pct', 'canopy']);
  const needsCare = Number(tree?.tree_health?.needs_care || 0);
  const needsReplacement = Number(tree?.tree_health?.needs_replacement || 0);
  const windows = findWeatherWindows(weather.hourly || []);
  const dryDay = findBestDailyMatch(weather.daily, (day) => Number(day.precipitation_probability || 0) <= 25);
  const wetDay = findBestDailyMatch(weather.daily, (day) => Number(day.precipitation_probability || 0) >= 70);
  const windyDay = findBestDailyMatch(weather.daily, (day) => Number(day.wind_max || 0) >= 18);

  if (rainChance >= 70) {
    recommendations.push(
      windows.avoid
        ? `Avoid fertilizer or spraying around ${windows.avoid}; rain risk is high today.`
        : 'Avoid fertilizer or spraying during the wettest part of the day; rain risk is high.'
    );
    recommendations.push('Clear small drainage channels and keep harvested produce covered before the rain builds.');
  } else if (rainChance >= 40 || rainAmount > 0) {
    recommendations.push('Keep fertilizer covered and plan planting or spraying around the drier hours.');
  } else if (rainChance < 30) {
    recommendations.push(
      dryDay
        ? `Prioritize water retention through ${formatDayLabel(dryDay.date)}: mulch, weed, and check soil moisture.`
        : 'Prioritize water retention: mulch young trees and move irrigation to early morning.'
    );
  }

  if (windows.best) {
    recommendations.push(`Schedule scouting, pruning, or planting during the calmer window: ${windows.best}.`);
  }

  if (temperature > 32) {
    recommendations.push('High heat risk: shade seedlings, delay transplanting, and check soil moisture twice daily.');
  }

  if (wind > 24 || windyDay) {
    recommendations.push(
      windyDay
        ? `Stake weak seedlings before ${formatDayLabel(windyDay.date)}; stronger wind is expected.`
        : 'Wind alert: support weak stems and inspect boundary trees after gusts pass.'
    );
  }

  if (wetDay && rainChance < 70) {
    recommendations.push(`Prepare drainage before ${formatDayLabel(wetDay.date)}, the next wetter day in the forecast.`);
  }

  if (treeDensity < 20) {
    recommendations.push('Tree density is low; add nitrogen-fixing or fruit trees along contours to improve resilience.');
  }

  if (canopy < 25) {
    recommendations.push('Canopy cover is thin; target new planting near exposed soil to reduce evaporation.');
  }

  if (needsCare > 0) {
    recommendations.push(`Inspect the ${needsCare} trees marked as needing care and prioritize watering or pruning.`);
  }

  if (needsReplacement > 0) {
    recommendations.push(`Mark ${needsReplacement} missing or weak tree spots for replacement during the next dry window.`);
  }

  if (score < 55) {
    recommendations.push('Schedule a field walk within 48 hours and mark stressed or missing trees for replacement.');
  }

  return unique(recommendations).slice(0, 5);
}

export function numberFrom(source, paths) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, source);

    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }

  return 0;
}

function findBestDailyMatch(days = [], predicate) {
  return days.find((day) => predicate(day)) || null;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
