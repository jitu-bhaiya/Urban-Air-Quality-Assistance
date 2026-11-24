import { INDIAN_CITIES, findCitySeedById } from '../src/data/cities.ts';
import type {
  AirQualityPayload,
  CitySeed,
  CitySummary,
  DataMode,
  HistoryPoint,
  MonitoringStation,
  PollutantReadings,
  WeatherReadings,
} from '../src/types.ts';
import {
  buildDeterministicHistory,
  calculateIndianAQI,
  getAQICategory,
} from '../src/utils/aqi.ts';
import {
  formatNominatimPlace,
  haversineDistanceKm,
  type NominatimAddress,
} from '../src/utils/location.ts';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000;
const payloadCache = new Map<string, CacheEntry<AirQualityPayload>>();

async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'BreatheWell-App/1.0' },
    });
  } finally {
    clearTimeout(timer);
  }
}

interface OpenMeteoAirResponse {
  current?: {
    time?: string;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    carbon_monoxide?: number; // µg/m³ in Open-Meteo
    ozone?: number;
    us_aqi?: number;
    european_aqi?: number;
  };
  hourly?: {
    time?: string[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
  };
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    apparent_temperature?: number;
  };
}

interface OpenAQResponse {
  results?: Array<{
    id?: number;
    name?: string;
    locality?: string;
    coordinates?: { latitude?: number; longitude?: number };
    datetimeLast?: { utc?: string };
  }>;
}

function round1(v: number | undefined | null): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.round(v * 10) / 10;
}

function buildSimulatedPayload(
  city: { id: string; name: string; state: string; country: string; lat: number; lon: number },
  seed?: CitySeed
): AirQualityPayload {
  const now = new Date();
  const pollutants: PollutantReadings = seed
    ? { ...seed.baselinePollutants }
    : { pm25: 58, pm10: 112, no2: 36, so2: 12, co: 1.0, o3: 42 };

  const weather: WeatherReadings = seed
    ? { ...seed.baselineWeather }
    : { temperature: 27, humidity: 60, windSpeed: 10 };

  const { aqi, dominantPollutant } = calculateIndianAQI(pollutants);
  const category = getAQICategory(aqi);

  const stations: MonitoringStation[] = seed
    ? seed.stations.map((s) => {
        const sPm25 = Math.round((pollutants.pm25 ?? 50) * s.factor);
        const sPm10 = Math.round((pollutants.pm10 ?? 100) * s.factor);
        const stationAqi = calculateIndianAQI({
          ...pollutants,
          pm25: sPm25,
          pm10: sPm10,
        }).aqi;
        return {
          id: s.id,
          name: s.name,
          area: s.area,
          lat: city.lat + s.latOffset,
          lon: city.lon + s.lonOffset,
          aqi: stationAqi,
          pm25: sPm25,
          pm10: sPm10,
          status: 'simulated',
          lastUpdated: now.toISOString(),
        };
      })
    : [
        {
          id: `${city.id}-central`,
          name: `${city.name} Reference Node`,
          area: 'Urban Center',
          lat: city.lat,
          lon: city.lon,
          aqi,
          pm25: pollutants.pm25,
          pm10: pollutants.pm10,
          status: 'simulated',
          lastUpdated: now.toISOString(),
        },
      ];

  return {
    city,
    aqi,
    status: category.label,
    dominantPollutant,
    pollutants,
    weather,
    dataMode: 'simulated',
    dataSource: 'BreatheWell Reference Profile (Offline Simulation)',
    historyMode: 'simulated',
    lastUpdated: now.toISOString(),
    stations,
    history: {
      h24: buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 45, pollutants.pm10 ?? 90, '24h', now),
      d7: buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 45, pollutants.pm10 ?? 90, '7d', now),
      d30: buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 45, pollutants.pm10 ?? 90, '30d', now),
    },
  };
}

export async function getCityAirQuality(params: {
  cityId?: string;
  lat?: number;
  lon?: number;
  name?: string;
  state?: string;
  country?: string;
  bypassCache?: boolean;
}): Promise<AirQualityPayload> {
  const seed = params.cityId ? findCitySeedById(params.cityId) : undefined;
  const city = seed
    ? {
        id: seed.id,
        name: seed.name,
        state: seed.state,
        country: seed.country,
        lat: seed.lat,
        lon: seed.lon,
      }
    : {
        id: params.cityId || `custom-${(params.lat ?? 0).toFixed(2)}-${(params.lon ?? 0).toFixed(2)}`,
        name: params.name || 'Selected Location',
        state: params.state || 'India',
        country: params.country || 'India',
        lat: params.lat ?? 28.6139,
        lon: params.lon ?? 77.209,
      };

  const cacheKey = `${city.id}:${city.lat.toFixed(3)}:${city.lon.toFixed(3)}`;
  const cached = payloadCache.get(cacheKey);
  if (!params.bypassCache && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const aqUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi` +
      `&hourly=pm10,pm2_5&past_days=7&forecast_days=1&timezone=auto`;

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature&timezone=auto`;

    const openAqUrl =
      `https://api.openaq.org/v3/locations?coordinates=${city.lat},${city.lon}&radius=25000&limit=4`;

    const [aqRes, wxRes, openAqRes] = await Promise.allSettled([
      fetchWithTimeout(aqUrl, 4500),
      fetchWithTimeout(weatherUrl, 4500),
      fetchWithTimeout(openAqUrl, 2500),
    ]);

    if (aqRes.status !== 'fulfilled' || !aqRes.value.ok) {
      const fallback = buildSimulatedPayload(city, seed);
      payloadCache.set(cacheKey, { value: fallback, expiresAt: Date.now() + 60_000 });
      return fallback;
    }

    const aqJson = (await aqRes.value.json()) as OpenMeteoAirResponse;
    const current = aqJson.current;
    if (!current || (current.pm2_5 === undefined && current.pm10 === undefined)) {
      const fallback = buildSimulatedPayload(city, seed);
      payloadCache.set(cacheKey, { value: fallback, expiresAt: Date.now() + 60_000 });
      return fallback;
    }

    // Open-Meteo reports CO in µg/m³; Indian NAQI uses mg/m³ (1 mg/m³ = 1000 µg/m³)
    const coMg =
      typeof current.carbon_monoxide === 'number'
        ? Math.round((current.carbon_monoxide / 1000) * 100) / 100
        : null;

    const pollutants: PollutantReadings = {
      pm25: round1(current.pm2_5),
      pm10: round1(current.pm10),
      no2: round1(current.nitrogen_dioxide),
      so2: round1(current.sulphur_dioxide),
      co: coMg,
      o3: round1(current.ozone),
    };

    let weather: WeatherReadings = seed
      ? { ...seed.baselineWeather }
      : { temperature: null, humidity: null, windSpeed: null };

    if (wxRes.status === 'fulfilled' && wxRes.value.ok) {
      const wxJson = (await wxRes.value.json()) as OpenMeteoWeatherResponse;
      if (wxJson.current) {
        weather = {
          temperature: round1(wxJson.current.temperature_2m),
          humidity: round1(wxJson.current.relative_humidity_2m),
          windSpeed: round1(wxJson.current.wind_speed_10m),
          apparentTemperature: round1(wxJson.current.apparent_temperature),
        };
      }
    }

    const { aqi, dominantPollutant } = calculateIndianAQI(pollutants);
    const category = getAQICategory(aqi);
    const nowIso = current.time ? new Date(current.time).toISOString() : new Date().toISOString();

    // Build 24h & 7d history from Open-Meteo hourly arrays when available
    let h24: HistoryPoint[] = [];
    let d7: HistoryPoint[] = [];
    let historyMode: DataMode = 'model';

    if (aqJson.hourly?.time && aqJson.hourly.pm2_5 && aqJson.hourly.pm10) {
      const times = aqJson.hourly.time;
      const pm25s = aqJson.hourly.pm2_5;
      const pm10s = aqJson.hourly.pm10;
      const nowMs = Date.now();

      const validHourly: { ts: Date; pm25: number; pm10: number; aqi: number }[] = [];
      for (let i = 0; i < times.length; i += 1) {
        const ts = new Date(times[i]);
        if (ts.getTime() <= nowMs && typeof pm25s[i] === 'number' && typeof pm10s[i] === 'number') {
          const p25 = Math.round((pm25s[i] as number) * 10) / 10;
          const p10 = Math.round((pm10s[i] as number) * 10) / 10;
          const ptAqi = calculateIndianAQI({ pm25: p25, pm10: p10 }).aqi;
          validHourly.push({ ts, pm25: p25, pm10: p10, aqi: ptAqi });
        }
      }

      if (validHourly.length >= 24) {
        h24 = validHourly.slice(-24).map((p) => ({
          label: `${String(p.ts.getHours()).padStart(2, '0')}:00`,
          timestamp: p.ts.toISOString(),
          aqi: p.aqi,
          pm25: Math.round(p.pm25),
          pm10: Math.round(p.pm10),
        }));

        const dayMap = new Map<string, { sumAqi: number; sum25: number; sum10: number; n: number; ts: Date }>();
        for (const pt of validHourly) {
          const key = pt.ts.toISOString().slice(0, 10);
          const prev = dayMap.get(key) ?? { sumAqi: 0, sum25: 0, sum10: 0, n: 0, ts: pt.ts };
          prev.sumAqi += pt.aqi;
          prev.sum25 += pt.pm25;
          prev.sum10 += pt.pm10;
          prev.n += 1;
          dayMap.set(key, prev);
        }
        d7 = Array.from(dayMap.values())
          .slice(-7)
          .map((d) => ({
            label: d.ts.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            timestamp: d.ts.toISOString(),
            aqi: Math.round(d.sumAqi / d.n),
            pm25: Math.round(d.sum25 / d.n),
            pm10: Math.round(d.sum10 / d.n),
          }));
      }
    }

    if (h24.length < 12) {
      h24 = buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 40, pollutants.pm10 ?? 80, '24h');
      historyMode = 'simulated';
    }
    if (d7.length < 5) {
      d7 = buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 40, pollutants.pm10 ?? 80, '7d');
    }
    const d30 = buildDeterministicHistory(city.id, aqi, pollutants.pm25 ?? 40, pollutants.pm10 ?? 80, '30d');

    // Nearby stations (OpenAQ when available, otherwise curated station coordinates)
    let stations: MonitoringStation[] = [];
    let hasOpenAqStations = false;
    if (openAqRes.status === 'fulfilled' && openAqRes.value.ok) {
      try {
        const oaJson = (await openAqRes.value.json()) as OpenAQResponse;
        if (Array.isArray(oaJson.results) && oaJson.results.length > 0) {
          hasOpenAqStations = true;
          stations = oaJson.results.map((st, idx) => ({
            id: `openaq-${st.id ?? idx}`,
            name: st.name || `${city.name} Station ${idx + 1}`,
            area: st.locality || city.state,
            lat: st.coordinates?.latitude ?? city.lat,
            lon: st.coordinates?.longitude ?? city.lon,
            aqi: null,
            pm25: null,
            pm10: null,
            status: 'measured',
            lastUpdated: st.datetimeLast?.utc || nowIso,
          }));
        }
      } catch {
        hasOpenAqStations = false;
      }
    }

    if (!hasOpenAqStations) {
      if (seed) {
        stations = seed.stations.map((s) => {
          const factor = s.factor;
          const sPm25 = pollutants.pm25 !== null ? Math.round(pollutants.pm25 * factor) : null;
          const sPm10 = pollutants.pm10 !== null ? Math.round(pollutants.pm10 * factor) : null;
          return {
            id: s.id,
            name: s.name,
            area: s.area,
            lat: city.lat + s.latOffset,
            lon: city.lon + s.lonOffset,
            aqi: sPm25 !== null ? calculateIndianAQI({ pm25: sPm25, pm10: sPm10 }).aqi : aqi,
            pm25: sPm25,
            pm10: sPm10,
            status: 'model',
            lastUpdated: nowIso,
          };
        });
      } else {
        stations = [
          {
            id: `${city.id}-grid`,
            name: `${city.name} Atmospheric Grid`,
            area: city.state,
            lat: city.lat,
            lon: city.lon,
            aqi,
            pm25: pollutants.pm25,
            pm10: pollutants.pm10,
            status: 'model',
            lastUpdated: nowIso,
          },
        ];
      }
    }

    const payload: AirQualityPayload = {
      city,
      aqi,
      usAqi: typeof current.us_aqi === 'number' ? Math.round(current.us_aqi) : null,
      europeanAqi: typeof current.european_aqi === 'number' ? Math.round(current.european_aqi) : null,
      status: category.label,
      dominantPollutant,
      pollutants,
      weather,
      dataMode: 'model',
      dataSource: hasOpenAqStations
        ? 'Open-Meteo Free Air Quality API + OpenAQ Stations (Live)'
        : 'Open-Meteo Free Air Quality & Weather API (Live)',
      historyMode,
      lastUpdated: nowIso,
      stations,
      history: { h24, d7, d30 },
    };

    payloadCache.set(cacheKey, { value: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    return payload;
  } catch {
    const fallback = buildSimulatedPayload(city, seed);
    payloadCache.set(cacheKey, { value: fallback, expiresAt: Date.now() + 60_000 });
    return fallback;
  }
}

export async function getAllIndianCitySummaries(): Promise<CitySummary[]> {
  const results = await Promise.all(
    INDIAN_CITIES.map(async (seed) => {
      const payload = await getCityAirQuality({ cityId: seed.id });
      return {
        id: seed.id,
        name: seed.name,
        state: seed.state,
        country: seed.country,
        lat: seed.lat,
        lon: seed.lon,
        featured: Boolean(seed.featured),
        aqi: payload.aqi,
        status: payload.status,
        dominantPollutant: payload.dominantPollutant,
        pm25: payload.pollutants.pm25,
        pm10: payload.pollutants.pm10,
        temperature: payload.weather.temperature,
        humidity: payload.weather.humidity,
        windSpeed: payload.weather.windSpeed,
        dataMode: payload.dataMode,
        dataSource: payload.dataSource,
        lastUpdated: payload.lastUpdated,
      } satisfies CitySummary;
    })
  );
  return results;
}

export async function searchLocations(query: string): Promise<
  Array<{ id: string; name: string; state: string; country: string; lat: number; lon: number; isCurated: boolean }>
> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const curatedMatches = INDIAN_CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
  ).map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    country: c.country,
    lat: c.lat,
    lon: c.lon,
    isCurated: true,
  }));

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
    const res = await fetchWithTimeout(url, 3000);
    if (!res.ok) return curatedMatches;
    const json = (await res.json()) as {
      results?: Array<{
        id: number;
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
      }>;
    };
    const remote = (json.results || []).map((r) => ({
      id: `geo-${r.id}`,
      name: r.name,
      state: r.admin1 || r.country || 'Region',
      country: r.country || 'Global',
      lat: r.latitude,
      lon: r.longitude,
      isCurated: false,
    }));

    const seen = new Set(curatedMatches.map((m) => m.name.toLowerCase()));
    const combined = [...curatedMatches];
    for (const item of remote) {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        combined.push(item);
      }
    }
    return combined.slice(0, 8);
  } catch {
    return curatedMatches;
  }
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<{ name: string; state: string; country: string; matchedCityId?: string }> {
  // Check nearest curated city first for clean canonical names when within 35 km
  let nearestCity: CitySeed | null = null;
  let nearestKm = Infinity;
  for (const city of INDIAN_CITIES) {
    const d = haversineDistanceKm(lat, lon, city.lat, city.lon);
    if (d < nearestKm) {
      nearestKm = d;
      nearestCity = city;
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`;
    const res = await fetchWithTimeout(url, 3500);
    if (res.ok) {
      const json = (await res.json()) as { address?: NominatimAddress };
      const formatted = formatNominatimPlace(json.address);
      if (formatted.name !== 'Current Location') {
        return {
          ...formatted,
          matchedCityId: nearestCity && nearestKm <= 30 ? nearestCity.id : undefined,
        };
      }
    }
  } catch {
    // Fall back to nearest curated city check below
  }

  if (nearestCity && nearestKm <= 50) {
    return {
      name: nearestCity.name,
      state: nearestCity.state,
      country: nearestCity.country,
      matchedCityId: nearestCity.id,
    };
  }

  return {
    name: 'Current Location',
    state: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    country: 'Detected',
  };
}

export interface IpLocationResult {
  lat: number;
  lon: number;
  name: string;
  state: string;
  country: string;
  approximate: true;
}

export async function locateByIp(clientIp: string | null): Promise<IpLocationResult | null> {
  const geoJsUrl = clientIp
    ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(clientIp)}.json`
    : 'https://get.geojs.io/v1/ip/geo.json';

  try {
    const res = await fetchWithTimeout(geoJsUrl, 4000);
    if (res.ok) {
      const data = (await res.json()) as {
        latitude?: string | number;
        longitude?: string | number;
        city?: string;
        region?: string;
        country?: string;
      };
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
        return {
          lat,
          lon,
          name: data.city?.trim() || data.region?.trim() || data.country?.trim() || 'Your Area',
          state: data.region?.trim() || data.country?.trim() || 'Network Location',
          country: data.country?.trim() || 'Detected',
          approximate: true,
        };
      }
    }
  } catch {
    // Try secondary provider below
  }

  const ipWhoUrl = clientIp
    ? `https://ipwho.is/${encodeURIComponent(clientIp)}`
    : 'https://ipwho.is/';

  try {
    const res = await fetchWithTimeout(ipWhoUrl, 4000);
    if (res.ok) {
      const data = (await res.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        region?: string;
        country?: string;
      };
      if (
        data.success !== false &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude)
      ) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          name: data.city?.trim() || data.region?.trim() || data.country?.trim() || 'Your Area',
          state: data.region?.trim() || data.country?.trim() || 'Network Location',
          country: data.country?.trim() || 'Detected',
          approximate: true,
        };
      }
    }
  } catch {
    // Both providers failed
  }

  return null;
}
