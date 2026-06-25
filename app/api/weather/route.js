import { demoWeather, hasWeatherAiKey, weatherAiFetch } from '../../../lib/weatherAi.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const days = searchParams.get('days') || '7';
  const units = searchParams.get('units') || 'metric';
  const lang = searchParams.get('lang') || 'en';

  if (!lat || !lon) {
    return Response.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  if (!hasWeatherAiKey()) {
    return Response.json(demoWeather(), { headers: { 'x-demo-mode': 'true' } });
  }

  try {
    const data = await weatherAiFetch(`/v1/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=${encodeURIComponent(days)}&units=${encodeURIComponent(units)}&lang=${encodeURIComponent(lang)}&ai=true`);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error.message, details: error.payload || null },
      { status: error.status || 502 }
    );
  }
}
