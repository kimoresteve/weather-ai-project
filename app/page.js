'use client';

import { useMemo, useState } from 'react';
import { buildActionPlan, calculateResilienceScore } from '../lib/risk.js';
import { kenyaCounties } from '../lib/counties.js';
import { knownLocations, resolveKnownLocation } from '../lib/locations.js';
import { buildTodayAdvice, conditionLabel, findWeatherWindows, formatDayLabel } from '../lib/weatherPresentation.js';

const initialFarm = {
  farmerId: 'stephen-demo',
  county: 'Nairobi',
  landAcres: '1.5',
  location: 'Nairobi, Kenya',
  lat: '-1.286389',
  lon: '36.817223',
  notes: 'Mixed fruit and shade trees near a small vegetable plot.'
};

export default function Home() {
  const [farm, setFarm] = useState(initialFarm);
  const [image, setImage] = useState(null);
  const [weather, setWeather] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const score = useMemo(() => {
    if (!weather || !tree) return 0;
    return calculateResilienceScore({ weather, tree });
  }, [weather, tree]);

  const actionPlan = useMemo(() => {
    if (!weather || !tree) return [];
    const generated = buildActionPlan({ score, weather, tree });
    return uniqueList([...generated, ...(tree.recommendations || [])]).slice(0, 6);
  }, [score, weather, tree]);

  const weatherWindows = useMemo(() => {
    if (!weather) return { best: '', avoid: '' };
    return findWeatherWindows(weather.hourly);
  }, [weather]);

  async function runAnalysis(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setDemoMode(false);

    try {
      const resolvedFarm = resolveFarmLocation(farm);
      const weatherResponse = await fetch(`/api/weather?lat=${encodeURIComponent(resolvedFarm.lat)}&lon=${encodeURIComponent(resolvedFarm.lon)}&days=7&units=metric&lang=en`);
      const weatherPayload = await weatherResponse.json();
      if (!weatherResponse.ok) throw new Error(weatherPayload.error || 'Weather analysis failed');

      const treeForm = new FormData();
      treeForm.append('image', image || makeDemoImage());
      treeForm.append('farmerId', resolvedFarm.farmerId);
      treeForm.append('county', resolvedFarm.county);
      treeForm.append('landAcres', resolvedFarm.landAcres);
      treeForm.append('location', resolvedFarm.location);
      treeForm.append('notes', resolvedFarm.notes);

      const treeResponse = await fetch('/api/trees/analyze', {
        method: 'POST',
        body: treeForm
      });
      const treePayload = await treeResponse.json();
      if (!treeResponse.ok) throw new Error(treePayload.error || 'Tree analysis failed');

      setFarm(resolvedFarm);
      setWeather(weatherPayload);
      setTree(treePayload);
      setDemoMode(weatherResponse.headers.get('x-demo-mode') === 'true' || treeResponse.headers.get('x-demo-mode') === 'true');
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateFarm(field, value) {
    setFarm((current) => {
      const updated = { ...current, [field]: value };
      if (field !== 'location') return updated;

      const match = resolveKnownLocation(value);
      if (!match) return updated;

      return {
        ...updated,
        county: match.county,
        lat: match.lat,
        lon: match.lon
      };
    });
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="card">
          <p className="eyebrow">Farm planning tool</p>
          <h1>Shamba Guardian</h1>
          <p className="lead">
            Check the week ahead for a farm plot, review tree cover, and leave with a short list of
            jobs worth doing before the weather changes.
          </p>
          <div className="hero-points">
            <span className="pill">7-day outlook</span>
            <span className="pill">Tree cover</span>
            <span className="pill">Field notes</span>
          </div>
        </div>

        <div className="card status-card">
          <div>
            <p className="eyebrow">Plot condition</p>
            <div className="score" style={{ '--score': `${score}%` }}>
              <span>{score || '--'}</span>
            </div>
            <p className="muted">
              {score
                ? score >= 75
                  ? 'Strong plot. Keep monitoring heat and rainfall shifts.'
                  : score >= 55
                    ? 'Moderate risk. A few focused interventions will help.'
                    : 'High risk. Prioritize field checks and water planning.'
                : 'Run an analysis to generate a farm-specific score.'}
            </p>
          </div>
          {demoMode && <span className="api-badge">Sample data shown — add a WeatherAI key for live results</span>}
        </div>
      </section>

      <section className="workspace">
        <form className="card form" onSubmit={runAnalysis}>
          <h2>Check a farm plot</h2>
          <label>
            Farm location
            <input
              list="known-locations"
              placeholder="Try Nairobi, Bomet, Kisumu, Eldoret…"
              value={farm.location}
              onChange={(event) => updateFarm('location', event.target.value)}
              required
            />
            <datalist id="known-locations">
              {knownLocations.map((location) => (
                <option key={location.name} value={location.name} />
              ))}
            </datalist>
          </label>
          <p className="helper">
            Choose a saved location or type your own. Coordinates are available if you need them.
          </p>
          <details className="advanced">
            <summary>Advanced coordinates</summary>
            <div className="grid-2 advanced-grid">
              <label>
                Latitude
                <input value={farm.lat} onChange={(event) => updateFarm('lat', event.target.value)} required />
              </label>
              <label>
                Longitude
                <input value={farm.lon} onChange={(event) => updateFarm('lon', event.target.value)} required />
              </label>
            </div>
          </details>
          <div className="grid-2">
            <label>
              County
              <input
                list="kenya-counties"
                placeholder="Select county"
                value={farm.county}
                onChange={(event) => updateFarm('county', event.target.value)}
              />
              <datalist id="kenya-counties">
                {kenyaCounties.map((county) => (
                  <option key={county} value={county} />
                ))}
              </datalist>
            </label>
            <label>
              Land acres
              <input value={farm.landAcres} onChange={(event) => updateFarm('landAcres', event.target.value)} />
            </label>
          </div>
          <label>
            Farm image
            <input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => setImage(event.target.files?.[0] || null)} />
          </label>
          <p className="helper">
            Use a JPEG, PNG, or WEBP image. If you skip this, the app sends a small PNG placeholder.
          </p>
          <label>
            Field notes
            <textarea rows={4} value={farm.notes} onChange={(event) => updateFarm('notes', event.target.value)} />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="button" disabled={loading}>
            {loading ? 'Checking plot…' : 'Check plot'}
          </button>
          <button className="secondary-button" type="button" onClick={() => setFarm(initialFarm)}>
            Reset form
          </button>
        </form>

        <div className="results">
          {!weather || !tree ? (
            <div className="card empty">
              <div className="empty-inner">
                <h2>Start with a plot check</h2>
                <p className="muted">
                  Enter a location, add a farm image, and get a practical summary of weather,
                  tree cover, and the next field tasks.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <h2>Plot summary</h2>
                <div className="metric-grid">
                  <Metric label="Temperature" value={`${displayNumber(weather.current?.temperature)}°C`} />
                  <Metric label="Rain odds" value={`${displayNumber(weather.daily?.[0]?.precipitation_probability)}%`} />
                  <Metric label="Trees found" value={displayNumber(tree.total_tree_count)} />
                  <Metric label="Canopy" value={`${displayNumber(tree.canopy_coverage_pct)}%`} />
                </div>
              </div>

              <div className="card weather-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Weather notes</p>
                    <h2>Plan the next few days</h2>
                  </div>
                  <span className="location-chip">{farm.location}</span>
                </div>

                <div className="weather-layout">
                  <div className="now-panel">
                    <span className="weather-icon">{weatherIcon(weather.current?.condition_code)}</span>
                    <div>
                      <span className="now-temp">{displayNumber(weather.current?.temperature)}°C</span>
                      <p className="muted">
                        {conditionLabel(weather.current?.condition_code, weather.current?.condition || 'Current weather')}
                      </p>
                    </div>
                    <dl className="weather-facts">
                      <div>
                        <dt>Wind</dt>
                        <dd>{displayNumber(weather.current?.wind_speed)} km/h</dd>
                      </div>
                      <div>
                        <dt>Today rain</dt>
                        <dd>{displayNumber(weather.daily?.[0]?.precipitation_probability)}%</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="advice-panel">
                    <h3>Today’s field note</h3>
                    <p>{buildTodayAdvice(weather)}</p>
                  </div>
                </div>

                <div className="forecast-strip">
                  {(weather.daily || []).slice(0, 7).map((day) => (
                    <article className="forecast-day" key={day.date}>
                      <span>{formatDayLabel(day.date)}</span>
                      <strong>{displayNumber(day.temp_max)}°</strong>
                      <small>{displayNumber(day.temp_min)}° low</small>
                      <small>{conditionLabel(day.condition_code)}</small>
                      <small>Rain {displayNumber(day.precipitation_probability)}%</small>
                    </article>
                  ))}
                </div>

                <div className="window-grid">
                  <div className="window-card good">
                    <span>Best work window</span>
                    <strong>{weatherWindows.best || 'Check hourly forecast'}</strong>
                    <p>Lower rain and wind risk for field tasks.</p>
                  </div>
                  <div className="window-card caution">
                    <span>Avoid if possible</span>
                    <strong>{weatherWindows.avoid || 'No clear risk window'}</strong>
                    <p>Higher rain, wind, or heat risk.</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Suggested field work</h2>
                <ul className="recommendations">
                  {actionPlan.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2>Tree health</h2>
                <div className="metric-grid">
                  <Metric label="Healthy" value={displayNumber(tree.tree_health?.healthy)} />
                  <Metric label="Needs care" value={displayNumber(tree.tree_health?.needs_care)} />
                  <Metric label="Replace" value={displayNumber(tree.tree_health?.needs_replacement)} />
                  <Metric label="Confidence" value={`${displayNumber(tree.confidence_score)}%`} />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <p className="footer">
        Uses WeatherAI weather and tree analysis endpoints. Built with Next.js.
      </p>
    </main>
  );
}

function resolveFarmLocation(farm) {
  const match = resolveKnownLocation(farm.location);
  if (!match) return farm;

  return {
    ...farm,
    county: farm.county || match.county,
    lat: match.lat,
    lon: match.lon
  };
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span className="muted">{label}</span>
    </div>
  );
}

function displayNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return Math.round(numeric);
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

function weatherIcon(code) {
  const numericCode = Number(code);
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(numericCode)) return '☔';
  if ([2, 3].includes(numericCode)) return '☁️';
  if ([45, 48].includes(numericCode)) return '🌫️';
  if (numericCode === 95) return '⛈️';
  return '☀️';
}

function makeDemoImage() {
  const base64Png =
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAAsTAAALEwEAmpwYAAABOElEQVR4nO3bQQ6CQBAAQe5/6Zk9GE82idpAiiqXqQvE0VFs7tqZgG8r7wJwXgQMAgwADgIMAgoADAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDAIKAgwCCgIMAgoCDgOvKYRhGkX3f5/P5+Xy+7/tarVYqlUrbtn3f96qqOp1Oq9VqvV7v9Xq9Xq/X6/X6/f5wOBxGo9Ho9Xq9Xq/X6/X6/f4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4fD4/AHB4Pj9N4u6pAAAAAElFTkSuQmCC';
  const bytes = Uint8Array.from(atob(base64Png), (character) => character.charCodeAt(0));

  return new File([bytes], 'demo-farm.png', { type: 'image/png' });
}
