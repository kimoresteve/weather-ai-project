const conditionLabels = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm'
};

export function conditionLabel(code, fallback = 'Forecast') {
  return conditionLabels[Number(code)] || fallback;
}

export function formatDayLabel(dateString) {
  if (!dateString) return 'Day';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const date = new Date(`${dateString}T00:00:00Z`);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${weekdays[date.getUTCDay()]} ${date.getUTCDate()}`;
}

export function formatHour(timeString) {
  return String(timeString || '').split('T')[1]?.slice(0, 5) || '--:--';
}

export function buildTodayAdvice(weather = {}) {
  const today = weather.daily?.[0] || {};
  const rainChance = Number(today.precipitation_probability || 0);
  const rainAmount = Number(today.precipitation_sum || 0);
  const maxTemp = Number(today.temp_max || weather.current?.temperature || 0);
  const avoidWindow = findWeatherWindows(weather.hourly).avoid;

  if (rainChance >= 70) {
    return `Rain is likely today${avoidWindow ? `, especially around ${avoidWindow}` : ''}. Handle spraying, fertilizer, and harvest work early if possible.`;
  }

  if (rainAmount > 0 && rainChance >= 40) {
    return 'Some rain is possible. Keep fertilizer covered and plan field movement around the drier hours.';
  }

  if (maxTemp >= 30) {
    return 'Warm conditions ahead. Prioritize watering, shade young seedlings, and avoid transplanting during the hottest hours.';
  }

  return 'Weather is fairly workable. Use the clearer hours for field checks, planting, or tree maintenance.';
}

export function findWeatherWindows(hourly = []) {
  const todayHours = hourly.filter((hour) => {
    const hourNumber = Number(formatHour(hour.time).slice(0, 2));
    return hourNumber >= 6 && hourNumber <= 18;
  });

  const best = firstWindow(todayHours, (hour) => {
    return Number(hour.precipitation_probability || 0) <= 30 && Number(hour.wind_speed || 0) <= 18 && Number(hour.uv_index || 0) <= 6;
  });

  const avoid = firstWindow(todayHours, (hour) => {
    return Number(hour.precipitation_probability || 0) >= 70 || Number(hour.wind_gust || 0) >= 28 || Number(hour.uv_index || 0) >= 8;
  });

  return { best, avoid };
}

function firstWindow(hours, predicate) {
  let run = [];

  for (const hour of hours) {
    if (predicate(hour)) {
      run.push(hour);
      continue;
    }

    if (run.length >= 2) return formatWindow(run);
    run = [];
  }

  if (run.length >= 2) return formatWindow(run);
  if (run.length === 1) return formatHour(run[0].time);
  return '';
}

function formatWindow(hours) {
  const start = formatHour(hours[0].time);
  const lastHour = Number(formatHour(hours.at(-1).time).slice(0, 2));
  const end = Number.isFinite(lastHour) ? `${String(Math.min(lastHour + 1, 23)).padStart(2, '0')}:00` : formatHour(hours.at(-1).time);

  return `${start}–${end}`;
}
