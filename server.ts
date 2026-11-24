import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { formatGeminiErrorMessage, generateGeminiChatReply } from './server/geminiChat.ts';
import {
  getAllIndianCitySummaries,
  getCityAirQuality,
  locateByIp,
  reverseGeocodeCoordinates,
  searchLocations,
} from './server/airQualityService.ts';
import { extractPublicClientIp } from './src/utils/location.ts';
import {
  addSearchHistoryEntry,
  authenticateUser,
  clearSearchHistory,
  getDemoUserSession,
  getUserById,
  registerUser,
  toggleFavoriteCity,
  updateUserPreferences,
  verifySessionToken,
} from './server/store.ts';
import type { DemographicGroup } from './src/types.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));

interface AuthReq extends express.Request {
  userId?: string;
}

function requireAuth(req: AuthReq, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const userId = verifySessionToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  req.userId = userId;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/cities', async (_req, res) => {
  try {
    const cities = await getAllIndianCitySummaries();
    res.json({ cities });
  } catch (error) {
    console.error('Failed to load city summaries:', error);
    res.status(500).json({ error: 'Unable to load city air quality summaries.' });
  }
});

app.get('/api/air-quality', async (req, res) => {
  try {
    const cityId = typeof req.query.cityId === 'string' ? req.query.cityId.trim() : undefined;
    const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : undefined;
    const lon = typeof req.query.lon === 'string' ? Number(req.query.lon) : undefined;
    const name = typeof req.query.name === 'string' ? req.query.name.trim().slice(0, 80) : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state.trim().slice(0, 80) : undefined;
    const country = typeof req.query.country === 'string' ? req.query.country.trim().slice(0, 80) : undefined;

    if (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      res.status(400).json({ error: 'Invalid latitude coordinate.' });
      return;
    }
    if (lon !== undefined && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
      res.status(400).json({ error: 'Invalid longitude coordinate.' });
      return;
    }

    const bypassCache = req.query.fresh === '1';
    const payload = await getCityAirQuality({ cityId, lat, lon, name, state, country, bypassCache });
    res.json(payload);
  } catch (error) {
    console.error('Air quality endpoint error:', error);
    res.status(500).json({ error: 'Unable to retrieve air quality data for this location.' });
  }
});

app.get('/api/geocode', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    res.json({ results: [] });
    return;
  }
  try {
    const results = await searchLocations(q.slice(0, 80));
    res.json({ results });
  } catch (error) {
    console.error('Geocode search failed:', error);
    res.status(500).json({ error: 'Location search failed.' });
  }
});

app.get('/api/reverse-geocode', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    res.status(400).json({ error: 'Valid latitude and longitude coordinates are required.' });
    return;
  }
  try {
    const place = await reverseGeocodeCoordinates(lat, lon);
    res.json(place);
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    res.json({
      name: 'Current Location',
      state: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      country: 'Detected',
    });
  }
});

app.get('/api/locate-ip', async (req, res) => {
  try {
    const clientIp = extractPublicClientIp(
      req.headers['x-forwarded-for'] || req.headers['x-appengine-user-ip'],
      req.headers['x-real-ip'],
      req.socket?.remoteAddress
    );
    const result = await locateByIp(clientIp);
    if (!result) {
      res.status(502).json({ error: 'Unable to approximate your location from your network address.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('IP location fallback failed:', error);
    res.status(502).json({ error: 'Unable to determine approximate location right now.' });
  }
});

// Authentication & User Persistence Routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };
  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  try {
    const session = registerUser(name, email, password);
    res.status(201).json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  try {
    const session = authenticateUser(email, password);
    res.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid credentials.';
    res.status(401).json({ error: message });
  }
});

app.post('/api/auth/demo', (_req, res) => {
  try {
    const session = getDemoUserSession();
    res.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Demo login unavailable.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthReq, res) => {
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }
  res.json({ user });
});

app.post('/api/user/favorites', requireAuth, (req: AuthReq, res) => {
  const { cityId } = req.body as { cityId?: string };
  if (!cityId || typeof cityId !== 'string' || cityId.trim().length === 0) {
    res.status(400).json({ error: 'City ID is required.' });
    return;
  }
  try {
    const user = toggleFavoriteCity(req.userId!, cityId.trim().slice(0, 64));
    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update favorites.';
    res.status(400).json({ error: message });
  }
});

app.post('/api/user/history', requireAuth, (req: AuthReq, res) => {
  const { cityId, cityName, state, aqi } = req.body as {
    cityId?: string;
    cityName?: string;
    state?: string;
    aqi?: number;
  };
  if (!cityId || !cityName || typeof aqi !== 'number') {
    res.status(400).json({ error: 'Valid city search details are required.' });
    return;
  }
  try {
    const user = addSearchHistoryEntry(req.userId!, {
      cityId: cityId.slice(0, 64),
      cityName: cityName.slice(0, 80),
      state: (state || 'India').slice(0, 80),
      aqi: Math.round(aqi),
      timestamp: new Date().toISOString(),
    });
    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update search history.';
    res.status(400).json({ error: message });
  }
});

app.delete('/api/user/history', requireAuth, (req: AuthReq, res) => {
  try {
    const user = clearSearchHistory(req.userId!);
    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not clear history.';
    res.status(400).json({ error: message });
  }
});

app.patch('/api/user/preferences', requireAuth, (req: AuthReq, res) => {
  const body = req.body as {
    thresholdAqi?: number;
    emailAlerts?: boolean;
    browserAlerts?: boolean;
    sensitiveGroup?: DemographicGroup;
  };
  try {
    const user = updateUserPreferences(req.userId!, body);
    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save preferences.';
    res.status(400).json({ error: message });
  }
});

// BreatheAI Server-Side Gemini API Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        'BreatheAI requires a GEMINI_API_KEY configured on the server. Please add it in Settings > Secrets.',
    });
    return;
  }

  const { message, history, language, context } = req.body as {
    message?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    language?: 'en' | 'hi';
    context?: {
      cityName?: string;
      state?: string;
      aqi?: number;
      status?: string;
      dominantPollutant?: string;
      pm25?: number | null;
      pm10?: number | null;
      no2?: number | null;
      o3?: number | null;
      temperature?: number | null;
      humidity?: number | null;
      windSpeed?: number | null;
      dataMode?: string;
      sensitiveGroup?: string;
    };
  };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Please enter a question for BreatheAI.' });
    return;
  }

  const trimmedMessage = message.trim().slice(0, 1200);
  const ctxSummary = context
    ? `Selected location: ${context.cityName || 'Unknown'}, ${context.state || ''}.
Current AQI: ${context.aqi ?? 'Unknown'} (${context.status || 'Unknown'}).
Dominant pollutant: ${context.dominantPollutant || 'PM2.5'}.
Pollutants: PM2.5 = ${context.pm25 ?? 'Unavailable'} µg/m³, PM10 = ${context.pm10 ?? 'Unavailable'} µg/m³, NO2 = ${context.no2 ?? 'Unavailable'} µg/m³, O3 = ${context.o3 ?? 'Unavailable'} µg/m³.
Weather: Temperature = ${context.temperature ?? 'N/A'}°C, Humidity = ${context.humidity ?? 'N/A'}%, Wind = ${context.windSpeed ?? 'N/A'} km/h.
Data mode: ${context.dataMode || 'model'}.
User profile group: ${context.sensitiveGroup || 'general'}.`
    : 'No specific location context provided.';

  const languageGuideline =
    language === 'hi'
      ? '- Respond entirely in clear, natural Hindi (Devanagari script) using everyday terms easy for residents to follow.'
      : '- Respond in clear, natural English.';

  const systemInstruction = `You are BreatheAI, the urban air quality health guidance assistant for BreatheWell.
Your role is to help residents understand current air quality and take practical, evidence-based exposure precautions.

Live Location Context:
${ctxSummary}

Guidelines:
${languageGuideline}
- Always ground your answer in the selected city's current AQI, dominant pollutant, and weather conditions when relevant.
- Give clear, concise, structured advice (short paragraphs or crisp bullet points under 180 words).
- Tailor precautions for sensitive groups (children, seniors, outdoor workers, respiratory sensitivities) if asked or if the user profile indicates one.
- Mention practical protective steps: timing outdoor activity around wind dispersion, N95/FFP2 respirator fit when PM2.5 is elevated, and indoor ventilation or HEPA filtration.
- Never provide medical diagnoses, prescribe medications, or make unsupported clinical claims. Always include a brief reminder that guidance is informational and not a substitute for professional medical advice.`;

  try {
    const conversationLines = (Array.isArray(history) ? history.slice(-6) : [])
      .map((m) => `${m.role === 'user' ? 'User' : 'BreatheAI'}: ${String(m.content).slice(0, 600)}`)
      .join('\n');

    const prompt = conversationLines
      ? `Previous conversation:\n${conversationLines}\n\nUser: ${trimmedMessage}`
      : trimmedMessage;

    const { reply } = await generateGeminiChatReply({
      apiKey,
      prompt,
      systemInstruction,
    });

    res.json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : 502;
    const httpStatus = status === 400 || status === 401 || status === 403 ? status : 502;
    res.status(httpStatus).json({
      error: formatGeminiErrorMessage(error, language === 'hi' ? 'hi' : 'en'),
    });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`BreatheWell server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
