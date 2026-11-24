import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DemographicGroup, SearchHistoryEntry, UserPreferences, UserProfile } from '../src/types.ts';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  isDemo?: boolean;
  favorites: string[];
  searchHistory: SearchHistoryEntry[];
  preferences: UserPreferences;
  createdAt: string;
}

interface DbSchema {
  users: StoredUser[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'breathewell-db.json');

// Session signing secret from env or ephemeral runtime fallback (never hardcoded)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function defaultPreferences(): UserPreferences {
  return {
    thresholdAqi: 150,
    emailAlerts: true,
    browserAlerts: true,
    sensitiveGroup: 'general',
  };
}

function readDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const demoSalt = crypto.randomBytes(16).toString('hex');
    const demoUser: StoredUser = {
      id: 'user-demo-breathewell',
      name: 'Aarav Sharma',
      email: 'demo@breathewell.in',
      salt: demoSalt,
      passwordHash: hashPassword('BreatheWellDemo2026!', demoSalt),
      isDemo: true,
      favorites: ['bengaluru', 'new-delhi', 'mumbai'],
      searchHistory: [
        {
          cityId: 'bengaluru',
          cityName: 'Bengaluru',
          state: 'Karnataka',
          aqi: 62,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          cityId: 'new-delhi',
          cityName: 'New Delhi',
          state: 'Delhi NCR',
          aqi: 314,
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        },
      ],
      preferences: {
        thresholdAqi: 150,
        emailAlerts: true,
        browserAlerts: true,
        sensitiveGroup: 'general',
      },
      createdAt: new Date().toISOString(),
    };
    const initial: DbSchema = { users: [demoUser] };
    writeDb(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DbSchema;
    if (!Array.isArray(parsed.users)) return { users: [] };
    return parsed;
  } catch {
    return { users: [] };
  }
}

function writeDb(db: DbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function toPublicProfile(user: StoredUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isDemo: Boolean(user.isDemo),
    favorites: [...user.favorites],
    searchHistory: [...user.searchHistory],
    preferences: { ...user.preferences },
  };
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string;
      exp?: number;
    };
    if (!decoded.uid || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return decoded.uid;
  } catch {
    return null;
  }
}

export function getUserById(userId: string): UserProfile | null {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  return user ? toPublicProfile(user) : null;
}

export function registerUser(name: string, email: string, password: string): { user: UserProfile; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const db = readDb();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: StoredUser = {
    id: `user-${crypto.randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash: hashPassword(password, salt),
    favorites: ['bengaluru'],
    searchHistory: [],
    preferences: defaultPreferences(),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  return {
    user: toPublicProfile(newUser),
    token: createSessionToken(newUser.id),
  };
}

export function authenticateUser(email: string, password: string): { user: UserProfile; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const db = readDb();
  const user = db.users.find((u) => u.email === normalizedEmail);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  return {
    user: toPublicProfile(user),
    token: createSessionToken(user.id),
  };
}

export function getDemoUserSession(): { user: UserProfile; token: string } {
  const db = readDb();
  const demo = db.users.find((u) => u.isDemo) || db.users[0];
  if (!demo) {
    throw new Error('Demo account unavailable.');
  }
  return {
    user: toPublicProfile(demo),
    token: createSessionToken(demo.id),
  };
}

export function toggleFavoriteCity(userId: string, cityId: string): UserProfile {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  if (user.favorites.includes(cityId)) {
    user.favorites = user.favorites.filter((id) => id !== cityId);
  } else {
    user.favorites = [cityId, ...user.favorites].slice(0, 12);
  }
  writeDb(db);
  return toPublicProfile(user);
}

export function addSearchHistoryEntry(userId: string, entry: SearchHistoryEntry): UserProfile {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  const filtered = user.searchHistory.filter((item) => item.cityId !== entry.cityId);
  user.searchHistory = [entry, ...filtered].slice(0, 15);
  writeDb(db);
  return toPublicProfile(user);
}

export function clearSearchHistory(userId: string): UserProfile {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');
  user.searchHistory = [];
  writeDb(db);
  return toPublicProfile(user);
}

const VALID_GROUPS: DemographicGroup[] = [
  'general',
  'children',
  'seniors',
  'outdoor_workers',
  'respiratory',
];

export function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): UserProfile {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  if (typeof updates.thresholdAqi === 'number' && Number.isFinite(updates.thresholdAqi)) {
    user.preferences.thresholdAqi = Math.max(50, Math.min(400, Math.round(updates.thresholdAqi)));
  }
  if (typeof updates.emailAlerts === 'boolean') {
    user.preferences.emailAlerts = updates.emailAlerts;
  }
  if (typeof updates.browserAlerts === 'boolean') {
    user.preferences.browserAlerts = updates.browserAlerts;
  }
  if (updates.sensitiveGroup && VALID_GROUPS.includes(updates.sensitiveGroup)) {
    user.preferences.sensitiveGroup = updates.sensitiveGroup;
  }

  writeDb(db);
  return toPublicProfile(user);
}
