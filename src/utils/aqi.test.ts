import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeterministicHistory,
  buildFavoriteAlertBody,
  calculateIndianAQI,
  findExceededFavoriteCities,
  formatCSVReport,
  formatTextSummary,
  getAQICategory,
  getHealthRecommendations,
} from './aqi';
import type { AirQualityPayload } from '../types';

test('calculateIndianAQI computes accurate CPCB sub-indices and dominant pollutant', () => {
  const good = calculateIndianAQI({ pm25: 15, pm10: 25, no2: 20, so2: 10, co: 0.5, o3: 30 });
  assert.equal(good.aqi <= 50, true);
  assert.equal(getAQICategory(good.aqi).label, 'Good');

  const severe = calculateIndianAQI({ pm25: 260, pm10: 320, no2: 70, so2: 20, co: 2.0, o3: 45 });
  assert.equal(severe.aqi >= 401, true);
  assert.equal(severe.dominantPollutant, 'PM2.5');
  assert.equal(getAQICategory(severe.aqi).label, 'Severe');
});

test('getAQICategory classifies all 6 requested AQI bands accurately', () => {
  assert.equal(getAQICategory(0).label, 'Good');
  assert.equal(getAQICategory(50).label, 'Good');
  assert.equal(getAQICategory(51).label, 'Satisfactory');
  assert.equal(getAQICategory(100).label, 'Satisfactory');
  assert.equal(getAQICategory(101).label, 'Moderate');
  assert.equal(getAQICategory(200).label, 'Moderate');
  assert.equal(getAQICategory(201).label, 'Poor');
  assert.equal(getAQICategory(300).label, 'Poor');
  assert.equal(getAQICategory(301).label, 'Very Poor');
  assert.equal(getAQICategory(400).label, 'Very Poor');
  assert.equal(getAQICategory(401).label, 'Severe');
  assert.equal(getAQICategory(500).label, 'Severe');
});

test('getHealthRecommendations tailors advice by demographic group and AQI level', () => {
  const kidsHigh = getHealthRecommendations(280, 'children');
  assert.equal(kidsHigh.group, 'children');
  assert.match(kidsHigh.maskAndVentilation, /N95|KN95/i);

  const generalGood = getHealthRecommendations(32, 'general');
  assert.equal(generalGood.group, 'general');
  assert.match(generalGood.exerciseSuggestion, /Outdoor/i);
});

test('buildDeterministicHistory returns exact requested lengths and deterministic values', () => {
  const fixedNow = new Date('2026-11-22T10:00:00.000Z');
  const h24a = buildDeterministicHistory('new-delhi', 220, 110, 190, '24h', fixedNow);
  const h24b = buildDeterministicHistory('new-delhi', 220, 110, 190, '24h', fixedNow);
  assert.equal(h24a.length, 24);
  assert.deepEqual(h24a, h24b);

  const d7 = buildDeterministicHistory('mumbai', 115, 58, 120, '7d', fixedNow);
  const d30 = buildDeterministicHistory('mumbai', 115, 58, 120, '30d', fixedNow);
  assert.equal(d7.length, 7);
  assert.equal(d30.length, 30);
});

test('formatCSVReport and formatTextSummary produce structured export strings', () => {
  const samplePayload: AirQualityPayload = {
    city: { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.97, lon: 77.59 },
    aqi: 62,
    status: 'Satisfactory',
    dominantPollutant: 'PM2.5',
    pollutants: { pm25: 36, pm10: 64, no2: 24, so2: 8, co: 0.7, o3: 38 },
    weather: { temperature: 25, humidity: 60, windSpeed: 12 },
    dataMode: 'model',
    dataSource: 'Open-Meteo CAMS (Live)',
    historyMode: 'model',
    lastUpdated: '2026-11-22T10:00:00.000Z',
    stations: [],
    history: { h24: [], d7: [], d30: [] },
  };
  const csv = formatCSVReport(samplePayload);
  assert.match(csv, /Bengaluru/);
  assert.match(csv, /PM2\.5,36,µg\/m³/);

  const summary = formatTextSummary(samplePayload);
  assert.match(summary, /AQI 62 \(Satisfactory\)/);
  assert.match(summary, /Open-Meteo CAMS/);
});

test('findExceededFavoriteCities and buildFavoriteAlertBody filter and format alerts accurately', () => {
  const sampleCities = [
    { id: 'bengaluru', name: 'Bengaluru', aqi: 98, status: 'Satisfactory' },
    { id: 'new-delhi', name: 'New Delhi', aqi: 233, status: 'Poor' },
    { id: 'mumbai', name: 'Mumbai', aqi: 188, status: 'Moderate' },
    { id: 'patna', name: 'Patna', aqi: 260, status: 'Poor' },
  ];
  const exceeded = findExceededFavoriteCities(sampleCities, ['bengaluru', 'new-delhi', 'mumbai'], 150);
  assert.deepEqual(
    exceeded.map((c) => c.id),
    ['new-delhi', 'mumbai']
  );

  assert.match(buildFavoriteAlertBody(exceeded, 150), /New Delhi \(233\), Mumbai \(188\) exceed your 150 AQI threshold/);
  assert.match(buildFavoriteAlertBody([exceeded[0]], 200), /New Delhi is at AQI 233 \(Poor\)/);
  assert.match(buildFavoriteAlertBody([], 300), /below your 300 AQI threshold/);
});

test('Hindi localization returns Devanagari health guidance and alert summaries', () => {
  const catHi = getAQICategory(240, 'hi');
  assert.match(catHi.summary, /सांस/);

  const kidsHi = getHealthRecommendations(280, 'children', 'hi');
  assert.equal(kidsHi.title, 'बच्चे और किशोर');
  assert.match(kidsHi.maskAndVentilation, /N95/);

  const alertHi = buildFavoriteAlertBody(
    [{ name: 'New Delhi', aqi: 233, status: 'Poor' }],
    200,
    'hi'
  );
  assert.match(alertHi, /200 AQI सीमा से अधिक/);
});

