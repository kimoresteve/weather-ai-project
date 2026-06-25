import { demoTreeAnalysis, hasWeatherAiKey, weatherAiFetch } from '../../../../lib/weatherAi.js';

export async function POST(request) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const image = formData.get('image');
  if (!image || typeof image === 'string') {
    return Response.json({ error: 'A farm image is required' }, { status: 400 });
  }

  if (!hasWeatherAiKey()) {
    return Response.json(demoTreeAnalysis(), { headers: { 'x-demo-mode': 'true' } });
  }

  try {
    const data = await weatherAiFetch('/v1/trees/analyze', {
      method: 'POST',
      body: formData
    });

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error.message, details: error.payload || null },
      { status: error.status || 502 }
    );
  }
}
