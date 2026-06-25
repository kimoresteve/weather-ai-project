# Shamba Guardian

Shamba Guardian is a small WeatherAI developer-platform project for checking a farm plot before field work. A user enters a location, uploads a plot image, and gets a short summary of the week’s weather, tree cover, and suggested tasks.

## What it uses

- `GET /v1/weather` for forecast context.
- `POST /v1/trees/analyze` for tree count, canopy coverage, tree health, and recommendations.
- Server-side API routes so the WeatherAI API key is never exposed in the browser.
- A small built-in Kenya location resolver that converts friendly place names into coordinates for WeatherAI.
- Demo-mode fallback data so reviewers can try the UI even without an API key.

## Tech stack

- JavaScript
- Next.js App Router
- React
- Node test runner

## Getting started

Use Node.js 22.13.0 or newer.

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your WeatherAI key:

```bash
WEATHER_AI_API_KEY=wai_your_key_here
WEATHER_AI_BASE_URL=https://api.weather-ai.co
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

The tests cover the resilience scoring and action-plan logic.

## Deployment

This app is ready for Vercel, Netlify, Render, or Railway.

Set these environment variables in your hosting provider:

```bash
WEATHER_AI_API_KEY=wai_your_key_here
WEATHER_AI_BASE_URL=https://api.weather-ai.co
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

## Architecture notes

Browser requests go to local Next.js API routes:

```text
UI -> /api/weather        -> WeatherAI /v1/weather
UI -> /api/trees/analyze  -> WeatherAI /v1/trees/analyze
```

This keeps credentials server-side, normalizes WeatherAI errors, and gives the UI a stable contract. If `WEATHER_AI_API_KEY` is missing, the API routes return realistic demo data with an `x-demo-mode` response header.

## Why this project

Weather data is more useful when it leads to a decision. Shamba Guardian combines forecast risk, tree density, canopy coverage, and tree health into a simple plot condition score and a short field-work checklist.
